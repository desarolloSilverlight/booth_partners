import React, { Suspense, useEffect, useState } from "react";
import { Box, Stack } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";
import { useNavigate } from "react-router-dom";

const Chart = React.lazy(() => import("react-apexcharts"));

const RadarChart = () => {
    const navigate = useNavigate();
    const [seriesData, setSeriesData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) {
                    alert("Token defeated, enter again");
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

                let countHigh = 0;
                let countMedium = 0;
                let countLow = 0;

                data.forEach((emp: any) => {
                    if (emp.clasification) {
                        const clasification = emp.clasification.toLowerCase();
                        if (clasification.includes("high")) countHigh++;
                        else if (clasification.includes("medium")) countMedium++;
                        else if (clasification.includes("low")) countLow++;
                    }
                });

                const total = countHigh + countMedium + countLow;
                const percentages = [
                    parseFloat(((countHigh / total) * 100).toFixed(1)),
                    parseFloat(((countMedium / total) * 100).toFixed(1)),
                    parseFloat(((countLow / total) * 100).toFixed(1)),
                ];

                setSeriesData(percentages);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const showRisk = (riesgo: string) => {
        navigate(`/show_attrition_employee_customer/show_risk?risk=${encodeURIComponent(riesgo)}`);
    };

    const options: any = {
        chart: {
            type: "radar",
            toolbar: { show: false },
            events: {
                markerClick: (event: any, chartContext: any, config: any) => {
                    const riskCategories = ["High", "Medium", "Low"];
                    const clickedRisk = riskCategories[config.dataPointIndex];
                    if (clickedRisk) {
                        showRisk(clickedRisk);
                    }
                },
            },
        },
        xaxis: {
            categories: ["High Risk", "Medium Risk", "Low Risk"],
        },
        markers: {
            size: 5,
            colors: ["#FF4560"],
        },
        stroke: {
            width: 2,
            colors: ["#FF4560"],
        },
        fill: {
            opacity: 0.1,
            colors: ["#FF4560"],
        },
        yaxis: {
            show: false,
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val}%`,
            },
        },
    };

    return (
        <DashboardCard title="Attrition Risk" subtitle="">
            <Stack direction="row" justifyContent="center">
                <Box width="400px">
                    <Suspense fallback={<div>Cargando gráfico...</div>}>
                        {!loading && seriesData.length > 0 && (
                            <Chart
                                options={options}
                                series={[{ name: "Attrition Risk", data: seriesData }]}
                                type="radar"
                                height={300}
                            />
                        )}
                    </Suspense>
                </Box>
            </Stack>
        </DashboardCard>
    );
};

export default RadarChart;
