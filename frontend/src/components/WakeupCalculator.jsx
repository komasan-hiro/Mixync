import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';

// Helper function to get Authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

function WakeupCalculator() {
  const [bedtime, setBedtime] = useState('00:00');
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setError('');
    setRecommendations(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/fitbit/sleep/analyze-cycle`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bedtime }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '分析に失敗しました。');
      }
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 0, flexGrow: 1, boxSizing: 'border-box' }}>

      <Box sx={{
        bgcolor: '#ffffff',
        borderRadius: '30px',
        p: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" gutterBottom color="text.primary" sx={{ mb: 2 }}>
          おすすめ起床時間
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">あなたの全睡眠データを分析し、あなたに最適化された起床時間を計算します。</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            label="就寝時刻"
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: '120px' }}
          />
          <Button
            onClick={handleAnalyze}
            variant="contained"
            disabled={isLoading}
            sx={{
              ml: 1,
              whiteSpace: 'pre-line', // Allow line break
              lineHeight: 1.2,
              py: 1,
              minWidth: 'auto',
              borderRadius: '30px'
            }}
          >
            {isLoading ? '分析中...' : '睡眠サイクルを\n分析する'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {recommendations && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {recommendations.message}
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {recommendations.times.map(time => <li key={time}>{time}</li>)}
            </ul>
          </Alert>
        )}
      </Box>
    </Box>
  );
}

export default WakeupCalculator;