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
    TableContainer,
    Chip
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
    const [selectedEmployee, setSelectedEmployee] = useState<attritionEmployeeCustomer | null>(null);

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

        const sendBody = { cliente, riesgo };

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(sendBody),
            redirect: "follow",
        };

        showAlert("Risk per client", "success");

        fetch(`${config.rutaApi}show_attrition_employee_customer`, requestOptions)
            .then((response) => {
                if (response.status === 401) return handleUnauthorized();
                return response.json();
            })
            .then((result) => {
                if (result.error) throw new Error(result.error);

                const data = result.dataAttrition || result;
                if (!Array.isArray(data)) throw new Error("Invalid response format");

                const formattedData: attritionEmployeeCustomer[] = data.map((item: any) => ({
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
                }));

                setattrition_employee_customer(formattedData);
                setFilteredData(formattedData);
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showAlert(error.message || "Error in process", "error");
                    console.error(error);
                }
            })
            .finally(() => setLoading(false));
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

    useEffect(() => {
        if (!currentAlert && alertQueue.length > 0) {
            const nextAlert = alertQueue[0];
            setCurrentAlert(nextAlert);
            setAlertQueue(prev => prev.slice(1));
            setAlertOpen(true);
        }
    }, [alertQueue, currentAlert]);

    const handleAlertClose = (_?: unknown, reason?: string) => {
        if (reason === "clickaway") return;
        setAlertOpen(false);
        setCurrentAlert(null);
    };

    const handleUnauthorized = () => {
        showAlert("Session expired. Please log in again.", "error");
        sessionStorage.removeItem("token");
        navigate("/auth/login");
        throw new Error("Unauthorized");
    };

    const handleOpen = (employee: attritionEmployeeCustomer) => {
        setSelectedEmployee(employee);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedEmployee(null);
    };

    const riskCounts = {
        low: filteredData.filter(item => item.clasification.toLowerCase().includes("low")).length,
        medium: filteredData.filter(item => item.clasification.toLowerCase().includes("medium")).length,
        high: filteredData.filter(item => item.clasification.toLowerCase().includes("high")).length,
    };

    const parseTextAI = (text: string) => {
        if (!text) return {};

        return {
            brief: (text.match(/Attrition Risk Brief:([\s\S]*?)(?=\*\*Risk Level|Risk Level:)/i)?.[1] || "").trim(),
            riskLevel: (text.match(/Risk Level:([\s\S]*?)(?=\*\*Prioritized|Prioritized Risk Drivers:)/i)?.[1] || "").trim(),
            drivers: (text.match(/Prioritized Risk Drivers:([\s\S]*?)(?=\*\*Sentiment|Sentiment Analysis:)/i)?.[1] || "").trim(),
            sentiment: (text.match(/Sentiment Analysis:([\s\S]*?)(?=\*\*Overall|Overall Situation Assessment:)/i)?.[1] || "").trim(),
            assessment: (text.match(/Overall Situation Assessment:([\s\S]*?)(?=\*\*Recommended|Recommended Actions:)/i)?.[1] || "").trim(),
            actions: (text.match(/Recommended Actions:([\s\S]*)/i)?.[1] || "").trim(),
        };
    };

    const cleanAndSplitText = (text: string) => {
        if (!text) return [];
        return text
            .split(/\n|\. /) // dividimos por salto de línea o punto+espacio
            .map(item => item.replace(/\*\*|^-|\d+$/g, "").trim()) // quitamos **, -, números sueltos
            .filter(item => item.length > 0); // eliminamos vacíos
    };

    const parsed = selectedEmployee?.text_ai ? parseTextAI(selectedEmployee.text_ai) : null;

    const driversList = parsed?.drivers ? cleanAndSplitText(parsed.drivers) : [];
    const sentimentList = parsed?.sentiment ? cleanAndSplitText(parsed.sentiment) : [];
    const assessmentList = parsed?.assessment ? cleanAndSplitText(parsed.assessment) : [];
    const actionsList = parsed?.actions ? cleanAndSplitText(parsed.actions) : [];

    if (loading) return <BaseCard title="Loading..."><Typography>Show data...</Typography></BaseCard>;
    if (attrition_employee_customer.length === 0) return <BaseCard title="No data found"><Typography>No data available for analysis.</Typography></BaseCard>;

    return (
        <>
            {/* Alertas */}
            {currentAlert && (
                <Snackbar open={alertOpen} autoHideDuration={2000} onClose={handleAlertClose}>
                    <Alert onClose={handleAlertClose} severity={currentAlert.severity} sx={{ width: "100%" }}>
                        {currentAlert.msg}
                    </Alert>
                </Snackbar>
            )}

            {/* Conteo de riesgos */}
            <Box mb={3}>
                <BaseCard title="Overview of the analysis prediction">
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="subtitle1">Low Risks</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle1">Medium Risks</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle1">High Risks</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell><Typography fontWeight={600} color="success.main">{riskCounts.low}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={600} color="warning.main">{riskCounts.medium}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={600} color="error.main">{riskCounts.high}</Typography></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </BaseCard>
            </Box>

            {/* Tabla principal */}
            <BaseCard title={
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="h5">Predictive Attrition Analysis</Typography>
                    <InputSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm("")} placeholder="Search employee..." width={{ xs: "100%", sm: 300, md: 400 }} />
                </Box>
            }>
                <TableContainer>
                    <Table>
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
                            {filteredData.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{item.fullName}</TableCell>
                                    <TableCell>{item.customer}</TableCell>
                                    <TableCell>{item.calification}</TableCell>
                                    <TableCell>{item.clasification}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined" onClick={() => handleOpen(item)}>Show Risk</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </BaseCard>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                {selectedEmployee && (
                    <>
                        <DialogTitle sx={{ bgcolor: "#2a3547", color: "white", borderRadius: "8px 8px 0 0" }}>
                            ATTRITION RISK INSIGHTS - {selectedEmployee.fullName}
                            <Chip
                                label={selectedEmployee.clasification}
                                color={
                                    selectedEmployee.clasification.toLowerCase().includes("high")
                                        ? "error"
                                        : selectedEmployee.clasification.toLowerCase().includes("medium")
                                            ? "warning"
                                            : "success"
                                }
                                sx={{ ml: 2 }}
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Sección principal: Cliente + Sentiment + Risk Drivers */}
                            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                                {/* Cliente */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        p: 2,
                                        bgcolor: "grey.100",
                                        borderRadius: 2,
                                        flex: 1,
                                        minWidth: 120
                                    }}
                                >
                                    <Typography sx={{ fontSize: "2rem", mb: 1 }}>🏢</Typography>
                                    <Typography variant="body1" fontWeight="bold" align="center">
                                        {selectedEmployee.customer}
                                    </Typography>
                                </Box>

                                {/* Sentiment */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                        p: 2,
                                        bgcolor: "grey.100",
                                        borderRadius: 2,
                                        flex: 2
                                    }}
                                >
                                    <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>
                                        {selectedEmployee.calification === "Positive"
                                            ? "😀"
                                            : selectedEmployee.calification === "Negative"
                                                ? "😞"
                                                : selectedEmployee.calification === "Neutral"
                                                    ? "😐"
                                                    : "🤨"}
                                    </Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" fontWeight="bold" gutterBottom>
                                            {selectedEmployee.calification || "No comments to analyze"}
                                        </Typography>
                                        {sentimentList.length > 0 &&
                                            sentimentList.map((item, i) => (
                                                <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                                                    {item}
                                                </Typography>
                                            ))}
                                    </Box>
                                </Box>

                                {/* Risk Drivers */}
                                {driversList.length > 0 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 2,
                                            p: 2,
                                            bgcolor: "grey.100",
                                            borderRadius: 2,
                                            flex: 2,
                                            minWidth: 280
                                        }}
                                    >
                                        <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>
                                            {selectedEmployee.clasification.toLowerCase().includes("high")
                                                ? "🔴"
                                                : selectedEmployee.clasification.toLowerCase().includes("medium")
                                                    ? "🟡"
                                                    : "🟢"}
                                        </Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                                                Prioritized Risk Drivers
                                            </Typography>
                                            {driversList.map((item, i) => (
                                                <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                                                    • {item}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>

                            {/* Overall Situation Assessment */}
                            {assessmentList.length > 0 && (
                                <Box sx={{ display: "flex", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2, mb: 2 }}>
                                    <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>📝</Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Overall Situation Assessment
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                            {assessmentList.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </Box>
                                </Box>
                            )}

                            {/* Recommended Actions */}
                            {actionsList.length > 0 && (
                                <Box sx={{ display: "flex", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
                                    <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>✅</Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Recommended Actions
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                            {actionsList.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </Box>
                                </Box>
                            )}

                            {!parsed && <Typography>No analysis available.</Typography>}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} variant="contained" color="primary">Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

        </>
    );
};

export default ShowAttritionEmployeeCustomer;
