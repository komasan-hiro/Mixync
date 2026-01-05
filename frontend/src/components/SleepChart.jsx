import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Paper, Box, Typography, Button, Alert, Grid, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper function to get Authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to get the Sunday of a given date
const getSunday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Helper function to format decimal hours into 'X時間Y分'
const formatDuration = (decimalHours) => {
  if (typeof decimalHours !== 'number' || isNaN(decimalHours)) return '';
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
};

function SleepChart() {
  const [chartData, setChartData] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchWeeklySleep = async (date) => {
    setIsLoading(true);
    setError('');
    setChartData(null);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/fitbit/sleep/week/${dateString}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('週間の睡眠データの取得に失敗しました。');
      const data = await response.json();

      const labels = Object.keys(data).sort();
      const values = labels.map(label => data[label] / 60); // Convert minutes to hours

      setChartData({
        labels: ['日', '月', '火', '水', '木', '金', '土'],
        datasets: [{
          label: '睡眠時間',
          data: values,
          backgroundColor: 'rgba(74, 144, 226, 0.6)',
          borderColor: 'rgba(74, 144, 226, 1)',
          borderWidth: 1,
        }],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySleep(currentDate);
  }, [currentDate]);

  const handleSync = async () => {
    setIsSyncing(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/fitbit/sleep/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Fitbitとの同期に失敗しました。');
      // After syncing, refresh the chart data for the current week
      fetchWeeklySleep(currentDate);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const changeWeek = (amount) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + amount * 7);
    setCurrentDate(newDate);
  };

  const getWeekRangeString = () => {
    const sunday = getSunday(currentDate);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return `${sunday.toLocaleDateString()} ～ ${saturday.toLocaleDateString()}`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '週間睡眠時間' },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatDuration(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: '睡眠時間' },
        ticks: {
          stepSize: 0.5, // Set step size to 0.5 hours
          callback: function (value) {
            // Only show whole hours as 'Xh'
            if (value % 1 === 0) {
              return `${value}h`;
            }
            return ''; // Hide fractional hour ticks
          }
        }
      }
    }
  };

  return (
    <Paper elevation={2} sx={{ width: '100%', p: 3, mt: 2, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
        <Button
          onClick={handleSync}
          variant="contained"
          size="small"
          disabled={isSyncing}
          sx={{
            borderRadius: '20px',
            padding: '4px 12px',
            minWidth: 'auto',
            fontSize: '0.8rem',
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            }
          }}
        >
          {isSyncing ? '同期中...' : 'Fitbitと同期'}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton
          onClick={() => changeWeek(-1)}
          sx={{
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '50%',
            p: 1
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 500, mx: 2 }}>
          {getWeekRangeString()}
        </Typography>

        <IconButton
          onClick={() => changeWeek(1)}
          sx={{
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '50%',
            p: 1
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {isLoading && <Typography>読み込み中...</Typography>}
      {chartData && (
        <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      )}
    </Paper>
  );
}

export default SleepChart;