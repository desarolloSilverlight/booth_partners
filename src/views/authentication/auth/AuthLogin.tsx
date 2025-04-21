import {
    Box,
    Typography,
    Stack,
    Button
} from '@mui/material';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

const AuthLogin = ({ title, subtitle, subtext }: { title?: string, subtitle: any, subtext: any }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Username:', username);
        console.log('Password:', password);

        // Aquí puedes hacer validaciones o llamadas a backend
        if (username && password) {
            navigate('/dashboard');
        } else {
            alert('Por favor completa ambos campos');
        }
    };

    return (
        <form onSubmit={handleLogin}>
            {title ? (
                <Typography fontWeight="700" variant="h2" mb={1}>
                    {title}
                </Typography>
            ) : null}

            {subtext}

            <Stack>
                <Box>
                    <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor='username' mb="5px">
                        Username
                    </Typography>
                    <CustomTextField
                        id="username"
                        variant="outlined"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </Box>
                <Box mt="25px">
                    <Typography variant="subtitle1" fontWeight={500} component="label" htmlFor='password' mb="5px">
                        Password
                    </Typography>
                    <CustomTextField
                        id="password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Box>
            </Stack>

            <Box mt={3}>
                <Button
                    color="success"
                    variant="contained"
                    size="large"
                    fullWidth
                    type="submit"
                >
                    Ingresar
                </Button>
            </Box>

            {subtitle}
        </form>
    );
};

export default AuthLogin;
