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
    Stack,
    Snackbar,
    Alert,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useEffect, useState } from "react";
import config from "src/config/config";
import InputSearch from "src/components/forms/inputSearch/search";
import { useNavigate } from "react-router";
import React from "react";
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

const predictive_analitics = () => {
    const [predictive_analitics, setPredictive_analitics] = useState<Predictive_Analysis[]>([]);
    const [filtereredData, setFilteredData] = useState<Predictive_Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const navigate = useNavigate();

    const [open, setOpen] = React.useState(false);
    const [selectedText, setSelectedText] = React.useState("");

    const yesterdayUpdate = dayjs()
        .subtract(1, "day")
        .set("hour", 23)
        .set("minute", 59)
        .format("MMMM DD, YYYY, hh:mm A");

    const handleOpen = (texto: string) => {
        setSelectedText(texto); // Guardar el texto de la fila clicada
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedText(""); // Limpiar al cerrar
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

                // console.log("Data fetched:", result);

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

        // fetch(`${config.rutaApi}creating_embedding`, requestOptions)
        //     .then((response) => {
        //         if (response.status === 401) return handleUnauthorized();
        //         return response.json();
        //     })
        //     .then((result) => {
        //         const taskId = result?.task_id;
        //         if (!taskId) throw new Error("Task ID not found");

        //         return waitForTask(`${config.rutaApi}estado_tarea/${taskId}`, requestOptions);
        //     })
        //     .then(() => {
        //         // 🔹 Paso 2: Analizar datos
        //         showAlert("Analyzing attrition predictions...", "info");

        //         return fetch(`${config.rutaApi}analytics_attrition`, requestOptions)
        //             .then((response) => {
        //                 if (response.status === 401) return handleUnauthorized();
        //                 return response.json();
        //             });
        //     })
        //     .then((result) => {
        //         const jobId = result?.job_id;
        //         if (!jobId) throw new Error("Job ID not found");

        //         return waitForTask(`${config.rutaApi}analytics_attrition_status/${jobId}`, requestOptions);
        //     })
        //     .then((finalData) => {
        //         const predictions = finalData.result?.predictions || [];
        //         const metrics = finalData.result?.metrics || {};

        //         const formattedData: Predictive_Analysis[] = predictions.map((item: any) => ({
        //             auc: metrics.auc ?? "",
        //             id: item.employee_id,
        //             fullName: item.full_name,
        //             attrition_probability: item.attrition_probability,
        //             clasification: item.classification,
        //             felicidad: item.semantic_score.felicidad,
        //             frustracion: item.semantic_score.frustración,
        //             tristeza: item.semantic_score.tristeza,
        //             estres: item.semantic_score.estrés,
        //             texto_predictivo: item.texto_predictivo,
        //         }));

        //         setPredictive_analitics(formattedData);
        //         setFilteredData(formattedData);

        //         // 🔹 Paso 3: Finalizado
        //         showAlert("¡Analysis completed successfully!", "success");
        //     })
        //     .catch((error) => {
        //         if (error.message !== "Unauthorized") {
        //             showAlert(error.message || "Error in process", "error");
        //             console.error(error);
        //         }
        //     })
        //     .finally(() => {
        //         // 🔹 loading se apaga al final
        //         setLoading(false);
        //     });

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

    // 🔹 Polling hasta que la tarea termine
    // const waitForTask = (url: string, options: RequestInit) => {
    //     return new Promise<any>((resolve, reject) => {
    //         const intervalId = setInterval(() => {
    //             fetch(url, options)
    //                 .then((res) => {
    //                     if (res.status === 401) return handleUnauthorized();
    //                     return res.json();
    //                 })
    //                 .then((statusResult) => {
    //                     console.log("Task status:", statusResult);
    //                     if (statusResult.State === "Success" || statusResult.status === "completed") {
    //                         clearInterval(intervalId);
    //                         resolve(statusResult);
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     clearInterval(intervalId);
    //                     reject(err);
    //                 });
    //         }, 5000);
    //     });
    // };

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(predictive_analitics);
        } else {
            const filteredData = predictive_analitics.filter((dataAnalysis) =>
                dataAnalysis.fullName.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (!loading && filtereredData.length === 0) {
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
                    {/* Bloque Título + Fecha */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="h5">
                            Predictive Attrition Analysis
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ fontStyle: "italic" }}
                        >
                            Last update: {yesterdayUpdate} (Colombia Time)
                        </Typography>
                    </Box>

                    {/* InputSearch a la derecha */}
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
                                        Customer
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle1">
                                        satisfaction
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle1">
                                        Analysis result
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle1">
                                        predictive analysis
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtereredData.map((dataAnalysis, index) => (
                                <TableRow key={dataAnalysis.id}>
                                    <TableCell>
                                        <Typography fontSize="15px" fontWeight={500}>
                                            {index + 1}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" fontSize="14px">
                                            {dataAnalysis.fullName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" fontSize="14px">
                                            {dataAnalysis.customer}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" fontSize="14px">
                                            {dataAnalysis.calification}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" fontSize="14px">
                                            {dataAnalysis.clasification}
                                        </Typography>
                                    </TableCell>
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

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </BaseCard>
        </>
    );
};

export default predictive_analitics;