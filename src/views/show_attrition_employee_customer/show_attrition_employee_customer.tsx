import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Snackbar,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import InputSearch from "src/components/forms/inputSearch/search";
import config from "src/config/config";

interface attritionEmployeeCustomer {
    id: number;
    fullName: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
}

const ShowAttritionEmployeeCustomer = () => {
    const [attrition_employee_customer, setattrition_employee_customer] = useState<attritionEmployeeCustomer[]>([]);
    const [filteredData, setFilteredData] = useState<attritionEmployeeCustomer[]>([]);
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const params = new URLSearchParams(location.search);
    const navigate = useNavigate();
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);

    // estado para el Dialog
    const [open, setOpen] = useState(false);
    const [selectedText, setSelectedText] = useState("");

    const cliente = params.get("cliente");
    const riesgo = params.get("riesgo");

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            showAlert("Token defeated, enter again", "error");
            setLoading(false);
            navigate("/auth/login");
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("authToken", token);
        myHeaders.append("Content-Type", "application/json");

        const sendBody = {
            cliente: cliente,
            riesgo: riesgo
        };

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(sendBody),
            redirect: "follow",
        };

        showAlert("Show Analitics Attrition", "success");

        fetch(`${config.rutaApi}show_attrition_employee_customer`, requestOptions)
            .then((response) => {
                if (response.status === 401) return handleUnauthorized();
                return response.json();
            })
            .then((result) => {
                if (result.error) {
                    throw new Error(result.error);
                }

                if (result.message) {
                    showAlert(result.message, "info");
                    setFilteredData([]);
                    setattrition_employee_customer([]);
                    return;
                }

                const data = result.dataAttrition || result; // soporta ambos casos

                if (!Array.isArray(data)) {
                    throw new Error("Invalid response format");
                }

                const formattedData: attritionEmployeeCustomer[] = data.map((item: any) => {
                    return {
                        id: item.fkid_employe,
                        fullName: item.full_name || "",
                        customer: item.customer || "",
                        calification: (() => {
                            try {
                                const obj = typeof item.calification === "string"
                                    ? JSON.parse(item.calification.replace(/'/g, '"'))
                                    : item.calification;
                                return obj?.Nivel || "";
                            } catch {
                                return "";
                            }
                        })(),
                        clasification: item.clasification || "",
                        attrition_probability: item.attrition_probability || "",
                        text_ai: item.text_ai || "",
                    };
                });

                console.log("Formatted Data:", formattedData);
                setattrition_employee_customer(formattedData);
                setFilteredData(formattedData);
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showAlert(error.message || "Error in process", "error");
                    console.error(error);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const showAlert = (msg: string, severity: "info" | "success" | "error") => {
        setAlertQueue(prev => [...prev, { msg, severity }]);
    };

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(attrition_employee_customer);
        } else {
            const filteredData = attrition_employee_customer.filter((dataAnalysis) =>
                dataAnalysis.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filteredData);
        }
    }, [searchTerm, attrition_employee_customer]);

    // controla alert queue
    useEffect(() => {
        if (!currentAlert && alertQueue.length > 0) {
            const nextAlert = alertQueue[0];
            setCurrentAlert(nextAlert);
            setAlertQueue(prev => prev.slice(1));
            setAlertOpen(true);
        }
    }, [alertQueue, currentAlert]);

    const handleAlertClose = (_?: unknown, reason?: string) => {
        if (reason === 'clickaway') return;
        setAlertOpen(false);
        setCurrentAlert(null);
    };

    const handleUnauthorized = () => {
        showAlert("Session expired. Please log in again.", "error");
        sessionStorage.removeItem("token");
        navigate("/auth/login");
        throw new Error("Unauthorized");
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    // abrir y cerrar Dialog
    const handleOpen = (text: string) => {
        setSelectedText(text);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedText("");
    };

    if (loading) {
        return (
            <BaseCard title="Loading...">
                <Typography>Show data...</Typography>
            </BaseCard>
        );
    }

    if (!loading && filteredData.length === 0) {
        return (
            <BaseCard title="No data found">
                <Typography>No data available for analysis.</Typography>
            </BaseCard>
        );
    }

    return (
        <>
            <Snackbar
                open={alertOpen}
                autoHideDuration={2000}
                onClose={handleAlertClose}
                key={currentAlert?.msg}
            >
                {currentAlert ? (
                    <Alert
                        onClose={handleAlertClose}
                        severity={currentAlert.severity}
                        sx={{ width: '100%' }}
                    >
                        {currentAlert.msg}
                    </Alert>
                ) : (
                    <></>
                )}
            </Snackbar>

            <BaseCard title={
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        gap: { xs: 2, sm: 4 },
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="h5">
                            Predictive Attrition Analysis
                        </Typography>
                    </Box>

                    <InputSearch
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClearSearch={handleClearSearch}
                        placeholder="Analyzing ...."
                        width={{ xs: '100%', sm: 300, md: 400 }}
                    />
                </Box>
            }>
                <TableContainer
                    sx={{
                        width: "100%",
                        overflowX: "auto",
                    }}
                >
                    <Table aria-label="simple table" sx={{ whiteSpace: "nowrap" }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>No.</TableCell>
                                <TableCell>Full Name</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Perception</TableCell>
                                <TableCell>Analysis result</TableCell>
                                <TableCell>Predictive analysis</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((dataAnalysis, index) => (
                                <TableRow key={dataAnalysis.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{dataAnalysis.fullName}</TableCell>
                                    <TableCell>{dataAnalysis.customer}</TableCell>
                                    <TableCell>{dataAnalysis.calification}</TableCell>
                                    <TableCell>{dataAnalysis.clasification}</TableCell>
                                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                            onClick={() => handleOpen(dataAnalysis.text_ai)}
                                        >
                                            Show Text
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </BaseCard>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Predictive Analysis</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {selectedText}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ShowAttritionEmployeeCustomer;
