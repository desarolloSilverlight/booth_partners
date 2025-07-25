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
}

const ListEmployes = () => {
    const navigate = useNavigate();
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
        myHeaders.append("authToken", token);

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        fetch(`${config.rutaApi}employee_system_list`, requestOptions)
            .then((response) => response.json())
            .then(async (result) => {
                // console.log("📦 Resultado:", result);
                const employeesData = Array.isArray(result.dataEmployees) ? result.dataEmployees : [result.dataEmployees];
                const formattedEmployees = await Promise.all(
                    employeesData.map(async (employee: any) => {
                        // Formatear estado
                        const statusValue = employee.status;
                        let status, pbg;

                        if (statusValue === "Active") {
                            status = "Active";
                            pbg = "success.main";
                        } else if (statusValue === "Not Active") {
                            status = "Not Active";
                            pbg = "error.main";
                        } else {
                            status = "A stranger";
                            pbg = "warning.main";
                        }

                        // Objeto final combinado
                        return {
                            id: employee.id_employee,
                            full_name: employee.full_name,
                            document_type: employee.document_type,
                            document_number: employee.document_number,
                            gender: employee.gender,
                            birthday: employee.birthday,
                            civil_status: employee.civil_status,
                            nationality: employee.nationality,
                            active_since: employee.active_since,
                            active_until: employee.active_until,
                            status: status,
                            pbg: pbg,
                        };
                    })
                );                
                setEmployees(formattedEmployees);
                setFilteredEmployees(formattedEmployees);
            })
            .catch((error) => console.error("Error:", error))
            .finally(() => setLoading(false));
    }, []);

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
    // function calcularAniosMeses(fechaInicioStr: string): string {
    //     const fechaInicio = new Date(fechaInicioStr);
    //     const fechaActual = new Date();
    //     let anios = fechaActual.getFullYear() - fechaInicio.getFullYear();
    //     let meses = fechaActual.getMonth() - fechaInicio.getMonth();
    //     if (meses < 0) {
    //         anios--;
    //         meses += 12;
    //     }
    //     return `${anios} years and ${meses} months`;
    // }

    const showEmployee = (id: string) => {
        //console.log("ID del empleado:", id);
        navigate(`/employees/showEmploye/${id}`);
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
                    EMPLOYEES
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
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Action
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
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            label="Show"
                                            onClick={() => showEmployee(employee.id)}
                                            sx={{
                                                backgroundColor: "primary.main",
                                                color: "white",
                                                fontWeight: "600",
                                                fontSize: "0.75rem",
                                                cursor: "pointer",
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