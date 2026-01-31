const { db } = require('./database');
const { fitbitApiRequest } = require('./fitbit-client');
const axios = require('axios');

// Helper to interpolate HR data
function interpolateHeartRateData(intradayData, targetIntervalSeconds = 5) {
    if (!intradayData || intradayData.length === 0) {
        return [];
    }
    const parseTime = (timeStr) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    };
    const startTime = parseTime(intradayData[0].time);
    const endTime = parseTime(intradayData[intradayData.length - 1].time);
    const dataPoints = intradayData.map(d => ({
        time: parseTime(d.time) - startTime,
        value: d.value
    }));
    const interpolated = [];
    const totalDuration = endTime - startTime;
    for (let t = 0; t <= totalDuration; t += targetIntervalSeconds) {
        let before = null;
        let after = null;
        for (let i = 0; i < dataPoints.length; i++) {
            if (dataPoints[i].time <= t) before = dataPoints[i];
            if (dataPoints[i].time >= t && !after) { after = dataPoints[i]; break; }
        }
        let value;
        if (before && after && before.time !== after.time) {
            const ratio = (t - before.time) / (after.time - before.time);
            value = before.value + ratio * (after.value - before.value);
        } else if (before) value = before.value;
        else if (after) value = after.value;
        else continue;
        interpolated.push(Math.round(value));
    }
    return interpolated;
}

// Helper to calculate stats
function calculateStats(data) {
    if (!data || data.length === 0) return { avg: 0, std: 0 };
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(variance);
    return { avg, std };
}

// Core Logic: Process Pre-Alarm
async function processPreAlarm(userId, alarmId) {
    console.log(`[ALARM-LOGIC] Starting pre-process for alarm ${alarmId}, user ${userId}`);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('User not found');

    const alarm = db.prepare('SELECT * FROM alarms WHERE id = ? AND user_id = ?').get(alarmId, userId);
    if (!alarm) throw new Error('Alarm not found');

    // 1. Create Event (5 mins before alarm)
    const alarmTime = new Date(Date.now() + 5 * 60 * 1000);
    const insertStmt = db.prepare(`
        INSERT INTO alarm_events (
            user_id, alarm_id, alarm_time, mixing_pattern, rang_at_jp
        ) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
    `);
    const eventInfo = insertStmt.run(userId, alarmId, alarmTime.toISOString(), 'AUTO');
    const eventId = eventInfo.lastInsertRowid;
    console.log(`[ALARM-LOGIC] Created event ${eventId} for alarm ${alarmId}`);

    // 2. Fetch HR Data (30 mins ago to 15 mins ago)
    const endTime = new Date(alarmTime.getTime() - 15 * 60 * 1000);
    const startTime = new Date(alarmTime.getTime() - 30 * 60 * 1000);

    let recommendedMixing = 'A'; // Default
    let confidence = 0;
    let hrValues = [];
    let stats = { avg: 0, std: 0 };

    try {
        if (user.fitbit_access_token) {
            // Force JST
            const jstStart = new Date(startTime.getTime() + 9 * 60 * 60 * 1000);
            const jstEnd = new Date(endTime.getTime() + 9 * 60 * 60 * 1000);
            const dateStr = jstStart.toISOString().split('T')[0];
            const tStart = jstStart.toISOString().split('T')[1].substring(0, 8);
            const tEnd = jstEnd.toISOString().split('T')[1].substring(0, 8);

            const url = `https://api.fitbit.com/1/user/-/activities/heart/date/${dateStr}/1d/1sec/time/${tStart}/${tEnd}.json`;
            const hrRes = await fitbitApiRequest(url, user);
            const intradayData = hrRes.data['activities-heart-intraday']?.dataset || [];

            if (intradayData.length > 0) {
                hrValues = interpolateHeartRateData(intradayData, 5);
                stats = calculateStats(hrValues);

                // Store HR
                db.prepare(`
                    UPDATE alarm_events 
                    SET hr_pattern_before = ?, hr_avg_before = ?, hr_std_before = ?
                    WHERE id = ?
                `).run(JSON.stringify(hrValues), stats.avg, stats.std, eventId);
                console.log(`[ALARM-LOGIC] Stored ${hrValues.length} HR points`);

                // Progression Logic
                const countRes = db.prepare(`
                    SELECT COUNT(*) as count FROM alarm_events 
                    WHERE user_id = ? AND comfort_score IS NOT NULL AND id != ?
                `).get(userId, eventId);
                const eventCount = countRes.count || 0;
                console.log(`[ALARM-LOGIC] Completed events count: ${eventCount}`);

                if (eventCount < 20) {
                    const phaseIndex = Math.floor(eventCount / 4);
                    const patterns = ['A', 'B', 'C', 'D', 'E'];
                    recommendedMixing = patterns[phaseIndex] || 'A';
                    confidence = 1.0;
                    console.log(`[ALARM-LOGIC] Phase ${phaseIndex}: Forcing ${recommendedMixing}`);
                } else {
                    // AI Phase
                    console.log(`[ALARM-LOGIC] AI Phase (25+). Calling DTW...`);
                    const pastEvents = db.prepare(`
                        SELECT id as event_id, hr_pattern_before, mixing_pattern, comfort_score
                        FROM alarm_events
                        WHERE user_id = ? AND id != ? AND hr_pattern_before IS NOT NULL AND comfort_score IS NOT NULL
                        ORDER BY alarm_time DESC
                    `).all(userId, eventId);

                    if (pastEvents.length >= 3) {
                        try {
                            const parsedEvents = pastEvents.map(e => ({
                                event_id: e.event_id,
                                hr_pattern_before: JSON.parse(e.hr_pattern_before),
                                mixing_pattern: e.mixing_pattern,
                                comfort_score: e.comfort_score
                            }));
                            const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';
                            const pyRes = await axios.post(`${pythonUrl}/recommend-mixing`, {
                                current_pattern: hrValues,
                                past_events: parsedEvents
                            });
                            recommendedMixing = pyRes.data.recommended_mixing;
                            confidence = pyRes.data.confidence;
                            console.log(`[ALARM-LOGIC] DTW Recommendation: ${recommendedMixing}`);
                        } catch (pyErr) {
                            console.error('[ALARM-LOGIC] DTW Error:', pyErr.message);
                        }
                    }
                }
            } else {
                console.log('[ALARM-LOGIC] No intraday data found.');
            }
        }
    } catch (err) {
        console.error('[ALARM-LOGIC] specific error:', err.message);
    }

    // Update Event & Alarm
    db.prepare('UPDATE alarm_events SET mixing_pattern = ? WHERE id = ?').run(recommendedMixing, eventId);
    // db.prepare('UPDATE alarms SET mixing_pattern = ? WHERE id = ?').run(recommendedMixing, alarmId);
    console.log(`[ALARM-LOGIC] Final Mixing: ${recommendedMixing}`);

    return {
        success: true,
        event_id: eventId,
        recommended_mixing: recommendedMixing,
        confidence,
        hr_data: { pattern: hrValues, avg: stats.avg, std: stats.std }
    };
}

module.exports = { processPreAlarm, interpolateHeartRateData, calculateStats }; // Export helpers if needed
