import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, Avatar } from "@mui/material";
import config from "src/config/config";
const Chart = React.lazy(() => import("react-apexcharts"));
interface JobSatisfactionCustomerProps {
    dataShap: string; // customer name passed from parent
    height?: number;  // optional height if we later render a chart
    countsOverride?: { Positive: number; Negative: number; Neutral: number; NoComment: number };
}

const JobSatisfactionCustomer: React.FC<JobSatisfactionCustomerProps> = ({ dataShap, height = 250, countsOverride }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [seriesData, setSeriesData] = useState<number[]>([0, 0, 0, 0]);

    useEffect(() => {
        // If counts are provided by parent, use them directly and skip fetch
        if (countsOverride) {
            const counts = countsOverride;
            const total = counts.Positive + counts.Negative + counts.Neutral + counts.NoComment;
            const percentages = [counts.Positive, counts.Negative, counts.Neutral, counts.NoComment].map((val) =>
                total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
            );
            setSeriesData(percentages);
            setLoading(false);
            return;
        }

        const token = sessionStorage.getItem("token");
        if (!token) return;

        setLoading(true);

        const myHeaders = new Headers();
        myHeaders.append("authToken", token);
        myHeaders.append("Content-Type", "application/json");

        const sendBody = { nameCustomer: dataShap };

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(sendBody),
            redirect: "follow",
        };

        fetch(`${config.rutaApi}show_satisfaction_job`, requestOptions)
            .then((response) => response.json())
            .then((res) => {
                console.log("Result JobSatisfactionCustomer:", res);
                // Compute distribution per "Nivel" for this customer
                const counts: Record<string, number> = {
                    Positive: 0,
                    Negative: 0,
                    Neutral: 0,
                    "No comment": 0,
                };

                const arr: any[] = Array.isArray(res)
                    ? res
                    : (res?.data ?? res?.dataEmployees ?? res?.dataSatisfaction ?? res?.list ?? []);

                if (Array.isArray(arr)) {
                    arr.forEach((emp: any) => {
                        try {
                            const raw = emp?.calification ?? "";
                            if (!raw || typeof raw !== "string") {
                                counts["No comment"] += 1;
                                return;
                            }
                            // Normalize single quotes to valid JSON
                            const fixed = raw.replace(/'/g, '"');
                            const obj = JSON.parse(fixed);
                            let nivel: string = obj?.Nivel ?? "";
                            // Map Spanish labels to English + unify "No comment"
                            if (nivel === "Positivo") nivel = "Positive";
                            if (nivel === "Negativo") nivel = "Negative";
                            if (nivel === "Neutro") nivel = "Neutral";
                            if (/no\s*comment/i.test(nivel) || /no\s*comments\s*to\s*analyze/i.test(nivel)) {
                                nivel = "No comment";
                            }
                            if (!counts.hasOwnProperty(nivel)) nivel = "No comment";
                            counts[nivel] += 1;
                        } catch {
                            counts["No comment"] += 1;
                        }
                    });
                }

                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                const percentages = Object.values(counts).map((val) =>
                    total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
                );
                setSeriesData(percentages);
            })
            .catch((error) => console.error("Error fetching job satisfaction:", error))
            .finally(() => setLoading(false));
    }, [dataShap, countsOverride]);

    const labels = useMemo(() => ["Positive", "Negative", "Neutral", "No comment"], []);

    const options: any = useMemo(() => ({
        labels,
        chart: {
            height,
            type: "donut",
            foreColor: "#adb0bb",
            fontFamily: "inherit",
        },
        // Lus palette mapping
        colors: [
            '#589992', // Positive - Lake Green
            '#C9ADCD', // Negative - Mauve
            '#8581B5', // Neutral  - Violet
            '#255C82', // No comment - Blue
        ],
        dataLabels: { enabled: false },
        legend: { show: false },
        stroke: { colors: ["transparent"] },
        plotOptions: {
            pie: {
                donut: {
                    size: "83",
                    background: "transparent",
                    labels: {
                        show: true,
                        name: { show: true, offsetY: 7 },
                        value: { show: false },
                        total: {
                            show: true,
                            color: "#a1aab2",
                            fontSize: "13px",
                            label: "Percentage %",
                        },
                    },
                },
            },
        },
        tooltip: {
            y: {
                formatter: function (val: number) {
                    return val.toFixed(1) + "%";
                },
            },
            theme: "light",
            fillSeriesColor: false,
        },
    }), [height, labels]);

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box height={`${height - 30}px`} width="100%">
                <Suspense fallback={<div>Cargando gráfico...</div>}>
                    {!loading && (
                        <Chart options={options} series={seriesData} type="donut" height={height} width="100%" />
                    )}
                </Suspense>
            </Box>
            <Stack spacing={2} p={2} direction="row" justifyContent="center" flexWrap="wrap" sx={{ mt: 3 }}>
                {[{ label: "Positive", color: '#589992' }, { label: "Negative", color: '#C9ADCD' }, { label: "Neutral", color: '#8581B5' }, { label: "No comment", color: '#255C82' }].map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ m: 0.5 }}>
                        <Avatar sx={{ width: 9, height: 9, bgcolor: item.color, svg: { display: 'none' } }} />
                        <Typography variant="subtitle2" sx={{ color: item.color }}>{item.label}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default JobSatisfactionCustomer;