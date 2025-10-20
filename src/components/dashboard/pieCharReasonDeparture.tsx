import React, { Suspense } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";


const Chart = React.lazy(() => import("react-apexcharts"));

interface PieCharReasonDepartureProps {
  dataShap: string;
}

const PieChartReasonDeparture = () => {
    const theme = useTheme();

    const series = [15, 30, 45, 25];
    const labels = ["Reason 1", "Reason 2", "Reason 3", "Reason 4"];
    const colors = ["#3608dfff", "#920a80ff", "#00fbfbff", "#dd4719ff"];

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
        <DashboardCard title="Attrition Reason" subtitle="">
            <Box height="300px">
                <Suspense fallback={<div>Cargando gráfico...</div>}>
                    <Chart options={options} series={series} type="pie" height={300} />
                </Suspense>
            </Box>
        </DashboardCard>
    );
};

export default PieChartReasonDeparture;