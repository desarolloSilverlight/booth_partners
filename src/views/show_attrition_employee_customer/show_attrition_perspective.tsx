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
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import * as XLSX from "xlsx-js-style";
import DOMPurify from "dompurify";

interface ShowPerspective {
    id: number;
    fullName: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
}

const ShowAttritionPerspective = () => {
    const [data, setData] = useState<ShowPerspective[]>([]);
    const [filteredData, setFilteredData] = useState<ShowPerspective[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<ShowPerspective | null>(null);
    const [employeeSalaryLevel, setEmployeeSalaryLevel] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const pers = queryParams.get("pers")?.toLowerCase() || "all";

    const yesterdayUpdate = dayjs()
        .subtract(1, "day")
        .set("hour", 17)
        .set("minute", 0)
        .format("MMMM DD, YYYY, hh:mm A");

    const handleOpen = (employee: ShowPerspective) => {
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

    const showAlert = (msg: string, severity: "info" | "success" | "error") => {
        setAlertQueue(prev => [...prev, { msg, severity }]);
    };

    const handleUnauthorized = () => {
        showAlert("Session expired. Please log in again.", "error");
        sessionStorage.removeItem("token");
        navigate("/auth/login");
        throw new Error("Unauthorized");
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

        showAlert("Loading data...", "info");

        fetch(`${config.rutaApi}show_metrics_analytics_attrition`, requestOptions)
            .then((response) => {
                if (response.status === 401) return handleUnauthorized();
                return response.json();
            })
            .then((result) => {
                if (!result || !Array.isArray(result)) {
                    throw new Error("Invalid response format");
                }

                const formattedData: ShowPerspective[] = result.map((item: any) => ({
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

                // 🔥 Filtramos según "pers" (positive, negative, neutral, not_comment)
                const filteredByPers = formattedData.filter(item => {
                    const cal = item.calification.toLowerCase();
                    if (pers === "positive") return cal === "positive";
                    if (pers === "negative") return cal === "negative";
                    if (pers === "neutral") return cal === "neutral";
                    if (pers === "no_comment") return item.calification === "No comments to analyze";
                    return true;
                });

                setData(filteredByPers);
                setFilteredData(filteredByPers);
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showAlert(error.message || "Error loading data", "error");
                    console.error(error);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [pers]);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(data);
        } else {
            const filtered = data.filter((d) =>
                d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, data]);

    const handleAlertClose = (_?: unknown, reason?: string) => {
        if (reason === 'clickaway') return;
        setAlertOpen(false);
    };

    const handleSearchChange = (term: string) => setSearchTerm(term);
    const handleClearSearch = () => setSearchTerm("");

    if (loading) {
        return (
            <BaseCard title="Loading...">
                <Typography>Loading attrition data...</Typography>
            </BaseCard>
        );
    }

    if (data.length === 0) {
        return (
            <BaseCard title="No data found">
                <Typography>No data available for this perception.</Typography>
            </BaseCard>
        );
    }

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
            .split(/\n|\. /)
            .map(item => item.replace(/\*\*|^-|\d+$/g, "").trim())
            .filter(item => item.length > 0)
            .map(item => item.endsWith('.') ? item : item + '.');
    };

    // Une líneas de continuación bajo la misma viñeta hasta la siguiente viñeta para "Prioritized Risk Drivers"
    const cleanAndSplitDrivers = (text: string): string[] => {
        if (!text) return [];

        const lines = text.replace(/\r\n?/g, '\n').split('\n').map(l => l.trim());
        const bullets: string[] = [];
        let current = '';

        const startsNewBullet = (s: string) => /^(•|\-|\*)\s+/.test(s) || /^(\d+\.|\([a-zA-Z]\))\s+/.test(s);

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            if (startsNewBullet(line)) {
                if (current) {
                    const normalized = current.replace(/\s+/g, ' ').trim();
                    bullets.push(/\.[\)\]]?$/.test(normalized) ? normalized : normalized + '.');
                }
                current = line.replace(/^((•|\-|\*|\d+\.|\([a-zA-Z]\))\s+)/, '');
            } else {
                if (current) {
                    const needsSpace = /[\w\)]$/.test(current);
                    current += (needsSpace ? ' ' : '') + line;
                } else {
                    current = line;
                }
            }
        }

        if (current) {
            const normalized = current.replace(/\s+/g, ' ').trim();
            bullets.push(/\.[\)\]]?$/.test(normalized) ? normalized : normalized + '.');
        }

        return bullets;
    };

    // Extrae un bloque HTML para una etiqueta específica (Controllable by Us / the Client)
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

    const driversList = parsed?.drivers ? cleanAndSplitDrivers(parsed.drivers) : [];
    const sentimentList = parsed?.sentiment ? cleanAndSplitText(parsed.sentiment) : [];
    const assessmentList = parsed?.assessment ? cleanAndSplitText(parsed.assessment) : [];
    const actionsList = parsed?.actions ? cleanAndSplitText(parsed.actions) : [];
    const actionsUsHtml = parsed?.actions ? extractActionsSection(parsed.actions, "Controllable by Us") : "";
    const actionsClientHtml = parsed?.actions ? extractActionsSection(parsed.actions, "Controllable by the Client") : "";

    // Badge de nivel salarial
    const renderSalaryBadge = (level: string | null) => {
        const raw = (level || "").toLowerCase();
        const isLow = /low|below/.test(raw);
        const isCompetitive = /compet/i.test(raw);
        const isHigh = /high|above/.test(raw);

        let bgFrom = "#ECEFF1", bgTo = "#E5E9EC", text = "#455A64", border = "#CFD8DC", label = level || "N/A", icon = "";
        if (isLow) { bgFrom = "#FDE7E9"; bgTo = "#FAD1D5"; text = "#7A0A1A"; border = "#F5B7BF"; icon = "⬇️"; }
        else if (isCompetitive) { bgFrom = "#FFF7E0"; bgTo = "#FFE8B0"; text = "#8A5B00"; border = "#FFD777"; icon = "⚖️"; }
        else if (isHigh) { bgFrom = "#E6F4EA"; bgTo = "#D1EFE0"; text = "#0D4B3B"; border = "#B7E1C9"; icon = "⬆️"; }

        return (
            <Box component="span" sx={{
                display: "inline-flex", alignItems: "center", gap: 1, px: 1.25, py: 0.5,
                borderRadius: 999, fontWeight: 800, fontSize: 13, color: text,
                border: `1px solid ${border}`,
                backgroundImage: `linear-gradient(135deg, ${bgFrom}, ${bgTo})`,
                boxShadow: `0 2px 6px rgba(0,0,0,0.06) inset, 0 1px 2px rgba(0,0,0,0.04)`
            }}>
                {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
                <span>{label}</span>
            </Box>
        );
    };

    return (
        <>
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

            <Box mb={3}>
                <BaseCard title={
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="h5" textTransform="capitalize">
                            {pers.replace("_", " ")} perception analysis
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Last update: {yesterdayUpdate} (Colombia Time)
                        </Typography>
                    </Box>
                }>
                    <InputSearch
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClearSearch={handleClearSearch}
                        placeholder={`Search in ${pers} employees...`}
                    />

                    <TableContainer sx={{ mt: 2 }}>
                        <Table aria-label="filtered table" sx={{ whiteSpace: "nowrap" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No.</TableCell>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Perception</TableCell>
                                    <TableCell>Analysis Result</TableCell>
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
            </Box>

            {/* Modal global */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                {selectedEmployee && (
                    <>
                        {/* Header estilo banner */}
                        <DialogTitle sx={{ bgcolor: "#0D4B3B", color: "white", borderRadius: "8px 8px 0 0" }}>
                            <Box sx={{ display: "flex", alignItems: { xs: "start", sm: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>ATTENTION: ATTRITION RISK INSIGHTS</Typography>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                                        {selectedEmployee.fullName}{selectedEmployee.customer ? ` - ${selectedEmployee.customer}` : ""}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={selectedEmployee.clasification}
                                    color={
                                        selectedEmployee.clasification.toLowerCase().includes("high") ? "error"
                                            : selectedEmployee.clasification.toLowerCase().includes("medium") ? "warning"
                                                : "success"
                                    }
                                    sx={{ fontWeight: 700 }}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Distribución a dos columnas */}
                            <Box sx={{ display: "flex", gap: 2, mb: 2, flexDirection: { xs: "column", md: "row" } }}>
                                {/* Izquierda: Employee Overview */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Employee Overview</Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2, boxShadow: 1, mb: 2 }}>
                                        <Typography sx={{ fontSize: "2rem" }}>🏢</Typography>
                                        <Box>
                                            <Typography variant="body1" fontWeight={800}>Company: {selectedEmployee.customer}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2, boxShadow: 1 }}>
                                        <Typography sx={{ fontSize: "2rem" }}>
                                            {selectedEmployee.calification === "Positive" ? "😀" : selectedEmployee.calification === "Negative" ? "😞" : selectedEmployee.calification === "Neutral" ? "😐" : "🤨"}
                                        </Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body1" fontWeight={800} gutterBottom>
                                                Sentiment Analysis: {selectedEmployee.calification || "No comments to analyze"}
                                            </Typography>
                                            {sentimentList.length > 0 && (
                                                <Box>
                                                    {sentimentList.map((item, index) => (
                                                        <Typography key={index} variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                                                            {item}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Derecha: Key Insights */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Key Insights</Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2, boxShadow: 1, mb: 2 }}>
                                        <Typography sx={{ fontSize: "2rem" }}>📈</Typography>
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5, flexWrap: "wrap" }}>
                                                <Typography variant="body1" fontWeight={800} sx={{ m: 0 }}>Compensation Level:</Typography>
                                                {renderSalaryBadge(employeeSalaryLevel)}
                                            </Box>
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>Based on current local market benchmark data</Typography>
                                        </Box>
                                    </Box>

                                    {parsed && driversList.length > 0 && (
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: 2, bgcolor: "grey.100", borderRadius: 2, boxShadow: 1 }}>
                                            <Typography sx={{ fontSize: "2rem" }}>
                                                {selectedEmployee.clasification.toLowerCase().includes("high") ? "❌" : selectedEmployee.clasification.toLowerCase().includes("medium") ? "⚠️" : selectedEmployee.clasification.toLowerCase().includes("low") ? "✅" : "⚪"}
                                            </Typography>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body1" fontWeight={800} gutterBottom>
                                                    Prioritized Risk Drivers
                                                </Typography>
                                                {driversList.map((item, index) => (
                                                    <Typography key={index} variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                                                        • {item}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
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

export default ShowAttritionPerspective;
