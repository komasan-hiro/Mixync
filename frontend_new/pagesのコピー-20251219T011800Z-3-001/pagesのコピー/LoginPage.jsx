import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

// MUI Imports
import { Paper, Box, Typography, TextField, Button, Alert, Link } from '@mui/material';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LOGIN] Form submitted');
    console.log('[LOGIN] Email:', email);
    console.log('[LOGIN] API_BASE_URL:', API_BASE_URL);
    setMessage('');

    try {
      console.log('[LOGIN] Sending request to:', `${API_BASE_URL}/auth/login`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[LOGIN] Response status:', response.status);
      const data = await response.json();
      console.log('[LOGIN] Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      // Save token and user data using AuthContext
      console.log('[LOGIN] Calling login function');
      login(data.token, data.user);
      console.log('[LOGIN] Navigating to /');
      navigate('/');

    } catch (error) {
      console.error('[LOGIN] Error:', error);
      setMessage(error.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Removed to use global theme
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 450,
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#2c3e50', mb: 1 }}>
          おかえりなさい
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Mixyncにログインして、快適な朝を迎えましょう
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {message && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}

          <TextField
            label="メールアドレス"
            type="email"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="パスワード"
            type="password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              mb: 3,
            }}
          >
            ログイン
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              アカウントをお持ちでないですか？
            </Typography>
            <Link
              component={RouterLink}
              to="/register"
              sx={{
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              新規登録はこちら
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;