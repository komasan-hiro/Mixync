import React, { useState, useEffect, useRef } from 'react';
import { Modal, Box, Typography, Button, Alert, Rating } from '@mui/material';
import { API_BASE_URL } from '../config';

function RingingAlarmModal({ alarm, onClose }) {
  const [audioSrc, setAudioSrc] = useState(null);
  const [error, setError] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [moodRating, setMoodRating] = useState(3);
  const [soundRating, setSoundRating] = useState(3);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (alarm) {
      // Reset states for the new alarm
      setError('');
      setShowEvaluation(false);
      setIsPlaying(false);

      if (alarm.audioData) {
        // Ensure data URI prefix if missing
        let src = alarm.audioData;
        if (!src.startsWith('data:audio') && !src.startsWith('http')) {
          // Assume mp3 or wav base64 without prefix. Default to wav for safety or check first chars
          // But usually it's better to try strictly or assume wav.
          src = `data:audio/wav;base64,${alarm.audioData}`;
        }
        setAudioSrc(src);
      } else {
        setError('受信したアラーム情報に音声データが含まれていません。');
      }
    }
  }, [alarm]);

  // Handle auto-play when src is set
  useEffect(() => {
    if (audioSrc && audioRef.current && !showEvaluation) {
      const playAudio = async () => {
        try {
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('Audio playing successfully');
        } catch (err) {
          console.error('Audio play failed:', err);
          setError('アラーム音の再生に失敗しました: ' + err.message);
          // If autoplay is blocked, we rely on user clicking "Stop" or we could show a "Play" button.
          // For now, the "Stop" button is the main interaction.
        }
      };
      playAudio();
    }
  }, [audioSrc, showEvaluation]);

  const handleStopAndEvaluate = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setShowEvaluation(true);
    setIsPlaying(false);
  };

  const evalAudioRef = useRef(null);

  const handleSubmitEvaluation = async () => {
    if (!alarm || !alarm.eventId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          event_id: alarm.eventId,
          mood_rating: moodRating,
          sound_rating: soundRating
        }),
      });
      if (!response.ok) throw new Error('評価の送信に失敗しました。');
      onClose(); // Close the modal after successful submission
    } catch (err) {
      setError(err.message);
    }
  };

  if (!alarm) return null;

  return (
    <Modal open={true} onClose={() => { /* Prevent closing on click outside */ }}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          アラーム
        </Typography>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {alarm.time}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!showEvaluation ? (
          // --- Ringing View ---
          <>
            {audioSrc && (
              <audio
                ref={audioRef}
                src={audioSrc}
                loop
                onPlay={() => setIsPlaying(true)}
                onError={(e) => {
                  console.error("Audio tag error:", e);
                  setError("音声ファイルの読み込みエラー");
                }}
              />
            )}

            {!audioSrc && !error && <Typography>アラーム音を準備中...</Typography>}

            <Button onClick={handleStopAndEvaluate} variant="contained" color="error" size="large" sx={{ mt: 4 }}>
              アラームを停止して評価する
            </Button>
          </>
        ) : (
          // --- Evaluation View ---
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>今のアラームをもう一度聞く:</Typography>
            {audioSrc && <audio controls src={audioSrc} />}

            <Typography sx={{ mt: 3, mb: 1 }}>今の目覚めの気分は？ (1:悪い ~ 5:良い)</Typography>
            <Rating name="mood-rating" value={moodRating} onChange={(e, newValue) => setMoodRating(newValue)} size="large" />

            <Typography sx={{ mt: 3, mb: 1 }}>このアラーム音は気に入りましたか？ (1:嫌い ~ 5:好き)</Typography>
            <Rating name="sound-rating" value={soundRating} onChange={(e, newValue) => setSoundRating(newValue)} size="large" />

            <Button onClick={handleSubmitEvaluation} variant="contained" color="primary" size="large" sx={{ mt: 4 }}>
              評価を送信
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
}

export default RingingAlarmModal;