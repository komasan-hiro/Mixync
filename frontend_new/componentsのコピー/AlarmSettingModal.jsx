import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, Paper, useMediaQuery, useTheme
} from '@mui/material';

function AlarmSettingModal({ isOpen, onClose, onSave, existingAlarm, audioFiles }) {
  const [datetime, setDatetime] = useState('');
  const [selectedSound, setSelectedSound] = useState('');
  const [mixingPattern, setMixingPattern] = useState('AUTO');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const formContent = (
    <Box sx={{ mt: isMobile ? 2 : 0 }}>
      <TextField
        label="日時"
        type="datetime-local"
        value={datetime}
        onChange={(e) => setDatetime(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        InputLabelProps={{ shrink: true }}
        helperText="アラームを鳴らす日時を選択してください"
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
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

      <Typography variant="subtitle2" sx={{ mb: 1, ml: 1, fontWeight: 600 }}>ミキシングパターン</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🔄 自動進行モード (Graduation Project)
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          ミキシングパターンは、利用日数に応じて自動的に切り替わります。
          (7日ごとに変更 → 35日後にAIモードへ移行)
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ borderRadius: 3 }}>
        <Typography variant="body2">
          AIとプログラムが、あなたに最適な目覚め体験を提供するためにパターンを管理しています。
        </Typography>
      </Alert>
    </Box>
  );

  const actionButtons = (
    <>
      <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 50, px: 3, flex: isMobile ? 1 : 'initial' }}>
        キャンセル
      </Button>
      <Button
        onClick={handleSave}
        variant="contained"
        sx={{ borderRadius: 50, px: 4, flex: isMobile ? 1 : 'initial' }}
      >
        設定
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            maxHeight: '85vh',
            p: 3
          }
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 2, mx: 'auto', mb: 3 }} />
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>
          {existingAlarm ? 'アラームを編集' : 'アラーム設定'}
        </Typography>
        {formContent}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, pb: 2 }}>
          {actionButtons}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        {existingAlarm ? 'アラームを編集' : 'アラーム設定'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {formContent}
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
}

export default AlarmSettingModal;
