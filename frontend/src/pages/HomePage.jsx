import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Import RouterLink
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, WS_BASE_URL } from '../config';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// MUI Imports
import { Paper, Box, Typography, Button, Grid } from '@mui/material';

// Component Imports
import WakeupCalculator from '../components/WakeupCalculator';
import AlarmManager from '../components/AlarmManager';
import SleepChart from '../components/SleepChart';
import DataVisualization from '../components/DataVisualization';
import AlarmHistory from '../components/AlarmHistory';

function HomePage() {
  const { user, isAuthenticated, loading, getToken } = useAuth();


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" color="textSecondary">読み込み中...</Typography>
      </Box>
    );
  }



  const handleFitbitConnect = async () => {
    const token = getToken();
    const url = `${API_BASE_URL}/auth/fitbit?token=${token}`;

    console.log('[Fitbit Connect] Navigating to:', url);
    console.log('[Fitbit Connect] Is native platform:', Capacitor.isNativePlatform());

    if (Capacitor.isNativePlatform()) {
      console.log('[Fitbit Connect] Opening external browser');
      await Browser.open({ url });
    } else {
      console.log('[Fitbit Connect] Using window.location.assign');
      window.location.assign(url);
    }
  };

  const handleFitbitClear = async () => {
    const token = getToken();
    const url = `${API_BASE_URL}/auth/clear-fitbit?token=${token}`;

    console.log('[Fitbit Clear] Navigating to:', url);
    console.log('[Fitbit Clear] Is native platform:', Capacitor.isNativePlatform());

    if (Capacitor.isNativePlatform()) {
      console.log('[Fitbit Clear] Opening external browser');
      await Browser.open({ url });
    } else {
      console.log('[Fitbit Clear] Using window.location.assign');
      window.location.assign(url);
    }
  };

  const renderUserContent = () => {
    if (!user) return null;
    return (
      <Box sx={{ pb: 4 }}>
        <Grid container spacing={3}>
          {/* Main Controls */}
          {/* Main Controls - Vertical Layout */}

          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#4d3674', fontWeight: 600, pl: 1 }}>
                サイクル分析
              </Typography>
              <WakeupCalculator />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#4d3674', fontWeight: 600, pl: 1 }}>
                アラーム管理
              </Typography>
              <AlarmManager />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#241b66', fontWeight: 600, pl: 1 }}>
                週間睡眠グラフ
              </Typography>
              <SleepChart />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', height: '100%', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#241b66', fontWeight: 600, pl: 1 }}>
                データ可視化
              </Typography>
              <DataVisualization />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#241b66', fontWeight: 600, pl: 1 }}>
                履歴
              </Typography>
              <AlarmHistory />
            </Paper>
          </Grid>

          {/* System Status */}
          <Grid item xs={12}>
            {user.fitbit_user_id ? (
              <Paper elevation={0} sx={{ p: 2, mt: 2, backgroundColor: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600 }}>デバッグ用オプション</Typography>
                    <Typography variant="body2" color="textSecondary">Fitbit連携に問題がある場合のみ使用してください</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleFitbitClear}
                  >
                    連携リセット
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Paper elevation={2} sx={{ p: 4, mt: 2, textAlign: 'center', borderRadius: 3, background: 'linear-gradient(145deg, #ffffff, #f0f4f8)' }}>
                <Typography variant="h6" gutterBottom color="primary">Fitbitと連携して機能を最大限に活用</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  睡眠データを分析して、最適な起床時間を提案します。
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleFitbitConnect}
                  size="large"
                  sx={{ px: 4 }}
                >
                  Fitbitと連携する
                </Button>
              </Paper>
            )}
          </Grid>

          {/* Debug Link for Logged In Users */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 4 }}>
            <Button component={RouterLink} to="/colors" size="small" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              開発者用：色味テスト画面へ
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {isAuthenticated ? renderUserContent() : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: '70px', bgcolor: '#eeeeee', maxWidth: '600px', width: '100%', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#4d3674', fontWeight: 600 }}>ようこそ！</Typography>
            <Typography sx={{ color: '#535c68', mb: 4 }}>ログインまたは新規登録をしてください。</Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/login"
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
              >
                ログイン
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/register"
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2, color: '#4d3674', borderColor: '#4d3674' }}
              >
                新規登録
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Button component={RouterLink} to="/colors" size="small" sx={{ color: 'rgba(0,0,0,0.3)' }}>
                開発者用：色味テスト画面へ
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default HomePage;
