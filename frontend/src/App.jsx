import React from 'react';
import { Routes, Route, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WS_BASE_URL } from './config';
import RingingAlarmModal from './components/RingingAlarmModal';

// MUI Imports
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Page Imports
import HomePage from './pages/HomePage';
import ColorTestPage from './pages/ColorTestPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';

// Component Imports
import ShootingStars from './components/ShootingStars';
import BottomNav from './components/BottomNav';

// Create a theme: Light Content (Cards) on Dark Background
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4d3674', // Lighter Purple (Buttons)
    },
    secondary: {
      main: '#686de0',
    },
    background: {
      default: '#3e2a5f', // Unified Purple for Background
      paper: '#ffffff',
    },
    text: {
      primary: '#130f40',
      secondary: '#535c68',
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    h5: { fontWeight: 700, color: '#130f40' },
    h6: { fontWeight: 700, color: '#130f40' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 32, // High border radius for cards
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', // Soft, deep shadow
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Pill shaped buttons
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        },
        // Gradient removed to force solid dark color
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingBottom: 100, // Space for BottomNavigation
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent', // Handled by BottomNav component paper
        },
      },
    },
  },
});

function App() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [ringingAlarm, setRingingAlarm] = React.useState(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const ws = new WebSocket(WS_BASE_URL);
      ws.onopen = () => console.log('WebSocket connection established');
      ws.onclose = () => console.log('WebSocket connection closed');
      ws.onerror = (error) => console.error('WebSocket Error:', error);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          if (data.type === 'RING_ALARM' && data.alarm.user_id === user.id) {
            setRingingAlarm(data.alarm);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };
      return () => ws.close();
    }
  }, [isAuthenticated, user]);

  const handleStopAlarm = () => {
    setRingingAlarm(null);
  };

  // Hide Nav on login/register
  const showBottomNav = isAuthenticated && !['/login', '/register'].includes(location.pathname);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ShootingStars /> {/* Background Animation */}

      <Container component="main" disableGutters sx={{ pt: 4, px: 2, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Page Content */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/colors" element={<ColorTestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/fitbit-success" element={<FitbitSuccessHandler />} />
        </Routes>
      </Container>

      {/* Bottom Navigation Component */}
      {showBottomNav && <BottomNav />}

      <RingingAlarmModal
        alarm={ringingAlarm}
        onClose={handleStopAlarm}
      />
    </ThemeProvider>
  );
}

// New component to handle Fitbit success redirect
function FitbitSuccessHandler() {
  const { checkAuthStatus } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleRedirect = async () => {
      await checkAuthStatus();
      navigate('/');
    };
    handleRedirect();
  }, [checkAuthStatus, navigate]);

  return (
    <Box sx={{ textAlign: 'center', mt: 4, color: 'white' }}>
      <Typography variant="h5">Fitbit連携を処理中...</Typography>
      <Typography variant="body1">しばらくお待ちください。</Typography>
    </Box>
  );
}

export default App;