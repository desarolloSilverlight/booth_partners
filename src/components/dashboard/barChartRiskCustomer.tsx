import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";
import { useNavigate } from "react-router-dom";

const Chart = React.lazy(() => import("react-apexcharts"));

const BarChartRiskCustomer = () => {
    const [loading, setLoading] = useState(true);
    const [alertQueue, setAlertQueue] = useState<
        { msg: string; severity: "info" | "success" | "error" }[]
    >([]);
    const navigate = useNavigate();
    const theme = useTheme();
    const primary = theme.palette.primary.main;

    const [categories, setCategories] = useState<string[]>([]);
    const [seriesData, setSeriesData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
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

                const res = await fetch(
                    `${config.rutaApi}show_metrics_analytics_attrition`,
                    requestOptions
                );

                const data = await res.json();

                // Agrupar empleados por cliente y clasificación
                const grouped: Record<
                    string,
                    { Low: number; Mid: number; High: number }
                > = {};

                data.forEach((emp: any) => {
                    const client = emp.customer || "Unknown Client";
                    const risk = emp.clasification;

                    if (!grouped[client]) {
                        grouped[client] = { Low: 0, Mid: 0, High: 0 };
                    }

                    if (risk.includes("Low")) grouped[client].Low += 1;
                    else if (risk.includes("Medium")) grouped[client].Mid += 1;
                    else if (risk.includes("High")) grouped[client].High += 1;
                });

                // Categorías (clientes)
                const clients = Object.keys(grouped);

                // Series separadas por tipo de riesgo
                const lowData = clients.map((c) => grouped[c].Low);
                const midData = clients.map((c) => grouped[c].Mid);
                const highData = clients.map((c) => grouped[c].High);

                setCategories(clients);
                setSeriesData([
                    { name: "Low Risk", data: lowData },
                    { name: "Medium Risk", data: midData },
                    { name: "High Risk", data: highData },
                ]);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const showMetricsCustomer = (cliente: string, riesgo: string) => {
        navigate(`/show_attrition_employee_customer/show_attrition_employee_customer?cliente=${encodeURIComponent(cliente)}&riesgo=${encodeURIComponent(riesgo)}`);
    };

    const showAlert = (
        msg: string,
        severity: "info" | "success" | "error"
    ) => {
        setAlertQueue((prev) => [...prev, { msg, severity }]);
    };

    // chart
    const optionscolumnchart: any = {
        chart: {
            type: "bar",
            stacked: true,
            foreColor: "#adb0bb",
            fontFamily: "inherit",
            toolbar: { show: false },
            events: {
                dataPointSelection: function (event: any, chartContext: any, config: any) {
                    const cliente = categories[config.dataPointIndex];
                    const riesgo = seriesData[config.seriesIndex].name;
                    showMetricsCustomer(cliente, riesgo);
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: "60%",
            },
        },
        xaxis: {
            categories: categories, // Clientes
        },
        legend: {
            position: "top",
        },
        fill: {
            opacity: 1,
        },
        colors: [
            theme.palette.success.main, // Low Risk → Verde
            theme.palette.warning.main, // Mid Risk → Amarillo/Naranja
            theme.palette.error.main, // High Risk → Rojo
        ],
        tooltip: {
            y: {
                formatter: (val: number) => `${val} empleados`,
            },
        },
    };

    return (
        <>
            <DashboardCard
                title="Chart No. 4"
                subtitle="Risk of employee attrition per client"
                action={
                    <Stack spacing={3} mt={5} direction="row">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                                sx={{
                                    width: 9,
                                    height: 9,
                                    bgcolor: primary,
                                    svg: { display: "none" },
                                }}
                            ></Avatar>
                            <Typography variant="subtitle2" color="primary.main">
                                Risk Attritions
                            </Typography>
                        </Stack>
                    </Stack>
                }
            >
                <Box height="400px">
                    <Chart
                        options={optionscolumnchart}
                        series={seriesData}
                        type="bar"
                        height={400}
                        width={"100%"}
                    />
                </Box>
            </DashboardCard>
        </>
    );
};

export default BarChartRiskCustomer;
