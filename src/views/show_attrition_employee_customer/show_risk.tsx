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
    Chip,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import InputSearch from "src/components/forms/inputSearch/search";
import config from "src/config/config";

interface showRisks {
    id: number;
    fullName: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
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
        .split(/\n|\. /)
        .map(item => item.replace(/\*\*|^-|\d+$/g, "").trim())
        .filter(item => item.length > 0);
};

const ShowRisks = () => {
    const [show_risks, setShow_risks] = useState<showRisks[]>([]);
    const [filteredRisks, setFilteredRisks] = useState<showRisks[]>([]);
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const params = new URLSearchParams(useLocation().search);
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<showRisks | null>(null);

    const risk = params.get("risk");

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("Token defeated, enter again");
            navigate("/auth/login");
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("authToken", token);
        myHeaders.append("Content-Type", "application/json");

        const sendBody = { risk: risk };

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(sendBody),
            redirect: "follow",
        };

        showAlert(`Show All Risks In ${risk}`, "success");

        fetch(`${config.rutaApi}show_risks`, requestOptions)
            .then((response) => {
                if (response.status === 401) return handleUnauthorized();
                return response.json();
            })
            .then((result) => {
                if (result.error) throw new Error(result.error);

                if (result.message) {
                    showAlert(result.message, "info");
                    setFilteredRisks([]);
                    setShow_risks([]);
                    return;
                }

                const data = result.dataRisks || result;
                if (!Array.isArray(data)) throw new Error("Invalid data format received from server");

                const formattedData: showRisks[] = data.map((item: any) => ({
                    id: item.id || 0,
                    fullName: item.full_name || "N/A",
                    customer: item.customer || "N/A",
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
                    clasification: item.clasification || "N/A",
                    attrition_probability: item.attrition_probability || "N/A",
                    text_ai: item.text_ai || "No additional info",
                }));

                setShow_risks(formattedData);
                setFilteredRisks(formattedData);
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
        setAlertQueue((prev) => [...prev, { msg, severity }]);
    };

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredRisks(show_risks);
        } else {
            const filtered = show_risks.filter((risk) =>
                risk.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                risk.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRisks(filtered);
        }
    }, [searchTerm, show_risks]);

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

    const handleOpen = (employee: showRisks) => {
        setSelectedEmployee(employee);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedEmployee(null);
    };

    const renderList = (items: string[]) => (
        <List dense>
            {items.map((item, i) => (
                <ListItem key={i} sx={{ py: 0 }}>
                    <ListItemText primary={`• ${item}`} />
                </ListItem>
            ))}
        </List>
    );

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
                <Snackbar open={alertOpen} autoHideDuration={2000} onClose={handleAlertClose}>
                    <Alert onClose={handleAlertClose} severity={currentAlert.severity} sx={{ width: "100%" }}>
                        {currentAlert.msg}
                    </Alert>
                </Snackbar>
            )}

            <BaseCard title={
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: { xs: 2, sm: 4 }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between" }}>
                    <Typography variant="h5">Show Risks</Typography>
                    <InputSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm("")} placeholder="Search by Name or Customer" width={250} />
                </Box>
            }>
                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table aria-label="simple table" sx={{ whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>No.</TableCell>
                                <TableCell>Full Name</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Perception</TableCell>
                                <TableCell>Analysis Result</TableCell>
                                <TableCell>Predictive Analysis</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRisks.map((risk, index) => (
                                <TableRow key={risk.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{risk.fullName}</TableCell>
                                    <TableCell>{risk.customer}</TableCell>
                                    <TableCell>{risk.calification}</TableCell>
                                    <TableCell>{risk.clasification}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => handleOpen(risk)}>
                                            Show Text
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </BaseCard>

            {/* Modal con parsing de texto */}
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
                                                ? "❌"
                                                : selectedEmployee.clasification.toLowerCase().includes("medium")
                                                    ? "⚠️"
                                                    : "✅"}
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
                                    <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>📊</Typography>
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

export default ShowRisks;
