import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ColorTestPage = () => {
    const navigate = useNavigate();

    // Base color from user selection: Neutral Light Grays
    const colors = [
        { name: 'Current Box', code: '#eeeeee', note: '現在の色（明るいグレー）' },
        { name: 'Pure White', code: '#ffffff', note: '真っ白 (#ffffff)' },
        { name: 'Gray 1 (Lightest)', code: '#f5f5f5', note: '限りなく白に近いグレー (#f5f5f5)' },
        { name: 'Gray 2 (Light)', code: '#eeeeee', note: '明るいグレー (#eeeeee)' },
        { name: 'Gray 3 (Medium)', code: '#e0e0e0', note: '標準的なライトグレー (#e0e0e0)' },
        { name: 'Gray 4 (Darker)', code: '#d6d6d6', note: '少し濃いめ (#d6d6d6)' },
        { name: 'Gray 5 (Darkest)', code: '#cccccc', note: 'はっきりしたグレー (#cccccc)' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8', p: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/')} sx={{ mb: 2 }}>
                ホームに戻る
            </Button>
            <Typography variant="h5" gutterBottom>
                スマホ実機 色味テスト
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                PCとスマホで色の見え方が違うため、この画面をスマホで見て「一番理想に近い背景色」を選んでください。
            </Typography>

            <Grid container spacing={2}>
                {colors.map((color) => (
                    <Grid item xs={12} key={color.name}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                bgcolor: color.code,
                                color: 'white',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {color.name}
                            </Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', my: 1, bgcolor: 'rgba(0,0,0,0.3)', px: 1, borderRadius: 1 }}>
                                {color.code}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {color.note}
                            </Typography>

                            {/* Sample UI Elements to check contrast */}
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: '12px', color: 'black', width: '100%' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>白いボックス上の文字</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ColorTestPage;
