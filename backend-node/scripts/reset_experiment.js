const { db } = require('../lib/database');

console.log('--- RESETTING EXPERIMENT DATA ---');
console.log('Use this script to CLEAR all alarm history and start from Day 1.');

try {
    // ONLY clear alarm_events.
    // Users table, Alarms table (settings) are preserved.
    // Sleep logs are also preserved as they are raw data from Fitbit.

    // Check current count
    const beforeCount = db.prepare('SELECT COUNT(*) as count FROM alarm_events').get().count;
    console.log(`Current alarm_events count: ${beforeCount}`);

    console.log('Deleting all alarm events...');
    db.exec('DELETE FROM alarm_events');

    // Verify count is 0
    const afterCount = db.prepare('SELECT COUNT(*) as count FROM alarm_events').get().count;

    console.log(`Deleted all alarm events.`);
    console.log(`New alarm_events count: ${afterCount}`);

    if (afterCount === 0) {
        console.log('-----------------------------------');
        console.log('SUCCESS: Experiment reset to Day 1.');
        console.log('Please restart the server (pm2 restart all) to ensure no cached state remains.');
    } else {
        console.error('ERROR: Failed to delete all rows.');
        process.exit(1);
    }

} catch (err) {
    console.error('Error resetting data:', err);
    process.exit(1);
}
