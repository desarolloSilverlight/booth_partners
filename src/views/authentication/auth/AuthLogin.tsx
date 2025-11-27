import { Box, Typography, Stack, Button, Snackbar, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from "src/config/config";
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';

const AuthLogin = ({ title, subtitle, subtext }: { title?: string, subtitle: any, subtext: any }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setToken, setProfile } = useAuth(); // Obtener funciones del contexto
    const [open, setOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setAlertMsg('Please enter your username and password');
            setOpen(true);
            return;
        }

        try {
            const loginRes = await fetch(`${config.rutaApi}login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!loginRes.ok) {
                throw new Error(`Error HTTP: ${loginRes.status}`);
            }

            const data = await loginRes.json();

            if (data.status === 'success') {
                // si tu API devuelve un token, lo guardamos en el contexto
                if (data.token) {
                    setToken(data.token);
                    sessionStorage.setItem('name_user', data.name_user);
                    sessionStorage.setItem('username', username);
                    setProfile(Number(data.system_profile) || 0); // perfil solo en contexto
                }

                setAlertMsg('Welcome, Successful Login!');
                setOpen(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000); // Redirigir después de 2 segundos
            } else {
                setAlertMsg('Incorrect username or password');
                setOpen(true);
            }
        } catch (error) {
            console.error('Error al manejar el login:', error);
            setAlertMsg('Error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
            setOpen(true);
        }
    };

    return (
        <>
            <Snackbar
                open={open}
                autoHideDuration={alertMsg === 'Welcome, Successful Login!' ? 2000 : 4000}
                onClose={() => setOpen(false)}
            >
                <Alert
                    onClose={() => setOpen(false)}
                    severity={alertMsg === 'Welcome, Successful Login!' ? 'success' : 'warning'}
                    sx={{ width: '100%' }}
                >
                    {alertMsg}
                </Alert>
            </Snackbar>

            <form onSubmit={handleLogin}>
                {title ? (
                    <Typography fontWeight="700" variant="h2" mb={1}>
                        {title}
                    </Typography>
                ) : null}

                {subtext}

                <Stack>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            component="label"
                            htmlFor="username"
                            mb="5px"
                        >
                            Username
                        </Typography>
                        <CustomTextField
                            id="username"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setUsername(e.target.value)
                            }
                        />
                    </Box>
                    <Box mt="25px">
                        <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            component="label"
                            htmlFor="password"
                            mb="5px"
                        >
                            Password
                        </Typography>
                        <CustomTextField
                            id="password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value)
                            }
                        />
                    </Box>
                </Stack>

                <Box mt={3}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        type="submit"
                        sx={{
                            backgroundColor: '#0D4B3B',
                            '&:hover': {
                                backgroundColor: '#093828'
                            }
                        }}
                    >
                        Log In
                    </Button>
                </Box>

                {subtitle}
            </form>
        </>
    );
};

export default AuthLogin;
