import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, Alert, Paper } from '@mui/material';

function AlarmSettingModal({ isOpen, onClose, onSave, existingAlarm, audioFiles }) {
  const [datetime, setDatetime] = useState('');
  const [selectedSound, setSelectedSound] = useState('');
  const [mixingPattern, setMixingPattern] = useState('AUTO');

  useEffect(() => {
    if (isOpen) {
      if (existingAlarm) {
        // Convert existing alarm time to datetime-local format
        const now = new Date();
        const [hours, minutes] = existingAlarm.time.split(':');
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const datetimeString = now.toISOString().slice(0, 16);
        setDatetime(datetimeString);
        setSelectedSound(existingAlarm.sound_file);
        setMixingPattern(existingAlarm.mixing_pattern || 'AUTO');
      } else {
        // Default to tomorrow at 7:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(7, 0, 0, 0);
        const datetimeString = tomorrow.toISOString().slice(0, 16);
        setDatetime(datetimeString);
        setSelectedSound(audioFiles.length > 0 ? audioFiles[0] : '');
        setMixingPattern('AUTO');
      }
    }
  }, [isOpen, existingAlarm, audioFiles]);

  const handleSave = () => {
    if (!datetime || !selectedSound) {
      alert('日時とサウンドを選択してください。');
      return;
    }

    const alarmData = {
      id: existingAlarm ? existingAlarm.id : undefined,
      datetime: datetime,
      sound_file: selectedSound,
      mixing_pattern: mixingPattern,
    };
    onSave(alarmData);
    onClose();
  };



  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%', // Responsive width
        maxWidth: 500, // Max width for larger screens
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <Typography variant="h6" component="h2" gutterBottom>アラーム設定</Typography>

        <TextField
          label="日時"
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
          helperText="アラームを鳴らす日時を選択してください"
        />

        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel id="sound-select-label">サウンド</InputLabel>
          <Select
            labelId="sound-select-label"
            value={selectedSound}
            label="サウンド"
            onChange={(e) => setSelectedSound(e.target.value)}
          >
            {audioFiles.map(file => (
              <MenuItem key={file} value={file}>{file}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, ml: 1 }}>ミキシングパターン</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#f0f4f8' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            🔄 自動進行モード (Graduation Project)
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            ミキシングパターンは、利用日数に応じて自動的に切り替わります。
            <br />
            (5日ごとに変更 → 25日後にAIモードへ移行)
          </Typography>
        </Paper>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            AIとプログラムが、あなたに最適な目覚め体験を提供するためにパターンを管理しています。
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            sx={{
              mt: 2
            }}
          >
            設定
          </Button>
          <Button onClick={onClose} variant="outlined" fullWidth>
            キャンセル
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AlarmSettingModal;
