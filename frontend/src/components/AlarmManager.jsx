import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Paper, Box, Typography, Button, Alert, List, ListItem, ListItemText, IconButton, Switch, Card, CardContent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlarmSettingModal from './AlarmSettingModal';

// Helper function to get Authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

function AlarmManager() {
  const [alarms, setAlarms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    try {
      const [alarmsRes, audioRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/alarms`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/audio/files`, { headers: getAuthHeaders() })
      ]);
      if (!alarmsRes.ok) throw new Error('アラームの取得に失敗しました。');
      if (!audioRes.ok) throw new Error('音声ファイルの取得に失敗しました。');
      const alarmsData = await alarmsRes.json();
      const audioData = await audioRes.json();
      setAlarms(alarmsData);
      setAudioFiles(audioData);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveAlarm = async (alarmToSave) => {
    setError('');
    const isEditing = !!alarmToSave.id;
    const url = isEditing ? `${API_BASE_URL}/api/alarms/${alarmToSave.id}` : `${API_BASE_URL}/api/alarms`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(alarmToSave),
      });
      if (!response.ok) { throw new Error(isEditing ? 'アラームの更新に失敗しました。' : 'アラームの保存に失敗しました。'); }
      fetchData(); // Refresh the list
    } catch (err) { setError(err.message); }
  };

  const handleDeleteAlarm = async (id) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/alarms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) { throw new Error('アラームの削除に失敗しました。'); }
      fetchData(); // Refresh the list
    } catch (err) { setError(err.message); }
  };

  const handleToggleAlarm = async (alarm) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/alarms/${alarm.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: alarm.is_active ? 0 : 1 }),
      });
      if (!response.ok) { throw new Error('アラームの状態更新に失敗しました。'); }
      fetchData(); // Refresh the list
    } catch (err) { setError(err.message); }
  };

  const formatDaysOfWeek = (days) => {
    if (!days) return '繰り返しなし';
    if (days === '0,1,2,3,4,5,6') return '毎日';
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return days.split(',').map(day => dayNames[parseInt(day)]).join(', ');
  };

  const handleOpenModal = (alarm = null) => {
    setEditingAlarm(alarm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlarm(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{
        bgcolor: '#ffffff',
        borderRadius: '30px',
        p: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        width: '90vw',
        maxWidth: 'min(400px, 100%)',
        mx: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {alarms.length === 0 ? (
          <Typography sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            現在設定されているアラームはありません。
          </Typography>
        ) : (
          <Box sx={{ width: '100%', mb: 2 }}>
            {alarms.map((alarm) => (
              <Card
                key={alarm.id}
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: '20px',
                  bgcolor: alarm.is_active ? '#f3f4f6' : '#fafafa',
                  border: '1px solid',
                  borderColor: alarm.is_active ? 'primary.light' : 'grey.200',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <CardContent sx={{ pb: '16px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: alarm.is_active ? 'text.primary' : 'text.disabled', lineHeight: 1 }}>
                        {alarm.time}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: alarm.is_active ? 'text.secondary' : 'text.disabled' }}>
                        {formatDaysOfWeek(alarm.days_of_week)}
                      </Typography>
                    </Box>
                    <Switch
                      onChange={() => handleToggleAlarm(alarm)}
                      checked={alarm.is_active === 1}
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, borderTop: '1px solid rgba(0,0,0,0.05)', pt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: alarm.is_active ? 1 : 0.6 }}>
                      <MusicNoteIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {alarm.sound_file}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenModal(alarm)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteAlarm(alarm.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: '30px', px: 4, py: 1 }}
        >
          アラーム設定
        </Button>
      </Box>

      <AlarmSettingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAlarm}
        existingAlarm={editingAlarm}
        audioFiles={audioFiles}
      />
    </Box>
  );
}

export default AlarmManager;