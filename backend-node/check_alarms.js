
const { db } = require('./lib/database');
const rows = db.prepare('SELECT id, time, mixing_pattern, is_active FROM alarms WHERE user_id = 1').all();
console.log(JSON.stringify(rows, null, 2));
