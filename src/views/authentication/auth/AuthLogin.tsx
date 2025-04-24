import { Box, Typography, Stack, Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rutaApi from 'src/config/config';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';

const AuthLogin = ({ title, subtitle, subtext }: { title?: string, subtitle: any, subtext: any }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setToken } = useAuth(); // Obtener la función setToken del contexto de autenticación

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        //console.log('Username:', username);
        //console.log('Password:', password);

        if (username && password) {
            fetch(`${rutaApi}login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log(data);
                    if (data.status === 'success') {
                        setToken(data.token);
                        navigate('/dashboard');
                    } else {
                        alert('Usuario o contraseña incorrectos');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Error al iniciar sesión. Por favor, Inténtalo de nuevo más tarde.');
                });

        } else {
            alert('Por favor completa Ingrese su usuario y contraseña');
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </Box>
            </Stack>

            <Box mt={3}>
                <Button
                    color="error"
                    variant="contained"
                    size="large"
                    fullWidth
                    type="submit"
                >
                    Get In
                </Button>
            </Box>

            {subtitle}
        </form>
    );
};

export default AuthLogin;
