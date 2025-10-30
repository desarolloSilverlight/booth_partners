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
import * as XLSX from "xlsx-js-style";
import DOMPurify from "dompurify";

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
    const [employeeSalaryLevel, setEmployeeSalaryLevel] = useState<string | null>(null);

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

    const handleDownloadExcel = () => {
        const dataToExport = filteredData.map(item => ({
            "Full Name": item.fullName,
            "Customer": item.customer,
            "Perception": item.calification,
            "Analysis Result": item.clasification,
            "Attrition Probability": item.attrition_probability,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Aplica color al header (primera fila)
        const header = Object.keys(dataToExport[0]);
        header.forEach((col, idx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
            if (!worksheet[cellAddress]) return;
            worksheet[cellAddress].s = {
                fill: { fgColor: { rgb: "B8CCE4" } }, // Fondo #B8CCE4
                font: { color: { rgb: "222222" }, bold: false }, // Letra oscura normal
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "CCCCCC" } },
                    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                    left: { style: "thin", color: { rgb: "CCCCCC" } },
                    right: { style: "thin", color: { rgb: "CCCCCC" } }
                }
            };
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Predictive Analysis");

        XLSX.writeFile(workbook, "report_risk_per_customer.xlsx", { bookType: "xlsx" });
    };

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

        // Reset salary level and fetch from API using employee id (fkid_employe)
        setEmployeeSalaryLevel(null);
        try {
            const token = sessionStorage.getItem("token");
            if (!token) return handleUnauthorized();

            const myHeaders = new Headers();
            myHeaders.append("authToken", token);
            myHeaders.append("Content-Type", "application/json");

            const requestOptions: RequestInit = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify({ id: employee.id }),
                redirect: "follow",
            };

            fetch(`${config.rutaApi}employees_profile`, requestOptions)
                .then((response) => {
                    if (response.status === 401) return handleUnauthorized();
                    return response.json();
                })
                .then((result) => {
                    const dataEmp = result?.dataEmployee;
                    if (dataEmp) {
                        const sl = dataEmp.salary_level ?? dataEmp.salaryLevel ?? null;
                        setEmployeeSalaryLevel(sl);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching employee profile:", err);
                });
        } catch (e) {
            console.error(e);
        }
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
            actions: formatActions((text.match(/Recommended Actions:([\s\S]*)/i)?.[1] || "").trim()),
        };
    };

    const formatActions = (text: string) => {
        if (!text) return "";
        let out = String(text);
        const labelPattern = /(?:\*\*|__|<b>|<strong>)?\s*(Controllable by\s+(?:the\s+Client|Client|Us))\s*:?\s*(?:\*\*|__|<\/b>|<\/strong>)?/gi;

        out = out.replace(labelPattern, (_match, label) => {
            const normalized = label.trim();
            return `<b>${normalized}:</b> `;
        });

        return out.trim();
    };

    const cleanAndSplitText = (text: string) => {
        if (!text) return [];
        return text
            .split(/\n|\. /) // dividimos por salto de línea o punto+espacio
            .map(item => item.replace(/\*\*|^-|\d+$/g, "").trim()) // quitamos **, -, números sueltos
            .filter(item => item.length > 0); // eliminamos vacíos
    };

    // Extrae un bloque HTML perteneciente a una etiqueta específica (Controllable by Us / the Client)
    const extractActionsSection = (html: string, label: string) => {
        if (!html) return "";
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
            `<b>\\s*${escaped}\\s*:<\\/b>([\\s\\S]*?)(?=<b>\\s*Controllable\\s+by\\s+(?:Us|the\\s+Client)\\s*:<\\/b>|$)`,
            'i'
        );
        const match = html.match(regex);
        return match ? match[1].trim() : "";
    };

    const parsed = selectedEmployee?.text_ai ? parseTextAI(selectedEmployee.text_ai) : null;

    const driversList = parsed?.drivers ? cleanAndSplitText(parsed.drivers) : [];
    const sentimentList = parsed?.sentiment ? cleanAndSplitText(parsed.sentiment) : [];
    const assessmentList = parsed?.assessment ? cleanAndSplitText(parsed.assessment) : [];
    const actionsList = parsed?.actions ? cleanAndSplitText(parsed.actions) : [];
    const actionsUsHtml = parsed?.actions ? extractActionsSection(parsed.actions, "Controllable by Us") : "";
    const actionsClientHtml = parsed?.actions ? extractActionsSection(parsed.actions, "Controllable by the Client") : "";

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
            <BaseCard
                title={
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                        <Typography variant="h5">Predictive Attrition Analysis</Typography>
                        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                            <InputSearch
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onClearSearch={() => setSearchTerm("")}
                                placeholder="Search employee..."
                                width={{ xs: "100%", sm: 300, md: 400 }}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={handleDownloadExcel}
                            sx={{ minWidth: 140 }}
                        >
                            Download Excel
                        </Button>
                    </Box>
                }
            >
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
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => handleOpen(item)}
                                            sx={{
                                                backgroundColor: "#0D4B3B",
                                                color: "#ffffff",
                                                "&:hover": { backgroundColor: "#0a3d32" },
                                            }}
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

            {/* Modal global */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                {selectedEmployee && (
                    <>
                        <DialogTitle sx={{ bgcolor: "#0D4B3B", color: "white", borderRadius: "8px 8px 0 0" }}>
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
                                    {/* Salary level (sección separada con mayor espacio arriba) */}
                                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: "2rem", mb: 1 }}>💲</Typography>
                                        <Typography variant="body1" fontWeight="bold" align="center">
                                            {employeeSalaryLevel ?? "N/A"}
                                        </Typography>
                                    </Box>
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
                            {parsed && (actionsUsHtml || actionsClientHtml) ? (
                                <Box>
                                    {actionsUsHtml && (
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
                                            <Typography
                                                sx={{
                                                    fontSize: "2rem",
                                                    flexShrink: 0,
                                                    display: "flex",
                                                    alignItems: "center"
                                                }}
                                            >
                                                🛠️
                                            </Typography>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                                                    Controllable by Us
                                                </Typography>
                                                <Box
                                                    sx={{ whiteSpace: "pre-line" }}
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actionsUsHtml) }}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                    {actionsClientHtml && (
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
                                            <Typography
                                                sx={{
                                                    fontSize: "2rem",
                                                    flexShrink: 0,
                                                    display: "flex",
                                                    alignItems: "center"
                                                }}
                                            >
                                                🤝
                                            </Typography>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                                                    Controllable by the Client
                                                </Typography>
                                                <Box
                                                    sx={{ whiteSpace: "pre-line" }}
                                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actionsClientHtml) }}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                parsed && actionsList.length > 0 && (
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
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Recommended Actions
                                            </Typography>
                                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                                {actionsList.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}
                                                    />
                                                ))}
                                            </ul>
                                        </Box>
                                    </Box>
                                )
                            )}

                            {!parsed && <Typography>No analysis available.</Typography>}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleClose}
                                variant="contained"
                                sx={{
                                    backgroundColor: "#0D4B3B",
                                    color: "#ffffff",
                                    "&:hover": { backgroundColor: "#0a3d32" },
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

        </>
    );
};

export default ShowAttritionEmployeeCustomer;
