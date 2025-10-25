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
import { useNavigate } from "react-router-dom";
import config from "src/config/config";
import { useEffect, useState } from "react";
import InputSearch from "src/components/forms/inputSearch/search";

interface User {
    id: string;
    name: string;
    lastName: string;
    status: string;
    pbg: string;
    href: string;
    pbg_href: string;
}

const ListUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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
        myHeaders.append("authToken", token);

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        fetch(`${config.rutaApi}users_system_list`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                //console.log(result);                
                if (result.dataUsers) {
                    const formattedUsers = result.dataUsers.map((user: any) => {
                        const statusValue = user.userStatus;
                        let status, pbg;

                        if (statusValue === 1) {
                            status = "Active";
                            pbg = "success.main";
                        } else if (statusValue === 2) {
                            status = "Not Active";
                            pbg = "error.main";
                        } else {
                            status = "A stranger";
                            pbg = "warning.main";
                        }

                        return {
                            id: user.id_userSystem,
                            name: user.first_name,
                            lastName: user.last_name,
                            status: status,
                            pbg: pbg,
                            href: "Edit",
                            pbg_href: "primary.main"
                        };
                    });
                    setUsers(formattedUsers);
                    setFilteredUsers(formattedUsers);
                }
            })
            .catch((error) => {
                console.error("Error al obtener usuarios:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    const editClick = (id: string) => {
        navigate('/form-layouts');
    }

    if (loading) {
        return (
            <BaseCard title="Loading...">
                <Typography>Cargando usuarios...</Typography>
            </BaseCard>
        );
    }

    if (users.length === 0) {
        return (
            <BaseCard title="Users">
                <Typography>No se encontraron usuarios</Typography>
            </BaseCard>
        );
    }

    return (
        <BaseCard title={
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: { xs: 2, sm: 4 },
                flexDirection: { xs: 'column', sm: 'row' },
            }}>
                <Typography variant="h5" sx={{
                    width: { xs: '100%', sm: 'auto' },
                    textAlign: { xs: 'left', sm: 'inherit' }
                }}>
                    Users
                </Typography>

                <InputSearch
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                    placeholder="Buscar usuarios..."
                    width={{ xs: '100%', sm: 300, md: 400 }}
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
                                    First Name
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    Last Name
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle1">
                                    User Status
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
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Typography fontSize="15px" fontWeight={500}>
                                        {user.id}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {user.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography color="textSecondary" fontSize="14px">
                                        {user.lastName}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            label={user.status}
                                            sx={{
                                                backgroundColor: user.pbg,
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
                                            label={user.href}
                                            onClick={() => editClick(user.id)}
                                            sx={{
                                                backgroundColor: "#0D4B3B",
                                                color: "white",
                                                fontWeight: "600",
                                                fontSize: "0.75rem",
                                                cursor: "pointer",
                                                '&:hover': { backgroundColor: '#0a3d32' },
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
}

export default ListUsers;