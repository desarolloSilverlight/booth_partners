import React, { Suspense } from 'react';
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box, Divider } from "@mui/material";
import DashboardCard from '../shared/DashboardCard';

const Chart = React.lazy(() => import('react-apexcharts'));

const OurVisitors = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const info = theme.palette.info.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;

  const optionscolumnchart: any = {
    labels: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
    chart: {
      height: 250,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: `inherit`,
    },
    colors: [primary, secondary, info, warning, error],
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
            name: {
              show: true,
              offsetY: 7,
            },
            value: { show: false },
            total: {
              show: true,
              color: "#a1aab2",
              fontSize: "13px",
              label: "Porcentaje %",
            },
          },
        },
      },
    },
    responsive: [{ breakpoint: 480, options: { chart: { height: 230 } } }],
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
  };

  const seriescolumnchart = [30, 25, 20, 15, 10]; // 5 valores

  return (
    <DashboardCard
      title="Chart No. 2"
      subtitle="Job Satisfaction"
      footer={
        <>
          <Divider />
          <Stack spacing={2} p={3} direction="row" justifyContent="center" flexWrap="wrap">
            {[
              { label: "Very Satisfied", color: primary },
              { label: "Satisfied", color: secondary },
              { label: "Neutral", color: info },
              { label: "Dissatisfied", color: warning },
              { label: "Very Dissatisfied", color: error },
            ].map((item, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ m: 0.5 }}>
                <Avatar
                  sx={{
                    width: 9,
                    height: 9,
                    bgcolor: item.color,
                    svg: { display: "none" },
                  }}
                />
                <Typography variant="subtitle2" sx={{ color: item.color }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </>
      }
    >
      <Box height="220px">
        <Suspense fallback={<div>Cargando gráfico...</div>}>
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="donut"
            height={250}
            width="100%"
          />
        </Suspense>
      </Box>
    </DashboardCard>
  );
};

export default OurVisitors;
