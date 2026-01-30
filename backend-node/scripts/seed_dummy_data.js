const { db } = require('../lib/database');

console.log('--- SEEDING DUMMY DATA (25 Days) ---');

const userId = 1; // Default user
const now = new Date();

// Clear existing data first to avoid duplicates/mess
db.prepare('DELETE FROM alarm_events WHERE user_id = ?').run(userId);
console.log('Cleared existing data for user 1.');

// --- Fix: Ensure valid alarm_id exists ---
let alarmId;
try {
    const alarmStmt = db.prepare('SELECT id FROM alarms WHERE user_id = ? LIMIT 1');
    const existingAlarm = alarmStmt.get(userId);

    if (existingAlarm) {
        alarmId = existingAlarm.id;
        console.log(`Using existing alarm ID: ${alarmId}`);
    } else {
        console.log('No alarm found. Creating dummy alarm setting...');
        const result = db.prepare(`
            INSERT INTO alarms (user_id, time, sound_file, mixing_pattern, is_active)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, '07:30', 'dummy_sound.mp3', 'AUTO', 1);
        alarmId = result.lastInsertRowid;
        console.log(`Created dummy alarm ID: ${alarmId}`);
    }
} catch (e) {
    console.error('Error finding/creating alarm:', e);
    // Fallback if users table is empty? Should not happen if userId=1 exists.
    // If referencing key fails, it means userId 1 might not exist?
    // We assume user 1 exists.
}
// ----------------------------------------

const patterns = ['A', 'B', 'C', 'D', 'E'];

db.transaction(() => {
    for (let i = 0; i < 25; i++) {
        // Timeline: 0 is oldest (24 days ago), 24 is newest (today)
        const dayOffset = 24 - i;
        const eventDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

        // Fix time to 07:30:00 JST (Server Local Time)
        eventDate.setHours(7, 30, 0, 0);

        const phase = Math.floor(i / 5);
        const pattern = patterns[phase] || 'A';

        // Realistic dummy stats
        const comfortScore = 60 + Math.random() * 35; // 60 - 95
        const hrPeak = 90 + Math.random() * 30; // 90 - 120
        const slope = 0.05 + Math.random() * 0.15; // 0.05 - 0.20

        const stmt = db.prepare(`
            INSERT INTO alarm_events (
                user_id, 
                alarm_id,
                alarm_time, 
                mixing_pattern, 
                comfort_score, 
                hr_peak, 
                awakening_hr_slope, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            userId,
            alarmId,
            eventDate.toISOString(),
            pattern,
            Math.round(comfortScore),
            Math.round(hrPeak),
            slope.toFixed(3),
            eventDate.toISOString()
        );

        console.log(`Day ${i + 1}: ${eventDate.toISOString().split('T')[0]} - Pattern ${pattern} - Score ${Math.round(comfortScore)}`);
    }
})();

console.log('--- SEEDING COMPLETE ---');
console.log('Data for 25 days (A->E) has been inserted.');
