// src/components/Header/Header.js
import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  HowToReg as SignUpIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './header.css';

const Header = memo(() => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Primary navigation (System Health removed)
  const menuItems = useMemo(
    () => [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Upload Resume', icon: <UploadIcon />, path: '/upload' },
    ],
    []
  );

  const userMenuItems = useMemo(
    () => [
      { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      { text: 'Logout', icon: <ExitToAppIcon />, action: logout },
    ],
    [logout]
  );

  const handleAvatarClick = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleAvatarClose = useCallback(() => setAnchorEl(null), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  const handleNavigate = useCallback(
    (pathOrAction) => {
      setDrawerOpen(false);
      setAnchorEl(null);
      if (typeof pathOrAction === 'string') navigate(pathOrAction);
      else pathOrAction();
    },
    [navigate]
  );

  const getUserInitials = useCallback(() => {
    if (!user?.name) return 'U';
    const [first, ...rest] = user.name.trim().split(' ');
    return rest.length
      ? `${first[0]}${rest[rest.length - 1][0]}`.toUpperCase()
      : first[0].toUpperCase();
  }, [user]);

  const mobileDrawer = (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer}
      PaperProps={{ sx: { width: 260 } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Smart Resume
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {menuItems.map(({ text, icon, path }) => (
            <ListItem
              key={path}
              button
              selected={location.pathname === path}
              onClick={() => handleNavigate(path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': { backgroundColor: theme.palette.primary.light + '25' },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                {icon}
              </ListItemIcon>
              <ListItemText primary={text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItem>
          ))}

          <Divider sx={{ my: 1 }} />

          {user ? (
            userMenuItems.map(({ text, icon, path, action }) => (
              <ListItem
                key={text}
                button
                onClick={() => handleNavigate(action || path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { backgroundColor: theme.palette.primary.light + '10' },
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>{icon}</ListItemIcon>
                <ListItemText primary={text} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            ))
          ) : (
            <>
              <ListItem button onClick={() => handleNavigate('/login')}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
              <ListItem button onClick={() => handleNavigate('/signup')}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <SignUpIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Up" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="sticky" elevation={0} color="default">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1, width: 32, height: 32 }}>
            S
          </Avatar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.palette.primary.main }}
          >
            Smart Resume
          </Typography>
        </Box>

        {!isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {menuItems.map(({ text, path }) => (
              <Button
                key={path}
                onClick={() => navigate(path)}
                sx={{
                  color:
                    location.pathname === path
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  fontWeight: location.pathname === path ? 600 : 400,
                  '&:hover': { backgroundColor: theme.palette.primary.light + '10' },
                }}
              >
                {text}
              </Button>
            ))}

            {user ? (
              <>
                <Button
                  startIcon={
                    <Avatar
                      sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}
                    >
                      {getUserInitials()}
                    </Avatar>
                  }
                  onClick={handleAvatarClick}
                  sx={{ textTransform: 'none', color: theme.palette.text.primary }}
                >
                  {user.name}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleAvatarClose}
                  PaperProps={{ sx: { width: 180 } }}
                >
                  {userMenuItems.map(({ text, icon, path, action }) => (
                    <MenuItem
                      key={text}
                      onClick={() => handleNavigate(action || path)}
                    >
                      <ListItemIcon>{icon}</ListItemIcon>
                      <ListItemText>{text}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')}>Login</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        ) : (
          <>
            <IconButton onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
            {mobileDrawer}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
});

Header.displayName = 'Header';
export default Header;
