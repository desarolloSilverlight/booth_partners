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
    const { setToken } = useAuth(); // Obtener la función setToken del contexto de autenticación
    const [open, setOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setAlertMsg('Por favor ingrese su usuario y contraseña');
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
                }

                setAlertMsg('¡Bienvenido, Ingreso Exitoso!');
                setOpen(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000); // Redirigir después de 2 segundos
            } else {
                setAlertMsg('Usuario o contraseña incorrectos');
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
                autoHideDuration={alertMsg === '¡Bienvenido, Ingreso Exitoso!' ? 2000 : 4000}
                onClose={() => setOpen(false)}
            >
                <Alert
                    onClose={() => setOpen(false)}
                    severity={alertMsg === '¡Bienvenido, Ingreso Exitoso!' ? 'success' : 'warning'}
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
                        color="error"
                        variant="contained"
                        size="large"
                        fullWidth
                        type="submit"
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
