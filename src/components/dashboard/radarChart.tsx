import React, { Suspense } from "react";
import { Box, Stack } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";

const Chart = React.lazy(() => import("react-apexcharts"));

const RadarChart = () => {
    const series = [
        {
            name: "Attrition Risk",
            data: [40, 10, 50], // Puedes cambiar los valores
        },
    ];

    const options: any = {
        chart: {
            type: "radar",
            toolbar: { show: false },
        },
        xaxis: {
            categories: ["High Risk", "Medium Risk", "Low Risk"],
        },
        markers: {
            size: 5,
            colors: ["#008FFB"],
        },
        stroke: {
            width: 2,
            colors: ["#008FFB"],
        },
        fill: {
            opacity: 0.1,
            colors: ["#008FFB"],
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
        <DashboardCard title="Chart No. 4" subtitle="Attrition Risk">
            <Stack direction="row" justifyContent="center">
                <Box width="400px">
                    <Suspense fallback={<div>Cargando gráfico...</div>}>
                        <Chart options={options} series={series} type="radar" height={300} />
                    </Suspense>
                </Box>
            </Stack>
        </DashboardCard>
    );
};

export default RadarChart;
