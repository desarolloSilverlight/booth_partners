import { Link } from 'react-router-dom'; // corregido: react-router-dom, no 'react-router'
import { styled } from '@mui/material';
import Logo from 'src/assets/images/logos/booth_logo.png'; // tu logo principal

const LinkStyled = styled(Link)(() => ({
  height: '60px',
  width: '180px',
  overflow: 'hidden',
  display: 'block',
}));

const AuthLogo = () => {
  return (
    <LinkStyled
      to="/"
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <img src={Logo} alt="logo" style={{ width: '174px', height: '64px' }} />
    </LinkStyled>
  );
};

export default AuthLogo;
