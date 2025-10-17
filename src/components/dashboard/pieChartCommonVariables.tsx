import React, { Suspense } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";

const Chart = React.lazy(() => import("react-apexcharts"));

const PieChartCommonVariables = () => {
    const theme = useTheme();

    const series = [35, 30, 20, 15];
    const labels = ["Variable SHAP 1", "Variable SHAP 2", "Variable SHAP 3", "Variable SHAP 4"];
    const colors = ["#00E396", "#FEB019", "#008FFB", "#FF4560"];

    const options: any = {
        chart: {
            type: "pie",
            height: 300,
            toolbar: { show: false },
        },
        labels: labels,
        colors: colors,
        legend: {
            show: true,
            position: "right", // Muestra la leyenda al lado derecho de la gráfica
            markers: {
                width: 12,
                height: 12,
                radius: 12,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5,
            },
        },
        dataLabels: {
            enabled: false, // Ocultamos los valores encima
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val}%`,
            },
        },
        stroke: {
            show: false,
        },
    };

    return (
        <DashboardCard title="Reason Atrittion Shap" subtitle="">
            <Box height="300px">
                <Suspense fallback={<div>Cargando gráfico...</div>}>
                    <Chart options={options} series={series} type="pie" height={300} />
                </Suspense>
            </Box>
        </DashboardCard>
    );
};

export default PieChartCommonVariables;