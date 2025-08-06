import { Box, Typography, Stack, Button, Snackbar, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from "src/config/config";
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useAuth } from 'src/context/AuthContext';

interface Employee {
    id: string;
    full_name: string;
    gender: string;
    birthday: string;
    civil_status: string;
    nationality: string;
    active_since: string;
    active_until: string;
    status: string;
    pbg: string;
    document_type: string;
    document_number: string;
    edad: string;
    region: string;
    district: string;
    education_level: string;
    health_company: string;
    type_of_contract: string;
    regular_hours: string;
    role_name: string;
    role_description: string;
    days?: string[];
    anniversaryBenefit: string;
    birthdayBenefit: string;
    sickLeavePlan: string;
    termination_reason: string;
    salary_level: string;
    attrition_type: string;
    attrition_category: string;
    attrition_specific_reason: string;
}

const AuthLogin = ({ title, subtitle, subtext }: { title?: string, subtitle: any, subtext: any }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setToken } = useAuth(); // Obtener la función setToken del contexto de autenticación
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alertMsg, setAlertMsg] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        //console.log('Username:', username);
        //console.log('Password:', password);

        if (username && password) {
            fetch(`${config.rutaApi}login`, {
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
                    // console.log(data);
                    if (data.status === 'success') {
                        setAlertMsg('Actualizando datos, por favor espere...');
                        setOpen(true);
                        setToken(data.token);

                        const token = sessionStorage.getItem("token");
                        if (!token) {
                            console.error("Token not found");
                            setLoading(false);
                            return;
                        }

                        const myHeaders = new Headers();
                        myHeaders.append("Content-Type", "application/json");
                        myHeaders.append("auth_token", config.tokenApiBuk);

                        const requestOptions: RequestInit = {
                            method: "GET",
                            headers: myHeaders,
                            redirect: "follow",
                        };

                        fetch(`${config.rutaApiBuk}employees?page=2`, requestOptions)
                            .then((response) => response.json())
                            .then(async (result) => {
                                const employeesData = Array.isArray(result.data) ? result.data : [result.data];
                                const formattedEmployees = await Promise.all(
                                    employeesData.map(async (employee: any) => {
                                        // Datos del primer fetch
                                        const employee_id = employee.person_id;
                                        const birthday = employee.birthday;
                                        const active_since = employee.active_since;

                                        // Segundo fetch (jobs)
                                        const jobResponse = await fetch(
                                            `${config.rutaApiBuk}employees/${employee.id}/jobs`,
                                            requestOptions
                                        );
                                        const jobResult = await jobResponse.json();
                                        const dataJobs = jobResult.data[0];

                                        // Cálculos
                                        const edad = birthday ? new Date().getFullYear() - new Date(birthday).getFullYear() : null;

                                        // Formatear estado
                                        const statusValue = employee.status;
                                        let status, pbg;

                                        if (statusValue === "activo") {
                                            status = "Active";
                                            pbg = "success.main";
                                        } else if (statusValue === "inactivo") {
                                            status = "Not Active";
                                            pbg = "error.main";
                                        } else {
                                            status = "A stranger";
                                            pbg = "warning.main";
                                        }

                                        // Objeto final combinado
                                        return {
                                            id: employee.person_id,
                                            full_name: employee.full_name,
                                            gender: employee.gender,
                                            birthday: employee.birthday,
                                            civil_status: employee.civil_status,
                                            nationality: employee.nationality,
                                            active_since: employee.active_since,
                                            active_until: employee.active_until,
                                            status: status,
                                            pbg: pbg,
                                            document_type: employee.document_type,
                                            document_number: employee.document_number,
                                            edad: edad,
                                            region: employee.region,
                                            district: employee.district,
                                            education_level: employee.custom_attributes?.['Educational level'],
                                            health_company: employee.health_company,
                                            type_of_contract: dataJobs?.type_of_contract,
                                            regular_hours: dataJobs?.regular_hours,
                                            role_name: dataJobs?.role.name,
                                            role_description: dataJobs?.role.description || employee.custom_attributes?.['Funciones Especiales'],
                                            days: dataJobs?.days || [],
                                            anniversaryBenefit: employee.custom_attributes?.['Anniversary benefit'] || "",
                                            birthdayBenefit: employee.custom_attributes?.['Birthday benefit'] || "",
                                            sickLeavePlan: employee.custom_attributes?.['Sick Leave Plan'] || "",
                                            termination_reason: employee.termination_reason,
                                            salary_level: employee.custom_attributes?.['Salary level'] || "",
                                            attrition_type: employee.custom_attributes?.['Attrition type'] || "",
                                            attrition_category: employee.custom_attributes?.['Attrition Category'] || "",
                                            attrition_specific_reason: employee.custom_attributes?.['Attrition specific reason'] || "",

                                        };
                                    })
                                );

                                //console.log("Formatted Employees:", formattedEmployees);

                                // Guardar todos los empleados y actualizar estado
                                await Promise.all(formattedEmployees.map(emp => saveEmployeeDB(emp)));

                                setAlertMsg('¡Bienvenido, Ingreso Exitoso!');
                                setOpen(true);
                                setTimeout(() => {
                                    navigate('/dashboard');
                                }, 2000); // Redirigir después de 2 segundos


                            })
                            .catch((error) => {
                                console.error("Error:", error)
                                setAlertMsg('Error al actualizar información.');
                                setOpen(true);
                            })
                            .finally(() => setLoading(false));
                    } else {
                        setAlertMsg('Usuario o contraseña incorrectos');
                        setOpen(true);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    setAlertMsg('Error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
                    setOpen(true);
                });
        } else {
            alert('Por favor completa Ingrese su usuario y contraseña');
        }
    };

    const saveEmployeeDB = async (employee: Employee) => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            console.error('Token no encontrado en sessionStorage');
            return;
        }

        // Construimos el objeto limpio
        const payload = {
            full_name: employee.full_name,
            gender: employee.gender,
            birthday: employee.birthday,
            civil_status: employee.civil_status,
            nationality: employee.nationality,
            active_since: employee.active_since,
            active_until: employee.active_until,
            status: employee.status,
            document_type: employee.document_type,
            document_number: employee.document_number,

            edad: employee.edad,
            region: employee.region,
            education_level: employee.education_level,
            type_of_contract: employee.type_of_contract,
            regular_hours: employee.regular_hours,

            role_name: employee.role_name,
            role_description: employee.role_description,
            days: employee.days || [],

            anniversaryBenefit: employee.anniversaryBenefit,
            birthdayBenefit: employee.birthdayBenefit,
            sickLeavePlan: employee.sickLeavePlan,

            termination_reason: employee.termination_reason,

            salary_level: employee.salary_level,
            attrition_type: employee.attrition_type,
            attrition_category: employee.attrition_category,
            attrition_specific_reason: employee.attrition_specific_reason,

        };

        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("authToken", token);

            const requestOptions: RequestInit = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(payload),
                redirect: "follow",
            };

            const response = await fetch(`${config.rutaApi}saveEmployee`, requestOptions);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error al guardar el empleado:", {
                    status: response.status,
                    error: errorData.message || "Error desconocido",
                });
                return { success: false, error: errorData.message || "Error desconocido" };
            }

            const result = await response.json();
            // console.log("Empleado guardado:", result);
            return { success: true, data: result };

        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            return { success: false, error: "Error al guardar el empleado" };
        }
    };

    return (
        <>
            <Snackbar open={open} autoHideDuration={alertMsg === '¡Bienvenido, Ingreso Exitoso!' ? 2000 : null} onClose={() => setOpen(false)}>
                <Alert onClose={() => setOpen(false)} severity={alertMsg === '¡Bienvenido, Ingreso Exitoso!' ? 'success' : 'info'} sx={{ width: '100%' }}>
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
                        Log In
                    </Button>
                </Box>

                {subtitle}
            </form>
        </>
    );
};

export default AuthLogin;
