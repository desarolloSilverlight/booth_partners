import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Snackbar,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useEffect, useState } from "react";
import config from "src/config/config";
import InputSearch from "src/components/forms/inputSearch/search";
import { useNavigate } from "react-router";
import dayjs from "dayjs";

interface Predictive_Analysis {
    id: number;
    fullName: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
}

const PredictiveAnalytics = () => {
    const [predictive_analitics, setPredictive_analitics] = useState<Predictive_Analysis[]>([]);
    const [filtereredData, setFilteredData] = useState<Predictive_Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Predictive_Analysis | null>(null);

    const yesterdayUpdate = dayjs()
        .subtract(1, "day")
        .set("hour", 17)
        .set("minute", 0)
        .format("MMMM DD, YYYY, hh:mm A");

    const handleOpen = (employee: Predictive_Analysis) => {
        setSelectedEmployee(employee);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedEmployee(null);
    };

    useEffect(() => {
        if (!alertOpen && alertQueue.length > 0) {
            const [nextAlert, ...rest] = alertQueue;
            setCurrentAlert(nextAlert);
            setAlertQueue(rest);
            setAlertOpen(true);
        }
    }, [alertQueue, alertOpen]);

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

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        showAlert("Show Analitics Attrition", "success");

        fetch(`${config.rutaApi}show_metrics_analytics_attrition`, requestOptions)
            .then((response) => {
                if (response.status === 401) return handleUnauthorized();
                return response.json();
            })
            .then((result) => {
                if (!result || !Array.isArray(result)) {
                    throw new Error("Invalid response format");
                }

                const formattedData: Predictive_Analysis[] = result.map((item: any) => {
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

                setPredictive_analitics(formattedData);
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

    const handleAlertClose = (_?: unknown, reason?: string) => {
        if (reason === 'clickaway') return;
        setAlertOpen(false);
    };

    const handleUnauthorized = () => {
        showAlert("Session expired. Please log in again.", "error");
        sessionStorage.removeItem("token");
        navigate("/auth/login");
        throw new Error("Unauthorized");
    };

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(predictive_analitics);
        } else {
            const filteredData = predictive_analitics.filter((dataAnalysis) =>
                dataAnalysis.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                dataAnalysis.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filteredData);
        }
    }, [searchTerm, predictive_analitics]);

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    if (loading) {
        return (
            <BaseCard title="Loading...">
                <Typography>Show data...</Typography>
            </BaseCard>
        );
    }

    if (predictive_analitics.length === 0) {
        return (
            <BaseCard title="No data found">
                <Typography>No data available for analysis.</Typography>
            </BaseCard>
        );
    }

    const riskCounts = {
        low: filtereredData.filter(item => item.clasification.toLowerCase().includes("low")).length,
        medium: filtereredData.filter(item => item.clasification.toLowerCase().includes("medium")).length,
        high: filtereredData.filter(item => item.clasification.toLowerCase().includes("high")).length,
    }

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

    return (
        <>
            {/* Alertas */}
            {currentAlert && (
                <Snackbar
                    open={alertOpen}
                    autoHideDuration={2000}
                    onClose={handleAlertClose}
                    key={currentAlert.msg}
                >
                    <Alert onClose={handleAlertClose} severity={currentAlert.severity} sx={{ width: '100%' }}>
                        {currentAlert.msg}
                    </Alert>
                </Snackbar>
            )}

            {/* Conteo de riesgos */}
            <Box mb={3}>
                <BaseCard title="Overview of the analysis prediction">
                    <TableContainer>
                        <Table aria-label="risk counts" sx={{ whiteSpace: "nowrap" }}>
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
            <Box mb={3}>
                <BaseCard title={
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h5">Predictive Attrition Analysis</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                                Last update: {yesterdayUpdate} (Colombia Time)
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
                    <TableContainer>
                        <Table aria-label="main table" sx={{ whiteSpace: "nowrap" }}>
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
                                {filtereredData.map((dataAnalysis, index) => (
                                    <TableRow key={dataAnalysis.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{dataAnalysis.fullName}</TableCell>
                                        <TableCell>{dataAnalysis.customer}</TableCell>
                                        <TableCell>{dataAnalysis.calification}</TableCell>
                                        <TableCell>{dataAnalysis.clasification}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ mt: 1 }}
                                                onClick={() => handleOpen(dataAnalysis)}
                                            >
                                                Show Risk
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </BaseCard>
            </Box>

            {/* Modal global */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                {selectedEmployee && (
                    <>
                        <DialogTitle sx={{ bgcolor: "#2a3547", color: "white", borderRadius: "8px 8px 0 0" }}>
                            ATTRITION RISK INSIGHTS - {selectedEmployee.fullName}
                            <Chip
                                label={selectedEmployee.clasification}
                                color={
                                    selectedEmployee.clasification.toLowerCase().includes("high") ? "error"
                                        : selectedEmployee.clasification.toLowerCase().includes("medium") ? "warning"
                                            : "success"
                                }
                                sx={{ ml: 2 }}
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Título */}
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Prioritized Risk Drivers</Typography>

                            {/* Contenedor en fila */}
                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                {/* Recuadro 1: Nombre */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column", // Cambia a columna
                                        alignItems: "center",
                                        justifyContent: "center",
                                        p: 2,
                                        bgcolor: "grey.100",
                                        borderRadius: 2,
                                        flex: 1,
                                        minWidth: 100
                                    }}
                                >
                                    <Typography sx={{ fontSize: "2rem", mb: 1 }}>🏢</Typography>
                                    <Typography variant="body1" fontWeight="bold" align="center">
                                        {selectedEmployee.customer}
                                    </Typography>
                                </Box>

                                {/* Recuadro 2: Carita + Sentiment */}
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
                                    {/* Carita */}
                                    <Typography
                                        sx={{
                                            fontSize: "2rem",
                                            flexShrink: 0,
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        {selectedEmployee.calification === "Positive" ? "😀" :
                                            selectedEmployee.calification === "Negative" ? "😞" :
                                                selectedEmployee.calification === "Neutral" ? "😐" :
                                                    "🤨"}
                                    </Typography>

                                    {/* Texto: Calificación + Sentiment Analysis */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" fontWeight="bold" gutterBottom>
                                            {selectedEmployee.calification === "Positive" ? "Positive" :
                                                selectedEmployee.calification === "Negative" ? "Negative" :
                                                    selectedEmployee.calification === "Neutral" ? "Neutral" :
                                                        "No comments to analyze"}
                                        </Typography>
                                        {sentimentList.length > 0 && (
                                            <Box>
                                                {sentimentList.map((item, index) => (
                                                    <Typography
                                                        key={index}
                                                        variant="body2"
                                                        sx={{ color: "text.secondary", mb: 0.5 }}
                                                    >
                                                        {item}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* Recuadro 3: Prioritized Risk Drivers */}
                                {parsed && driversList.length > 0 && (
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
                                        {/* Emoji de riesgo */}
                                        <Typography
                                            sx={{
                                                fontSize: "2rem",
                                                flexShrink: 0,
                                                display: "flex",
                                                alignItems: "center"
                                            }}
                                        >
                                            {selectedEmployee.clasification.toLowerCase().includes("high") ? "❌" :
                                                selectedEmployee.clasification.toLowerCase().includes("medium") ? "⚠️" :
                                                    selectedEmployee.clasification.toLowerCase().includes("low") ? "✅" :
                                                        "⚪"}
                                        </Typography>

                                        {/* Texto y lista de drivers */}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                                                Prioritized Risk Drivers
                                            </Typography>
                                            {driversList.map((item, index) => (
                                                <Typography
                                                    key={index}
                                                    variant="body2"
                                                    sx={{ color: "text.secondary", mb: 1 }}
                                                >
                                                    • {item}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>

                            {/* Overall Situation Assessment */}
                            {parsed && assessmentList.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                        p: 2,
                                        bgcolor: "grey.100",
                                        borderRadius: 2,
                                        mb: 2
                                    }}
                                >
                                    {/* Emoji de assessment */}
                                    <Typography
                                        sx={{
                                            fontSize: "2rem",
                                            flexShrink: 0,
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        📝
                                    </Typography>
                                    {/* Texto y lista de assessment */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Overall Situation Assessment
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                            {assessmentList.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </Box>
                                </Box>
                            )}

                            {/* Recommended Actions */}
                            {parsed && actionsList.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 2,
                                        p: 2,
                                        bgcolor: "grey.100",
                                        borderRadius: 2,
                                        mb: 2
                                    }}
                                >
                                    {/* Emoji de acción */}
                                    <Typography
                                        sx={{
                                            fontSize: "2rem",
                                            flexShrink: 0,
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        📊
                                    </Typography>
                                    {/* Texto y lista de acciones */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Recommended Actions
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                            {actionsList.map((item, index) => (
                                                <li key={index}>{item}</li>
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

export default PredictiveAnalytics;
