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
import { error } from "console";

interface Employee{
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
}

const ListEmployes = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            console.error("Token no encontrado");
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

        fetch(`${config.rutaApiBuk}employees/active`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                if (result.data) {
                    const formattedEmployees = result.data.map((employee: any) => {
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

                        const formattedEmployee = {
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
                        };

                        // Enviamos el empleado a la otra base de datos
                        saveEmployeeDB(formattedEmployee);

                        return formattedEmployee;
                    });

                    setEmployees(formattedEmployees);
                    setFilteredEmployees(formattedEmployees);
                }
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
            active_until: employee.active_until || null, // si está vacío, mandamos null
            status: employee.status,
            document_type: employee.document_type,
            document_number: employee.document_number
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
                return {success: false, error: errorData.message || "Error desconocido"};
            }

            const result = await response.json();
            console.log("Empleado guardado:", result);
            return {success: true, data: result};

        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            return {success: false, error: "Error al guardar el empleado"};
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
                grap: {xs: 2, sm: 4},
                flexDirection: {xs: "column", sm: "row"},
            }}>
                <Typography variant="h5" sx={{
                    width: {xs: "100%", sm: "auto"},
                    textAlign: {xs: "left", sm: "inherit"}
                }}>
                    Empleados
                </Typography>

                <InputSearch
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                    placeholder="Buscar empleados..."
                    width={{xs: "100%", sm: 300, md: 400}}
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