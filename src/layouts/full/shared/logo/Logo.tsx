import { Link } from 'react-router-dom';
import { styled } from '@mui/material';

import LogoImage from 'src/assets/images/logos/booth_logo.png';

const LinkStyled = styled(Link)(() => ({
  height: '64px',
  width: '180px',
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
}));

const Logo = () => {
  return (
    <LinkStyled to="/dashboard">
      <img src={LogoImage} alt="logo" style={{ width: '140px', height: '50px' }} />
    </LinkStyled>
  );
};

export default Logo;
