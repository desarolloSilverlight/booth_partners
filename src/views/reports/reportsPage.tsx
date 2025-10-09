import {
    Typography,
    Box,
    TableContainer,
    Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import BaseCard from "src/components/BaseCard/BaseCard";
import config from "src/config/config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx-js-style";

interface reportsPage {
    id: number;
    full_name: string;
    customer: string;
    calification: string;
    clasification: string;
    attrition_probability: string;
    text_ai: string;
}

const buttonData = [
    {
        label: "Employee\nPerspective Report",
        columns: ["full_name", "calification", "text_ai"],
        fileName: "Report_Attrition_Perspective.xlsx",
    },
    {
        label: "Attrition Risk\nReport per Client",
        columns: ["full_name", "clasification", "customer", "text_ai"],
        fileName: "Report_Attrition_Risk_per_Client.xlsx",
    },
    {
        label: "Risk Count\nReport per Client",
        columns: [],
        fileName: "Risk_Count_Report_per_Client.xlsx",
        isCountReport: true,
    },
    {
        label: "Risk\nby Percentage Report",
        columns: [],
        fileName: "Risk_by_Percentage_Report.xlsx",
        isPercentageReport: true,
    },
];

const ReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
    const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);
    const [data, setData] = useState<reportsPage[]>([]);

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
                setData(result);
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
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

    const handleUnauthorized = () => {
        showAlert("Session expired. Please log in again.", "error");
        sessionStorage.removeItem("token");
        navigate("/auth/login");
        throw new Error("Unauthorized");
    };

    const handleDownload = (columns: string[], fileName: string, isCountReport?: boolean, isPercentageReport?: boolean) => {
        if (!data || data.length === 0) {
            showAlert("No hay datos para descargar", "error");
            return;
        }

        if (isCountReport) {
            // Agrupar por customer y contar clasification
            const counts: Record<string, { Low: number; Medium: number; High: number }> = {};
            data.forEach(item => {
                const customer = item.customer || "Sin Cliente";
                const clas = (item.clasification || "").toLowerCase();
                if (!counts[customer]) counts[customer] = { Low: 0, Medium: 0, High: 0 };
                if (clas.includes("low")) counts[customer].Low += 1;
                else if (clas.includes("medium")) counts[customer].Medium += 1;
                else if (clas.includes("high")) counts[customer].High += 1;
            });
            const filteredData = Object.entries(counts).map(([customer, val]) => ({
                customer,
                Low: val.Low,
                Medium: val.Medium,
                High: val.High,
            }));

            const worksheet = XLSX.utils.json_to_sheet(filteredData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, fileName);

            showAlert("Descarga exitosa", "success");
            return;
        }

        if (isPercentageReport) {
            // Calcular porcentajes globales de Low, Medium y High
            let low = 0, medium = 0, high = 0, total = 0;
            data.forEach(item => {
                const clas = (item.clasification || "").toLowerCase();
                if (clas.includes("low")) low += 1;
                else if (clas.includes("medium")) medium += 1;
                else if (clas.includes("high")) high += 1;
                total += 1;
            });
            const percent = (val: number) => total > 0 ? ((val / total) * 100).toFixed(2) + '%' : '0%';
            const filteredData = [{
                Low: percent(low),
                Medium: percent(medium),
                High: percent(high),
            }];

            const worksheet = XLSX.utils.json_to_sheet(filteredData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, fileName);

            showAlert("Descarga exitosa", "success");
            return;
        }

        const filteredData = data.map(item => {
            const obj: any = {};
            columns.forEach(col => {
                if (col === "calification") {
                    try {
                        const calif = String(item.calification);
                        const nivelMatch = calif.match(/'Nivel':\s*'([^']+)'/);
                        obj[col] = nivelMatch ? nivelMatch[1] : "";
                    } catch {
                        obj[col] = "";
                    }
                } else if (col === "clasification") {
                    obj[col] = item.clasification;
                } else if (col === "full_name") {
                    obj[col] = item.full_name;
                } else {
                    obj[col] = item[col as keyof typeof item];
                }
            });
            return obj;
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, fileName);

        showAlert("Descarga exitosa", "success");
    };

    return (
        <BaseCard title="Reports Page">
            <Box display="flex" gap={2} mb={4}>
                {buttonData.map((btn, idx) => (
                    <Button
                        key={idx}
                        variant="contained"
                        onClick={() => handleDownload(btn.columns, btn.fileName, btn.isCountReport, btn.isPercentageReport)}
                        sx={{
                            backgroundColor: "#0D4B3B",
                            color: "#fff",
                            borderRadius: 3,
                            minWidth: 180,
                            minHeight: 80,
                            fontSize: 18,
                            fontWeight: 500,
                            textTransform: "none",
                            boxShadow: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            "&:hover": {
                                backgroundColor: "#0B3F32",
                            },
                        }}
                    >
                        <DownloadIcon sx={{ fontSize: 36, mb: 1 }} />
                        <Typography
                            sx={{
                                fontSize: 16,
                                fontWeight: 500,
                                whiteSpace: "pre-line",
                                textAlign: "center",
                            }}
                        >
                            {btn.label}
                        </Typography>
                    </Button>
                ))}
            </Box>
        </BaseCard>
    );
};

export default ReportsPage;