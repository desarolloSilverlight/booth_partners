import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    TableContainer,
    Stack
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "src/config/config";
import InputSearch from "src/components/forms/inputSearch/search";
import { error, log } from "console";
import { start } from "repl";

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

    tiempoEmpresa: string;
    tiempoCargo: string;
    type_of_contract: string;
    regular_hours: string;

    role_name: string;
    role_description: string;

    days?: string[];
}

const ListEmployes = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
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

        fetch(`${config.rutaApiBuk}employees`, requestOptions)
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
                        const tiempoEmpresa = active_since ? calcularAniosMeses(active_since) : null;
                        const tiempoCargo = dataJobs?.start_date ? calcularAniosMeses(dataJobs.start_date) : null;

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
                            tiempoEmpresa: employee.tiempoEmpresa,
                            tiempoCargo: employee.tiempoCargo,
                            type_of_contract: dataJobs?.type_of_contract,
                            regular_hours: dataJobs?.regular_hours,

                            role_name: dataJobs?.role.name,
                            role_description: dataJobs?.role.description || employee.custom_attributes?.['Funciones Especiales'],
                            days: dataJobs?.days || [],
                        };
                    })
                );

                console.log("Formatted Employees:", formattedEmployees);                

                // Guardar todos los empleados y actualizar estado
                await Promise.all(formattedEmployees.map(emp => saveEmployeeDB(emp)));
                setEmployees(formattedEmployees);
                setFilteredEmployees(formattedEmployees);
            })
            .catch((error) => console.error("Error:", error))
            .finally(() => setLoading(false));
    }, []);

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

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredEmployees(employees);
        } else {
            const filtered = employees.filter((employee) =>
                employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.document_number.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredEmployees(filtered);
        }
    }, [searchTerm, employees]);

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    }

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    // Función para calcular diferencia en años y meses
    function calcularAniosMeses(fechaInicioStr: string): string {
        const fechaInicio = new Date(fechaInicioStr);
        const fechaActual = new Date();
        let anios = fechaActual.getFullYear() - fechaInicio.getFullYear();
        let meses = fechaActual.getMonth() - fechaInicio.getMonth();
        if (meses < 0) {
            anios--;
            meses += 12;
        }
        return `${anios} years and ${meses} months`;
    }

    if (loading) {
        return (
            <BaseCard title="Loading...">
                <Typography variant="body1">Load all employees...</Typography>
            </BaseCard>
        );
    }

    if (employees.length === 0) {
        return (
            <BaseCard title="Not Found Employees.">
                <Typography variant="body1">Not Found Employees.</Typography>
            </BaseCard>
        );
    }

    return (
        <BaseCard title={
            <Box sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                grap: { xs: 2, sm: 4 },
                flexDirection: { xs: "column", sm: "row" },
            }}>
                <Typography variant="h5" sx={{
                    width: { xs: "100%", sm: "auto" },
                    textAlign: { xs: "left", sm: "inherit" }
                }}>
                    Empleados
                </Typography>

                <InputSearch
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                    placeholder="Buscar empleados..."
                    width={{ xs: "100%", sm: 300, md: 400 }}
                />
            </Box>
        }>
            <TableContainer
                sx={{
                    width: {
                        xs: "100%",
                        sm: "100%",
                    },
                    overflowX: "auto",
                }}
            >
                <Table
                    aria-label="simple table"
                    sx={{
                        whiteSpace: "nowrap",
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    No.
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Full Name
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Document Type
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Document Number
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    gender
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    birthday
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Civil Status
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Nationality
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Active Since
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Active Until
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Status
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployees.map((employee, index) => (
                            <TableRow key={employee.id}>
                                <TableCell>
                                    <Typography fontSize="15px" fontWeight={500}>
                                        {index + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.full_name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.document_type}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.document_number}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.gender}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.birthday}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.civil_status}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.nationality}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.active_since}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {employee.active_until}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            label={employee.status}
                                            sx={{
                                                backgroundColor: employee.pbg,
                                                color: "white",
                                                fontWeight: "600",
                                                fontSize: "0.75rem",
                                            }}
                                        />
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </BaseCard>
    );
};

export default ListEmployes;