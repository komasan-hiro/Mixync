const Database = require('better-sqlite3');
const path = require('path');

// Configure DB path
const dbPath = path.join(__dirname, '..', 'biomixer.db');
const db = new Database(dbPath);

console.log('--- Generating Controlled Dummy Data (35 Days) ---');

// 1. Clear existing data
// 1. Clear existing data & Ensure Schema
try {
    console.log('Checking database schema...');
    try {
        db.exec('ALTER TABLE alarm_events ADD COLUMN is_deleted INTEGER DEFAULT 0');
        console.log('Added missing column: is_deleted');
    } catch (e) {
        // Column likely exists
        if (!e.message.includes('duplicate column')) {
            console.log('Schema check passed (column likelihood exists or other error: ' + e.message + ')');
        }
    }

    console.log('Clearing existing alarm_events...');
    db.exec('DELETE FROM alarm_events');
    console.log('Cleared.');
} catch (err) {
    console.error('Error clearing/preparing data:', err);
    process.exit(1);
}

// 2. Configuration
// Date range: 2025/12/01 -> +34 days (total 35)
const START_DATE = new Date('2025-12-01T07:00:00');
const DAYS_COUNT = 35;

// Exact counts for mixing patterns (7 each for A-E)
// We will shuffle them to distribute over the 35 days
const patterns = [];
['A', 'B', 'C', 'D', 'E'].forEach(p => {
    for (let i = 0; i < 7; i++) {
        patterns.push(p);
    }
});

// Shuffle patterns using Fisher-Yates
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const shuffledPatterns = shuffle(patterns);

const getUser = db.prepare('SELECT id FROM users LIMIT 1').get();
const userId = getUser ? getUser.id : 1;

const insertStmt = db.prepare(`
  INSERT INTO alarm_events (
    user_id, alarm_id, alarm_time, mixing_pattern, 
    rang_at_jp, hr_pattern_before, hr_avg_before, hr_std_before,
    hr_pattern_after, hr_peak, awakening_hr_slope, awakening_hr_stddev,
    hr_recovery_time, hrv_avg, hrv_hf, hrv_lf_hf_ratio,
    sleep_stage_before, mood_rating, sound_rating, comfort_score, created_at, is_deleted
  ) VALUES (
    @user_id, @alarm_id, @alarm_time, @mixing_pattern,
    @rang_at_jp, @hr_pattern_before, @hr_avg_before, @hr_std_before,
    @hr_pattern_after, @hr_peak, @awakening_hr_slope, @awakening_hr_stddev,
    @hr_recovery_time, @hrv_avg, @hrv_hf, @hrv_lf_hf_ratio,
    @sleep_stage_before, @mood_rating, @sound_rating, @comfort_score, @created_at, 0
  )
`);

let successCount = 0;

for (let i = 0; i < DAYS_COUNT; i++) {
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + i);

    const mixing = shuffledPatterns[i];

    // Randomize stats slightly to look realistic
    // Slope: lower is smoother/better. Range 0.02 - 0.20
    // Comfort: higher is better. Range 30 - 90
    // Correlate somewhat? Maybe random for now.

    const slope = 0.02 + Math.random() * 0.15;
    const comfort = Math.floor(30 + Math.random() * 60);
    const mood = Math.floor(1 + Math.random() * 5); // 1-5
    const hrPeak = Math.floor(80 + Math.random() * 40);

    const event = {
        user_id: userId,
        alarm_id: 1, // Dummy alarm ID
        alarm_time: date.toISOString(),
        mixing_pattern: mixing,
        rang_at_jp: date.toLocaleString('ja-JP'),
        hr_pattern_before: JSON.stringify([]),
        hr_avg_before: 60 + Math.random() * 10,
        hr_std_before: 2 + Math.random() * 3,
        hr_pattern_after: JSON.stringify([]),
        hr_peak: hrPeak,
        awakening_hr_slope: slope,
        awakening_hr_stddev: 3 + Math.random() * 5,
        hr_recovery_time: 120 + Math.random() * 60,
        hrv_avg: 40 + Math.random() * 20,
        hrv_hf: 200 + Math.random() * 100,
        hrv_lf_hf_ratio: 1.5 + Math.random() * 2.0,
        sleep_stage_before: 'light',
        mood_rating: mood,
        sound_rating: mood,
        comfort_score: comfort,
        created_at: date.toISOString()
    };

    insertStmt.run(event);
    successCount++;
    console.log(`Generated: ${date.toISOString().split('T')[0]} - Pattern: ${mixing}`);
}

console.log(`\nSuccessfully generated ${successCount} events from 2025-12-01 to 2026-01-04.`);
