import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Paper, Box, Typography, Button, Alert, List, ListItem, ListItemText, IconButton, Link, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AlarmManager from '../components/AlarmManager';
import AlarmHistory from '../components/AlarmHistory';

function SettingsPage() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAudioFiles = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const [filesRes, alarmsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/audio/files`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_BASE_URL}/api/alarms`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!filesRes.ok) throw new Error('音声ファイルの取得に失敗しました。');
      if (!alarmsRes.ok) throw new Error('設定済みアラームの取得に失敗しました。');

      const files = await filesRes.json();
      const alarms = await alarmsRes.json();

      const alarmSoundFiles = alarms.map(alarm => alarm.sound_file);
      const combinedFiles = [...new Set([...files, ...alarmSoundFiles])];

      setAudioFiles(combinedFiles);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAudioFiles();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルが選択されていません。');
      return;
    }
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('audioFile', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/audio/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'アップロードに失敗しました。');
      setSuccess(data.message);
      fetchAudioFiles(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFile = async (filename) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/audio/files/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '削除に失敗しました。');
      setSuccess(data.message);
      fetchAudioFiles(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>


      <Grid container spacing={3}>
        {/* 1. Alarm Management */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#4d3674', fontWeight: 600, pl: 1 }}>
              アラーム管理
            </Typography>
            <AlarmManager />
          </Paper>
        </Grid>

        {/* 2. History */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#4d3674', fontWeight: 600, pl: 1 }}>
              履歴
            </Typography>
            <AlarmHistory />
          </Paper>
        </Grid>

        {/* 3. Audio Management */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '70px', bgcolor: '#eeeeee', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)', pb: 1, color: '#4d3674', fontWeight: 600, pl: 1 }}>
              アラーム音の管理
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>現在のアラーム音</Typography>
              <List>
                {audioFiles.map(file => (
                  <ListItem
                    key={file}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFile(file)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={file} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>新しいアラーム音をアップロード (MP3 / WAV)</Typography>
              <Paper variant="outlined" sx={{ p: 2, my: 2, backgroundColor: '#f0f4f8' }}>
                <Typography variant="body2">
                  MP3ファイルまたはWAVファイルをアップロードできます。
                  システム内で自動的に処理されます。
                </Typography>
              </Paper>

              <input
                type="file"
                accept=".wav,audio/wav,.mp3,audio/mpeg"
                onChange={handleFileChange}
                style={{ display: 'block', margin: '10px 0' }}
              />
              <Button variant="contained" onClick={handleUpload}>
                アップロード
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SettingsPage;
