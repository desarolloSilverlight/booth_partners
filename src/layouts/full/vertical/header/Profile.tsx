import { useState } from 'react';
import { Link } from 'react-router';
import { Box, Menu, Avatar, Typography, IconButton, Button } from '@mui/material';
import * as dropdownData from './data';
import ProfileImg from 'src/assets/images/profile/userBooth.png';
import { Icon } from '@iconify/react';
import { useAuth } from 'src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {

  const nameUser = sessionStorage.getItem("name_user");

  const [anchorEl2, setAnchorEl2] = useState(null);
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const { setToken } = useAuth(); // Obtener la función setToken del contexto de autenticación
  const navigate = useNavigate(); // Hook para la navegación

  const handleLogout = () => {
    setToken(null); // Limpiar el token en el contexto de autenticación
    navigate('/auth/login'); // Redirigir a la página de inicio de sesión
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={ProfileImg}
          alt={'ProfileImg'}
          sx={{
            width: 35,
            height: 35,
          }}
        />
        <Typography
          variant="h6"
          fontSize="15px"
          color="black"
          fontWeight="400"
          sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            ml: 1,
          }}
        >
          {nameUser}
        </Typography>
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '240px',
            p: 0,
          },
        }}
      >
        <Box paddingX={2}>
          {dropdownData.profile.map((profile) => (
            <Box key={profile.title}>
              <Box
                sx={{
                  px: 2,
                  py: '10px',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
                className="hover-text-primary"
              >
                <Link to={profile.href} style={{ textDecoration: 'none' }}>
                  <Box color="secondary.main" display="flex" alignItems="center">
                    <Icon
                      icon={profile.iconName}
                      height={50}
                      color="#0D4B3B"
                      style={{
                        marginRight: '8px',
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      fontWeight={500}
                      color="textPrimary"
                      className="text-hover"
                      component="span"
                      noWrap
                      sx={{
                        width: '240px',
                        marginLeft: '8px',
                      }}
                    >
                      {profile.title}
                    </Typography>
                  </Box>
                </Link>
              </Box>
            </Box>
          ))}
        </Box>
        <Box p={0}>
          <Box
            sx={{
              px: 2,
              py: '10px',
              '&:hover': {
                backgroundColor: '#D9EDE3',
              },
            }}
            className="hover-text-primary"
          >
            <Button
              variant="outlined"
              sx={{
                width: '100%',
                color: '#0D4B3B',
                borderColor: '#0D4B3B',
                '&:hover': {
                  backgroundColor: '#0D4B3B',
                  color: '#fff',
                  borderColor: '#0D4B3B',
                },
              }}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;