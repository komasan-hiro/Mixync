import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

// MUI Imports
import { Paper, Box, Typography, TextField, Button, Alert, Link } from '@mui/material';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      setSuccess('登録が成功しました！');
      // Auto-login after registration
      login(data.token, data.user);
      navigate('/');

    } catch (err) {
      setError(err.message);
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
        elevation={0}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 450,
          borderRadius: '70px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#eeeeee', // Standard Box Color
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', // 3D Shadow
          // background: 'rgba(255, 255, 255, 0.95)',
          // backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#2c3e50', mb: 1 }}>
          新規登録
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Mixyncを始めて、睡眠の質を向上させましょう
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

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
            登録
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              すでにアカウントをお持ちですか？
            </Typography>
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              ログインはこちら
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default RegisterPage;