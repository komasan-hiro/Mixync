const { db } = require('../lib/database');

console.log('--- SEEDING DUMMY DATA (25 Days) ---');

const userId = 1; // Default user
const now = new Date();

// Clear existing data first to avoid duplicates/mess
db.prepare('DELETE FROM alarm_events WHERE user_id = ?').run(userId);
console.log('Cleared existing data for user 1.');

const patterns = ['A', 'B', 'C', 'D', 'E'];

db.transaction(() => {
    for (let i = 0; i < 25; i++) {
        // Timeline: 0 is oldest (24 days ago), 24 is newest (today)
        // Actually, let's make 24 days ago -> 1 day ago to leave today empty?
        // Or just fill up to today. Let's fill up to today.
        // i=0: 24 days ago. i=24: 0 days ago.
        const dayOffset = 24 - i;
        const eventDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

        // Fix time to 07:30:00 JST (approx)
        // Just use local string manipulation for simplicity
        // ISO string is UTC. 7:30 JST = 22:30 UTC previous day.
        // Let's just set the date object hours.
        eventDate.setHours(7, 30, 0, 0); // 7:30 AM Local Time (Server Time)

        const phase = Math.floor(i / 5);
        const pattern = patterns[phase] || 'A';

        // Realistic dummy stats
        const comfortScore = 60 + Math.random() * 35; // 60 - 95
        const hrPeak = 90 + Math.random() * 30; // 90 - 120
        const slope = 0.05 + Math.random() * 0.15; // 0.05 - 0.20

        const stmt = db.prepare(`
            INSERT INTO alarm_events (
                user_id, 
                alarm_time, 
                mixing_pattern, 
                comfort_score, 
                hr_peak, 
                awakening_hr_slope, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            userId,
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
console.log('To clear this data, run: node scripts/reset_experiment.js');
