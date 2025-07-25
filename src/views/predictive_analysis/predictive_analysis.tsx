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
    Alert
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useEffect, useState } from "react";
import config from "src/config/config";
import InputSearch from "src/components/forms/inputSearch/search";
import { useNavigate } from "react-router";

interface Predictive_Analysis {
    id: string;
    fullName: string;
    clasification: string;
    similarity_scores: string;
}

const predictive_analitics = () => {
    const [predictive_analitics, setPredictive_analitics] = useState<Predictive_Analysis[]>([]);
    const [filtereredData, setFilteredData] = useState<Predictive_Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertSeverity, setAlertSeverity] = useState<"info" | "success" | "error">("info");
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            console.error("Token not found");
            setAlertMsg("Token defeated, enter again");
            setAlertSeverity("error");
            setAlertOpen(true);
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

        setAlertMsg("Generating measurement vectors...");
        setAlertSeverity("info");
        setAlertOpen(true);

        fetch(`${config.rutaApi}creating_embedding`, requestOptions)
            .then((response) => {
                if (response.status === 401) {
                    setAlertMsg("Session expired. Please log in again.");
                    setAlertSeverity("error");
                    setAlertOpen(true);
                    sessionStorage.removeItem("token");
                    navigate("/auth/login");
                    throw new Error("Unauthorized");
                }
                return response.json();
            })
            .then((result) => {
                setAlertMsg("Analyzing attrition predictions...");
                setAlertSeverity("info");
                setAlertOpen(true);

                fetch(`${config.rutaApi}analytics_attrition`, requestOptions)
                    .then((response) => {
                        if (response.status === 401) {
                            setAlertMsg("Session expired. Please log in again.");
                            setAlertSeverity("error");
                            setAlertOpen(true);
                            sessionStorage.removeItem("token");
                            navigate("/auth/login");
                            throw new Error("Unauthorized");
                        }
                        return response.json();
                    })
                    .then((result) => {   
                        if (result.dataAnalitics) {
                            const formattedData: Predictive_Analysis[] = result.dataAnalitics.map((item: any) => ({
                                id: item.id_employee,
                                fullName: item.full_name,
                                clasification: item.stability_analysis.result,
                                similarity_scores: item.stability_analysis.similitud_con_riesgo,
                            }));
                            setPredictive_analitics(formattedData);
                            setFilteredData(formattedData);

                            setTimeout(() => {
                                setAlertMsg("¡Analysis completed successfully!");
                                setAlertSeverity("success");
                                setAlertOpen(true);
                            }, 3000);
                        }
                    })
                    .catch((error) => {
                        if (error.message !== "Unauthorized") {
                            setAlertMsg("Error al analizar datos de atrición");
                            setAlertSeverity("error");
                            setAlertOpen(true);
                            console.error("Error fetching data:", error);
                        }
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    setAlertMsg("Error generando embeddings");
                    setAlertSeverity("error");
                    setAlertOpen(true);
                    console.error('❌ Error fetching data:', error);
                }
            })
            .finally(() => {
                setLoading(true);
            });        
    }, []);

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
                <Typography>Analyzing data...</Typography>
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
                autoHideDuration={
                    alertSeverity === "success" || alertSeverity === "error"
                    ? 2000 : null
                }
                onClose={() => setAlertOpen(false)}>
                <Alert onClose={() => setAlertOpen(false)}
                     severity={alertSeverity}
                     sx={{ width: '100%' }}>
                    {alertMsg}
                </Alert>
            </Snackbar>
            <BaseCard title={
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    grap: { xs: 2, sm: 4 },
                    flexDirection: { xs: "column", sm: "row" },
                }}>
                    <Typography variant="h5" sx={{
                        width: { xs: '100%', sm: 'auto' },
                        textAlign: { xs: 'left', sm: 'inherit' }
                    }}>
                        Predictive Attrition Analysis
                    </Typography>
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
                                        Analysis result Value
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle1">
                                        Analysis result
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
                                        {dataAnalysis.similarity_scores}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" fontSize="14px">
                                            {dataAnalysis.clasification}
                                        </Typography>
                                    </TableCell>
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