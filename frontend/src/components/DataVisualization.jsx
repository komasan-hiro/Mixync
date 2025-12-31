import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { API_BASE_URL } from '../config';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function DataVisualization() {
    const [events, setEvents] = useState([]);
    const [viewMode, setViewMode] = useState('slope'); // 'slope', 'mixing', 'comfort'

    // EXPERIMENTAL DATA FLAG
    const USE_DEMO_DATA = true;

    useEffect(() => {
        if (USE_DEMO_DATA) {
            // Hardcoded data from 10/30 to 11/4
            // Calculation logic:
            // NormSlope = Slope / 0.2 (clamped 0-1)
            // NormStd = Std / 15 (clamped 0-1)
            // Objective = ((1-NormSlope) + (1-NormStd)) / 2
            // Comfort = (Objective * 0.7 + ((Mood-1)/4) * 0.3) * 100

            const demoEvents = [
                {
                    alarm_time: '2025-10-30T07:00:00',
                    mixing_pattern: 'C', // Shimmer Reverb
                    awakening_hr_slope: 0.08720,
                    awakening_hr_stddev: 9.75773,
                    mood_rating: 5,
                    comfort_score: 62.0 // Calc: (0.457*0.7 + 1.0*0.3)*100
                },
                {
                    alarm_time: '2025-10-31T07:00:00',
                    mixing_pattern: 'B', // PAN
                    awakening_hr_slope: 0.06301,
                    awakening_hr_stddev: 6.04014,
                    mood_rating: 4,
                    comfort_score: 67.4 // Calc: (0.641*0.7 + 0.75*0.3)*100
                },
                {
                    alarm_time: '2025-11-01T07:00:00',
                    mixing_pattern: 'A', // Tremolo
                    awakening_hr_slope: 0.04382,
                    awakening_hr_stddev: 3.26582,
                    mood_rating: 3,
                    comfort_score: 69.7 // Calc: (0.781*0.7 + 0.5*0.3)*100
                },
                {
                    alarm_time: '2025-11-02T07:00:00',
                    mixing_pattern: 'C', // Shimmer Reverb
                    awakening_hr_slope: 0.09758,
                    awakening_hr_stddev: 5.52011,
                    mood_rating: 5,
                    comfort_score: 70.0 // Calc: (0.572*0.7 + 1.0*0.3)*100
                },
                {
                    alarm_time: '2025-11-03T07:00:00',
                    mixing_pattern: 'A', // Tremolo
                    awakening_hr_slope: 0.04686,
                    awakening_hr_stddev: 3.56463,
                    mood_rating: 3,
                    comfort_score: 68.5 // Calc: (0.764*0.7 + 0.5*0.3)*100
                },
                {
                    alarm_time: '2025-11-04T07:00:00',
                    mixing_pattern: 'B', // PAN
                    awakening_hr_slope: 0.16224,
                    awakening_hr_stddev: 8.73651,
                    mood_rating: 3,
                    comfort_score: 36.2 // Calc: (0.303*0.7 + 0.5*0.3)*100
                }
            ];
            setEvents(demoEvents);
        } else {
            fetchEvents();
        }
    }, []);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('データの取得に失敗しました。');
            const data = await response.json();
            setEvents(data.filter(e => e.comfort_score !== null)); // Only events with complete data
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    // Prepare data for slope graph (Oldest -> Newest)
    const slopeChartData = {
        labels: events
            .filter(e => e.awakening_hr_slope !== null)
            .map(e => new Date(e.alarm_time).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: '覚醒速度 (bpm/sec)',
            data: events
                .filter(e => e.awakening_hr_slope !== null)
                .map(e => parseFloat(e.awakening_hr_slope?.toFixed(3) || 0)),
            borderColor: '#29b6f6',
            backgroundColor: 'rgba(41, 182, 246, 0.1)',
            tension: 0.4
        }]
    };

    // Prepare data for mixing comparison (All patterns A-E)
    // Note: User requested ensuring B is shown. We will show A-E to be safe.
    const mixingStats = ['A', 'B', 'C', 'D', 'E'].map(mixing => {
        const mixingEvents = events.filter(e => e.mixing_pattern === mixing && e.comfort_score !== null);
        const avgComfort = mixingEvents.length > 0
            ? mixingEvents.reduce((sum, e) => sum + e.comfort_score, 0) / mixingEvents.length
            : 0;
        const avgSlope = mixingEvents.length > 0
            ? mixingEvents.reduce((sum, e) => sum + (e.awakening_hr_slope || 0), 0) / mixingEvents.length
            : 0;

        return {
            mixing,
            comfort: parseFloat(avgComfort.toFixed(1)),
            slope: parseFloat(avgSlope.toFixed(3)),
            count: mixingEvents.length
        };
    }).filter(m => m.count > 0 || USE_DEMO_DATA); // Show all if demo data, otherwise only active

    const mixingChartData = {
        labels: mixingStats.map(m => m.mixing),
        datasets: [
            {
                label: '平均快適度',
                data: mixingStats.map(m => m.comfort),
                backgroundColor: '#50e3c2',
                yAxisID: 'y'
            },
            {
                label: '平均Slope',
                data: mixingStats.map(m => m.slope * 100), // Scale for visibility
                backgroundColor: '#ab47bc',
                yAxisID: 'y1'
            }
        ]
    };

    // Prepare data for comfort score trend (Oldest -> Newest)
    const comfortChartData = {
        labels: events
            .filter(e => e.comfort_score !== null)
            .map(e => new Date(e.alarm_time).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: '快適度スコア',
            data: events
                .filter(e => e.comfort_score !== null)
                .map(e => parseFloat(e.comfort_score?.toFixed(1) || 0)),
            borderColor: '#50e3c2',
            backgroundColor: 'rgba(80, 227, 194, 0.1)',
            tension: 0.4
        }]
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: '快適度'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Slope (×100)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    return (
        <Paper elevation={2} sx={{ width: '100%', p: 3, mt: 2 }}>
            <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>表示モード</InputLabel>
                    <Select
                        value={viewMode}
                        label="表示モード"
                        onChange={(e) => setViewMode(e.target.value)}
                    >
                        <MenuItem value="slope">覚醒速度（Slope）</MenuItem>
                        <MenuItem value="mixing">ミキシング比較</MenuItem>
                        <MenuItem value="comfort">快適度推移</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {events.length === 0 ? (
                <Typography color="text.secondary">
                    データがまだありません。アラームを使用してデータを収集してください。
                </Typography>
            ) : (
                <>
                    {viewMode === 'slope' && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                覚醒速度（Awakening HR Slope）の推移
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                低い値ほど穏やかな目覚めを示します
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line data={slopeChartData} options={lineOptions} />
                            </Box>
                        </Box>
                    )}

                    {viewMode === 'mixing' && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                各ミキシングの平均快適度とSlope
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Bar data={mixingChartData} options={barOptions} />
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                {mixingStats.map(m => (
                                    <Typography key={m.mixing} variant="caption" color="text.secondary">
                                        {m.mixing}: {m.count}回
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {viewMode === 'comfort' && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                快適度スコアの推移
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                高い値ほど快適な目覚めを示します（最大100点）
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line data={comfortChartData} options={lineOptions} />
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
}

export default DataVisualization;
