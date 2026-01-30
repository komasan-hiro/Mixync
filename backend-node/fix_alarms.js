
const { db } = require('./lib/database');

console.log('Restoring alarms to AUTO...');
const stmt = db.prepare("UPDATE alarms SET mixing_pattern = 'AUTO' WHERE user_id = 1 AND mixing_pattern != 'AUTO'");
const info = stmt.run();

console.log(`Updated ${info.changes} alarms to AUTO.`);

const rows = db.prepare('SELECT id, time, mixing_pattern FROM alarms WHERE user_id = 1').all();
console.log('Current Alarms:', JSON.stringify(rows, null, 2));
