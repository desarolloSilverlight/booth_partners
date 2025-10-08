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
                                                variant="outlined"
                                                onClick={() => handleOpen(item)}
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

            {/* Modal con detalles del análisis */}
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
                            <Typography variant="body1">
                                {selectedEmployee.text_ai || "No analysis available."}
                            </Typography>
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

export default ShowAttritionPerspective;
