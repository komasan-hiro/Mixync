import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuthStatus } = useAuth();

    const handleLogout = async () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            await checkAuthStatus();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    // Determine value based on path
    const getValue = () => {
        if (location.pathname === '/') return 0;
        if (location.pathname === '/settings') return 1;
        return 0; // Default
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.85)', // Frost White
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)'
            }}
            elevation={3}
        >
            <BottomNavigation
                showLabels
                value={getValue()}
                onChange={(event, newValue) => {
                    if (newValue === 0) navigate('/');
                    if (newValue === 1) navigate('/settings');
                    if (newValue === 2) handleLogout();
                }}
                sx={{
                    height: 80, // Taller for better touch target
                    background: 'transparent', // Let Paper handle background
                    '& .MuiBottomNavigationAction-root': {
                        color: '#546e7a', // Dark gray for inactive
                        '&.Mui-selected': {
                            color: '#302b63', // Deep Purple for active
                            '& .MuiSvgIcon-root': {
                                filter: 'drop-shadow(0 2px 4px rgba(48, 43, 99, 0.25))',
                            }
                        },
                    },
                }}
            >
                <BottomNavigationAction
                    label="ホーム"
                    icon={<HomeIcon />}
                />
                <BottomNavigationAction
                    label="アラーム"
                    icon={<NotificationsIcon />}
                />
                <BottomNavigationAction
                    label="ログアウト"
                    icon={<LogoutIcon />}
                />
            </BottomNavigation>
        </Paper>
    );
}

export default BottomNav;
