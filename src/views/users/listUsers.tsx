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

const users = [
    {
        id: "1",
        name: "Andres Felipe",
        lastName: "Criales Cortes",
        status: "Activo",
        pbg: "success.main",
        href: "Editar",
        pbg_href: "primary.main", 
    },
    {
        id: "2",
        name: "Rodrigo Andres",
        lastName: "Quintero",
        status: "Activo",
        pbg: "success.main",
        href: "Editar",
        pbg_href: "primary.main",
    },
    {
        id: "3",
        name: "Juan Camilo",
        lastName: "Chaparro Cenizo",
        status: "No Activo",
        pbg: "error.main",
        href: "Editar",
        pbg_href: "primary.main",
    },
]

const listUsers = () => {

    const navigate = useNavigate();

    const editClick = (id: string) => {
        //navigate(`/users/edit/${id}`);
        navigate('/form-layouts');
    }

    return(
        <BaseCard title="Users">
            <TableContainer
                sx={{
                    width: {
                        xs: "200px",
                        sm: "100%",                       
                    },
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
                                    Firts Name
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
                    {users.map((user) => (
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
                                            backgroundColor: user.pbg_href,
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
}

export default listUsers;
    