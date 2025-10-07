import {
  IconButton, Box, AppBar, useMediaQuery, Toolbar, styled, Stack
} from '@mui/material';
import Profile from './Profile';
import Logo from '../../shared/logo/Logo';
import { useEffect, useState, useContext } from 'react';
import { Icon } from '@iconify/react';
import { DashboardContext } from 'src/context/DashboardContext';

const Header = () => {
  const [_height, setHeight] = useState('0px');
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));

  const toggleWidth = '256px';

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none !important',
    background: '#ffff',
    justifyContent: 'center',
    position: "fixed",
    top: "60px", // posición por defecto

    backdropFilter: 'blur(4px)',

    [theme.breakpoints.down('lg')]: {
      minHeight: '60px',
      top: "0px", // 🔼 AJUSTE: subimos el navbar
    },
    [theme.breakpoints.down('sm')]: {
      top: "0px", // 🔼 Más arriba en sm (opcional)
    },
  }));

  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.warning.contrastText,
    gap: '8px',
  }));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setHeight('0px');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isMobileSidebar, setIsMobileSidebar } = useContext(DashboardContext);

  return (
    <>
      <AppBarStyled color="default">
        <ToolbarStyled>

          {/* Botón hamburguesa solo en móvil */}
          {!lgUp && (
            <IconButton
              sx={{ color: "#000", mr: 1 }}
              aria-label="Abrir menú"
              onClick={() => setIsMobileSidebar(true)}
            >
              <Icon icon="solar:hamburger-menu-linear" height={24} />
            </IconButton>
          )}

          {/* Logo */}
          {lgUp && (
            <Box
              sx={{
                width: toggleWidth,
                display: { xs: 'none', lg: 'block' },
              }}
            >
              <Logo />
            </Box>
          )}

          <Box flexGrow={1} />

          <Stack spacing={2} direction="row" alignItems="center">
            <Profile />
          </Stack>
        </ToolbarStyled>
      </AppBarStyled>
    </>
  );
};

export default Header;
