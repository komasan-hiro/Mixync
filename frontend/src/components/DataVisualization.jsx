import React, { useState, useEffect } from 'react';
import {
    Paper, Box, Typography, Select, MenuItem, FormControl, InputLabel,
    IconButton, ToggleButton, ToggleButtonGroup,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
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

// Helper to get Sunday of the week
const getSunday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
};

function DataVisualization() {
    // EXPERIMENTAL DATA FLAG
    const USE_DEMO_DATA = true;

    // Set initial date to Demo Data range if flag is on, otherwise today
    const [currentDate, setCurrentDate] = useState(USE_DEMO_DATA ? new Date('2025-10-30') : new Date());
    const [events, setEvents] = useState([]);
    const [viewMode, setViewMode] = useState('slope'); // 'slope', 'mixing', 'comfort'
    const [displayFormat, setDisplayFormat] = useState('graph'); // 'graph' or 'table'

    useEffect(() => {
        if (USE_DEMO_DATA) {
            // Hardcoded data from 10/30 to 11/4
            const demoEvents = [
                {
                    id: 1,
                    alarm_time: '2025-10-30T07:00:00',
                    mixing_pattern: 'C', // Shimmer Reverb
                    awakening_hr_slope: 0.08720,
                    awakening_hr_stddev: 9.75773,
                    mood_rating: 5,
                    comfort_score: 62.0
                },
                {
                    id: 2,
                    alarm_time: '2025-10-31T07:00:00',
                    mixing_pattern: 'B', // PAN
                    awakening_hr_slope: 0.06301,
                    awakening_hr_stddev: 6.04014,
                    mood_rating: 4,
                    comfort_score: 67.4
                },
                {
                    id: 3,
                    alarm_time: '2025-11-01T07:00:00',
                    mixing_pattern: 'A', // Tremolo
                    awakening_hr_slope: 0.04382,
                    awakening_hr_stddev: 3.26582,
                    mood_rating: 3,
                    comfort_score: 69.7
                },
                {
                    id: 4,
                    alarm_time: '2025-11-02T07:00:00',
                    mixing_pattern: 'C', // Shimmer Reverb
                    awakening_hr_slope: 0.09758,
                    awakening_hr_stddev: 5.52011,
                    mood_rating: 5,
                    comfort_score: 70.0
                },
                {
                    id: 5,
                    alarm_time: '2025-11-03T07:00:00',
                    mixing_pattern: 'A', // Tremolo
                    awakening_hr_slope: 0.04686,
                    awakening_hr_stddev: 3.56463,
                    mood_rating: 3,
                    comfort_score: 68.5
                },
                {
                    id: 6,
                    alarm_time: '2025-11-04T07:00:00',
                    mixing_pattern: 'B', // PAN
                    awakening_hr_slope: 0.16224,
                    awakening_hr_stddev: 8.73651,
                    mood_rating: 3,
                    comfort_score: 36.2
                }
            ];
            setEvents(demoEvents);
        } else {
            fetchEvents();
        }
    }, [USE_DEMO_DATA]);

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
            setEvents(data.filter(e => e.comfort_score !== null));
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    // --- Weekly Navigation Logic ---
    const changeWeek = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + amount * 7);
        setCurrentDate(newDate);
    };

    const getWeekRange = () => {
        const sunday = getSunday(currentDate);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        return { start: sunday, end: saturday };
    };

    const { start, end } = getWeekRange();
    const dateRangeString = `${start.toLocaleDateString()} ～ ${end.toLocaleDateString()}`;

    // Filter events for current week
    // Set end date to end of day for comparison
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    const weeklyEvents = events.filter(e => {
        const d = new Date(e.alarm_time);
        return d >= start && d <= endOfDay;
    });

    // Sort by date ascending
    weeklyEvents.sort((a, b) => new Date(a.alarm_time) - new Date(b.alarm_time));


    // --- Chart Data Preparation ---

    const slopeChartData = {
        labels: weeklyEvents
            .filter(e => e.awakening_hr_slope !== null)
            .map(e => new Date(e.alarm_time).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: '覚醒速度 (bpm/sec)',
            data: weeklyEvents
                .filter(e => e.awakening_hr_slope !== null)
                .map(e => parseFloat(e.awakening_hr_slope?.toFixed(3) || 0)),
            borderColor: '#29b6f6',
            backgroundColor: 'rgba(41, 182, 246, 0.1)',
            tension: 0.4
        }]
    };

    // For mixing, we calculate stats based on validity within the week? 
    // Usually "Mixing Comparison" might be better over all time, BUT user asked for "Weekly view like SleepChart".
    // So we will show stats ONLY for this week.
    // However, if count is low, it might be boring. But that's the request.
    const mixingStats = ['A', 'B', 'C', 'D', 'E'].map(mixing => {
        const mixingEvents = weeklyEvents.filter(e => e.mixing_pattern === mixing && e.comfort_score !== null);
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
    });
    // Filter out 0 count unless demo data? 
    // Actually, showing 0s is fine to indicate no data for that pattern this week.
    // Let's filter out if ALL are zero? Or just keep A-E structure.

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
                data: mixingStats.map(m => m.slope * 100),
                backgroundColor: '#ab47bc',
                yAxisID: 'y1'
            }
        ]
    };

    const comfortChartData = {
        labels: weeklyEvents
            .filter(e => e.comfort_score !== null)
            .map(e => new Date(e.alarm_time).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: '快適度スコア',
            data: weeklyEvents
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
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: '快適度' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Slope (×100)' },
                grid: { drawOnChartArea: false }
            }
        }
    };

    const handleFormatChange = (event, newFormat) => {
        if (newFormat !== null) {
            setDisplayFormat(newFormat);
        }
    };

    return (
        <Paper elevation={2} sx={{ width: '100%', p: 3, mt: 2 }}>

            {/* Header: Title and Toggles */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h6" gutterBottom>データ可視化</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {dateRangeString}
                    </Typography>
                </Box>

                <ToggleButtonGroup
                    value={displayFormat}
                    exclusive
                    onChange={handleFormatChange}
                    size="small"
                >
                    <ToggleButton value="graph">
                        <BarChartIcon sx={{ mr: 1 }} /> グラフ
                    </ToggleButton>
                    <ToggleButton value="table">
                        <TableChartIcon sx={{ mr: 1 }} /> データ
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Navigation: Prev/Next Week */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => changeWeek(-1)} size="small">
                    <ChevronLeftIcon />
                </IconButton>
                <Typography sx={{ mx: 2, fontWeight: 500 }}>
                    {dateRangeString}
                </Typography>
                <IconButton onClick={() => changeWeek(1)} size="small">
                    <ChevronRightIcon />
                </IconButton>
            </Box>

            {/* View Mode Selector (Only needed for Graph view primarily, but maybe filters table too?
                User said "Table view" should show numerical data. 
                Keep selector consistent for both? Or maybe table shows ALL columns?
                Let's keep the selector active to filter what is emphasized, OR just show relevant columns in table.
                Actually, mixing view requires different aggregation.
                Let's keep the view selector at the top as before to control CONTEXT.
            */}
            <Box sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
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

            {weeklyEvents.length === 0 && mixingStats.every(m => m.count === 0) ? (
                <Typography color="text.secondary" align="center" sx={{ my: 4 }}>
                    この週のデータはありません。
                </Typography>
            ) : (
                <Box>
                    {displayFormat === 'graph' ? (
                        <>
                            {viewMode === 'slope' && (
                                <Box>
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
                                    <Box sx={{ height: 300 }}>
                                        <Line data={comfortChartData} options={lineOptions} />
                                    </Box>
                                </Box>
                            )}
                        </>
                    ) : (
                        /* DATA TABLE VIEW */
                        <TableContainer>
                            {viewMode === 'mixing' ? (
                                /* Aggregate Table for Mixing */
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>パターン</TableCell>
                                            <TableCell align="right">回数</TableCell>
                                            <TableCell align="right">平均快適度</TableCell>
                                            <TableCell align="right">平均Slope</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mixingStats.filter(m => m.count > 0).map((row) => (
                                            <TableRow key={row.mixing}>
                                                <TableCell component="th" scope="row">{row.mixing}</TableCell>
                                                <TableCell align="right">{row.count}</TableCell>
                                                <TableCell align="right">{row.comfort}</TableCell>
                                                <TableCell align="right">{row.slope}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                /* Daily Events Table for Slope/Comfort */
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>日付</TableCell>
                                            <TableCell>パターン</TableCell>
                                            {viewMode === 'slope' && <TableCell align="right">覚醒速度 (Slope)</TableCell>}
                                            {viewMode === 'comfort' && <TableCell align="right">快適度</TableCell>}
                                            {/* Show both if general view? Let's stick to mode specific to avoid clutter unless desired */}
                                            {/* Actually user wants "Data Display". Showing everything is usually better for "Data" view. */}
                                            {/* Let's show common relevant fields for context if space allows. */}
                                            <TableCell align="right">StdDev</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {weeklyEvents.map((row) => (
                                            <TableRow key={row.id || row.alarm_time}>
                                                <TableCell>
                                                    {new Date(row.alarm_time).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                                                </TableCell>
                                                <TableCell>{row.mixing_pattern}</TableCell>
                                                {viewMode === 'slope' && (
                                                    <TableCell align="right">{row.awakening_hr_slope?.toFixed(4)}</TableCell>
                                                )}
                                                {viewMode === 'comfort' && (
                                                    <TableCell align="right">{row.comfort_score}</TableCell>
                                                )}
                                                <TableCell align="right">{row.awakening_hr_stddev?.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TableContainer>
                    )}
                </Box>
            )}
        </Paper>
    );
}

export default DataVisualization;
