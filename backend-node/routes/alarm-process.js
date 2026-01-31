const express = require('express');
const { db } = require('../lib/database');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const { fitbitApiRequest } = require('../lib/fitbit-client');
const { processPreAlarm, interpolateHeartRateData } = require('../lib/alarm-logic');

const router = express.Router();

// Apply JWT authentication to all routes
router.use(authenticateToken);

// POST /api/alarm/pre-process - Process alarm 5 minutes before
router.post('/pre-process', async (req, res) => {
    try {
        const userId = req.user.id;
        const { alarm_id } = req.body;

        if (!alarm_id) {
            return res.status(400).json({ message: 'alarm_id is required.' });
        }

        // Call shared logic
        const result = await processPreAlarm(userId, alarm_id);

        res.status(200).json(result);

    } catch (error) {
        console.error('[PRE-PROCESS] Error:', error);
        res.status(500).json({
            success: false,
            recommended_mixing: 'A', // Fallback
            message: error.message || 'Failed to process pre-alarm data.'
        });
    }
});

// POST /api/alarm/post-process - Process after waking up
router.post('/post-process', async (req, res) => {
    try {
        const userId = req.user.id;
        const { event_id } = req.body;

        if (!event_id) {
            return res.status(400).json({
                message: 'event_id is required.'
            });
        }

        console.log('[POST-PROCESS] Starting for event:', event_id);

        // Get alarm time from event
        const eventStmt = db.prepare('SELECT alarm_time FROM alarm_events WHERE id = ? AND user_id = ?');
        const event = eventStmt.get(event_id, userId);

        if (!event) {
            return res.status(404).json({ message: 'Alarm event not found.' });
        }

        // Calculate time range: alarm time to 3 minutes after
        const alarmDate = new Date(event.alarm_time);
        const startTime = alarmDate;
        const endTime = new Date(alarmDate.getTime() + 3 * 60 * 1000); // 3 min after

        // Fetch heart rate data from Fitbit using shared client (handles token refresh)
        // Re-implementing fetch here to reuse fitbitApiRequest logic, or we could extract this too?
        // Ideally we should extract it, but for now copying the robust fetch logic is okay or using fitbit-client.

        // Let's implement fetch here using fitbitApiRequest directly to be safe.
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user || !user.fitbit_access_token) {
            throw new Error('Fitbit not connected');
        }

        const formatJST = (date) => {
            const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
            return {
                dateStr: jstDate.toISOString().split('T')[0],
                timeStr: jstDate.toISOString().split('T')[1].substring(0, 8)
            };
        };
        const startJST = formatJST(startTime);
        const endJST = formatJST(endTime);
        const url = `https://api.fitbit.com/1/user/-/activities/heart/date/${startJST.dateStr}/1d/1sec/time/${startJST.timeStr}/${endJST.timeStr}.json`;

        const hrResponse = await fitbitApiRequest(url, user);

        // Extract intraday data
        const intradayData = hrResponse.data['activities-heart-intraday']?.dataset || [];

        if (intradayData.length === 0) {
            return res.status(400).json({
                message: 'No heart rate data available for the specified time range.'
            });
        }

        // Interpolate irregular data to regular 1-second intervals
        const hrValues = interpolateHeartRateData(intradayData, 1);

        if (hrValues.length === 0) {
            return res.status(400).json({
                message: 'Failed to interpolate heart rate data.'
            });
        }

        // Calculate peak
        const hrPeak = Math.max(...hrValues);

        // Calculate average and intensity (peak - avg) / avg
        const avg = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
        const intensity = (hrPeak - avg) / avg;

        // Call Python backend to calculate slope and stddev
        let awakeningMetrics = { awakening_hr_slope: null, awakening_hr_stddev: null };

        try {
            const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';
            const pythonResponse = await axios.post(`${pythonUrl}/calculate-awakening-metrics`, {
                hr_values: hrValues
            });

            awakeningMetrics = pythonResponse.data;
            console.log('[POST-PROCESS] Python metrics:', awakeningMetrics);
        } catch (pythonError) {
            console.error('[POST-PROCESS] Python backend error:', pythonError.message);
            // Continue without metrics - they can be calculated later
        }

        // Update database with all data, now including intensity
        const stmt = db.prepare(`
          UPDATE alarm_events 
          SET hr_pattern_after = ?, 
              hr_peak = ?,
              awakening_hr_slope = ?,
              awakening_hr_stddev = ?,
              intensity = ?
          WHERE id = ? AND user_id = ?
        `);

        stmt.run(
            JSON.stringify(hrValues),
            hrPeak,
            awakeningMetrics.awakening_hr_slope,
            awakeningMetrics.awakening_hr_stddev,
            intensity,
            event_id,
            userId
        );

        // Calculate comfort_score automatically
        let comfortScore = null;
        if (awakeningMetrics.awakening_hr_slope !== null && awakeningMetrics.awakening_hr_stddev !== null) {
            // Get current mood_rating if exists
            const moodStmt = db.prepare('SELECT mood_rating FROM alarm_events WHERE id = ?');
            const moodData = moodStmt.get(event_id);
            const moodRating = moodData?.mood_rating || 3; // Default to 3 (普通) if not yet rated

            // ---- Objective metrics ----
            // 1. Normalize slope (0‑1, lower better)
            const normalizeSlope = (slope) => {
                if (slope <= 0) return 0;
                if (slope >= 0.2) return 1;
                return slope / 0.2;
            };
            // 2. Normalize stddev (0‑1, lower better)
            const normalizeStddev = (stddev) => {
                if (stddev <= 0) return 0;
                if (stddev >= 15) return 1;
                return stddev / 15;
            };
            // 3. Normalize intensity (0‑1, lower better)
            const normalizeIntensity = (val) => {
                if (val <= 0) return 0;
                if (val >= 0.5) return 1; // treat 50% increase as worst case
                return val / 0.5;
            };

            const normSlope = normalizeSlope(awakeningMetrics.awakening_hr_slope);
            const normStddev = normalizeStddev(awakeningMetrics.awakening_hr_stddev);
            const normIntensity = normalizeIntensity(intensity);

            // Objective score (70% of total)
            const objectiveScore = (
                (1 - normSlope) * 0.5 +      // Slope 50%
                (1 - normStddev) * 0.25 +    // Stability 25%
                (1 - normIntensity) * 0.25   // Intensity 25%
            );

            // ---- Subjective metric ----
            const normalizedMood = (moodRating - 1) / 4; // 1‑5 → 0‑1

            // Total comfort score (0‑100)
            comfortScore = (objectiveScore * 0.7 + normalizedMood * 0.3) * 100;
            comfortScore = Math.round(comfortScore * 10) / 10;

            // Update comfort_score in database
            const scoreStmt = db.prepare('UPDATE alarm_events SET comfort_score = ? WHERE id = ?');
            scoreStmt.run(comfortScore, event_id);

            console.log('[POST-PROCESS] Calculated comfort_score:', comfortScore);
        }

        console.log('[POST-PROCESS] Completed:', {
            event_id,
            data_points: hrValues.length,
            hr_peak: hrPeak,
            slope: awakeningMetrics.awakening_hr_slope,
            stddev: awakeningMetrics.awakening_hr_stddev,
            comfort_score: comfortScore
        });

        res.status(200).json({
            success: true,
            data_points: hrValues.length,
            hr_peak: hrPeak,
            awakening_hr_slope: awakeningMetrics.awakening_hr_slope,
            awakening_hr_stddev: awakeningMetrics.awakening_hr_stddev,
            comfort_score: comfortScore,
            time_range: {
                start: startTime.toISOString(),
                end: endTime.toISOString()
            }
        });

    } catch (error) {
        console.error('[POST-PROCESS] Error:', error);
        res.status(500).json({
            message: 'Failed to process post-alarm data.',
            error: error.message
        });
    }
});

// POST /api/alarm/recommend - Recommend optimal mixing based on current HR pattern
router.post('/recommend', async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_pattern } = req.body;

        if (!current_pattern || !Array.isArray(current_pattern)) {
            return res.status(400).json({
                message: 'current_pattern array is required.'
            });
        }

        console.log('[RECOMMEND] Starting recommendation for user:', userId);

        // --- Phase Logic Integration (Matching alarm-logic.js) ---
        // Ensure the display matches the actual execution logic (Phase 0-4)
        const countStmt = db.prepare(`
            SELECT COUNT(*) as count 
            FROM alarm_events 
            WHERE user_id = ? AND comfort_score IS NOT NULL
        `);
        const countRes = countStmt.get(userId);
        const eventCount = countRes.count || 0;

        console.log(`[RECOMMEND] Completed events count: ${eventCount}`);

        if (eventCount < 20) {
            const phaseIndex = Math.floor(eventCount / 4);
            const patterns = ['A', 'B', 'C', 'D', 'E'];
            const fixedPattern = patterns[phaseIndex] || 'A';

            console.log(`[RECOMMEND] Phase ${phaseIndex}: Returning fixed pattern ${fixedPattern}`);
            return res.status(200).json({
                recommended_mixing: fixedPattern,
                confidence: 1.0,
                mixing_scores: {},
                similar_events_count: 0,
                note: `Phase ${phaseIndex} (Rule-based transition)`
            });
        }
        // ---------------------------------------------------------

        // Fetch past events with HR patterns and comfort scores
        const stmt = db.prepare(`
      SELECT id, hr_pattern_before, mixing_pattern, comfort_score
      FROM alarm_events
      WHERE user_id = ? 
        AND hr_pattern_before IS NOT NULL 
        AND comfort_score IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 50
    `);
        const pastEvents = stmt.all(userId);

        if (pastEvents.length === 0) {
            // No past data - return default mixing
            console.log('[RECOMMEND] No past data, using default mixing A');
            return res.status(200).json({
                recommended_mixing: 'A',
                confidence: 0.5,
                mixing_scores: {},
                similar_events_count: 0,
                note: 'No past data available, using default mixing A'
            });
        }

        // Format events for Python backend
        const formattedEvents = pastEvents.map(e => ({
            event_id: e.id,
            hr_pattern_before: JSON.parse(e.hr_pattern_before),
            mixing_pattern: e.mixing_pattern,
            comfort_score: e.comfort_score
        }));

        console.log('[RECOMMEND] Calling Python backend with', formattedEvents.length, 'past events');

        // Call Python backend for DTW-based recommendation
        try {
            const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';
            const pythonResponse = await axios.post(`${pythonUrl}/recommend-mixing`, {
                current_pattern: current_pattern,
                past_events: formattedEvents
            });

            console.log('[RECOMMEND] Python recommendation:', pythonResponse.data);

            res.status(200).json(pythonResponse.data);

        } catch (pythonError) {
            console.error('[RECOMMEND] Python backend error:', pythonError.message);

            // Fallback: return default mixing
            res.status(200).json({
                recommended_mixing: 'A',
                confidence: 0.5,
                mixing_scores: {},
                similar_events_count: 0,
                note: 'Python backend unavailable, using default mixing A'
            });
        }

    } catch (error) {
        console.error('[RECOMMEND] Error:', error);
        res.status(500).json({
            message: 'Failed to recommend mixing.',
            error: error.message
        });
    }
});

module.exports = router;
