const { db } = require('../lib/database');

console.log('Adding is_deleted to alarm_events...');
try {
    db.exec('ALTER TABLE alarm_events ADD COLUMN is_deleted INTEGER DEFAULT 0');
    console.log('Success: Added is_deleted column.');
} catch (e) {
    if (e.message.includes('duplicate column')) {
        console.log('Info: is_deleted column already exists.');
    } else {
        console.error('Error adding column:', e);
    }
}
