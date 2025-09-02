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
import { use, useEffect, useState } from "react";
import InputSearch from "src/components/forms/inputSearch/search";
import config from "src/config/config";
import { set } from "lodash";

interface showRisks {
    id: number;
    fullName: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
}

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
    const [selectedText, setSelectedText] = useState("");

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

        const sendBody = {
            risk: risk
        };

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
                if (result.error) {
                    throw new Error(result.error);
                }

                if (result.message) {
                    showAlert(result.message, "info");
                    setFilteredRisks([]);
                    setShow_risks([]);
                    return;
                }

                const data = result.dataRisks || result;

                if (!Array.isArray(data)) {
                    throw new Error("Invalid data format received from server");
                }

                const formattedData: showRisks[] = data.map((item: any) => {
                    return {
                        id: item.id || 0,
                        fullName: item.full_name || "N/A",
                        customer: item.customer || "N/A",
                        calification: item.calification || "N/A",
                        clasification: item.clasification || "N/A",
                        attrition_probability: item.attrition_probability || "N/A",
                        text_ai: item.text_ai || "No additional info",
                    };
                });

                // console.log("Formatted Data:", formattedData);

                setShow_risks(formattedData);
                setFilteredRisks(formattedData);
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showAlert(error.message || "Error in process", "error");
                    console.error(error);
                }
            })
            .finally(() => { setLoading(false); })
    }, []);

    const showAlert = (msg: string, severity: "info" | "success" | "error") => {
        setAlertQueue((prev) => [...prev, { msg, severity }]);
    };

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredRisks(show_risks);
        } else {
            const filteredRisks = show_risks.filter((risk) =>
                risk.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                risk.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRisks(filteredRisks);
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

    if (show_risks.length === 0) {
        return (
            <BaseCard title="No data found">
                <Typography>No data available for show.</Typography>
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
                            Show Risks
                        </Typography>
                    </Box>

                    <InputSearch
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClearSearch={handleClearSearch}
                        placeholder="Search by Name or Customer"
                        width={250}
                    />
                </Box>
            }>
                <TableContainer
                    sx={{
                        width: '100%',
                        overflowX: 'auto',
                    }}
                >
                    <Table aria-label="simple table" sx={{ whiteSpace: 'nowrap' }}>
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
                            {filteredRisks.map((risk, index) => (
                                <TableRow key={risk.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{risk.fullName}</TableCell>
                                    <TableCell>{risk.customer}</TableCell>
                                    <TableCell>{risk.calification}</TableCell>
                                    <TableCell>{risk.clasification}</TableCell>
                                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                            onClick={() => handleOpen(risk.text_ai)}
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

export default ShowRisks;