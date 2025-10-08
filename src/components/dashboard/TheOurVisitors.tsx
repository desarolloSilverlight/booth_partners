import React, { Suspense, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box, Divider } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";
import { useNavigate } from "react-router-dom";

const Chart = React.lazy(() => import("react-apexcharts"));

const OurVisitors = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const info = theme.palette.info.main;
  const warning = theme.palette.warning.main;

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

        // Inicializamos los contadores
        let counts: Record<string, number> = {
          Positive: 0,
          Negative: 0,
          Neutral: 0,
          "No comment": 0,
        };

        // Procesar cada empleado
        data.forEach((emp: any) => {
          if (emp.calification) {
            try {
              // Arreglar el JSON (por si usa comillas simples)
              const fixedJson = emp.calification
                .replace(/'/g, '"')
                .replace(/([a-zA-Záéíóúñ]+):/g, '"$1":');

              const scores = JSON.parse(fixedJson);

              let nivel = scores["Nivel"];
              if (nivel === "Positivo") nivel = "Positive";
              if (nivel === "Negativo") nivel = "Negative";
              if (nivel === "Neutro") nivel = "Neutral";

              if (nivel && counts.hasOwnProperty(nivel)) {
                counts[nivel] += 1;
              } else {
                counts["No comment"] += 1;
              }
            } catch (err) {
              counts["No comment"] += 1; // JSON mal formado
            }
          } else {
            counts["No comment"] += 1; // Sin calificación
          }
        });

        // Calcular porcentajes
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const percentages = Object.values(counts).map((val) =>
          total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
        );

        setSeriesData(percentages);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const labels = ["Positive", "Negative", "Neutral", "No comment"];

  // Opciones del gráfico
  const optionscolumnchart: any = {
    labels: labels,
    chart: {
      height: 250,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "inherit",
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const selectedLabel = labels[config.dataPointIndex];
          if (selectedLabel) {
            const param = selectedLabel.toLowerCase().replace(" ", "_");
            navigate(
              `/show_attrition_employee_customer/show_attrition_perspective?pers=${param}`
            );
          }
        },
      },
    },
    colors: [
      theme.palette.success.main,  // Verde
      theme.palette.error.main,    // Rojo
      theme.palette.info.main,     // Azul
      theme.palette.grey[700],     // Gris para No comment
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
    responsive: [{ breakpoint: 480, options: { chart: { height: 230 } } }],
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toFixed(1) + "%";
        },
      },
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
  };

  return (
    <DashboardCard
      title="Job Satisfaction"
      subtitle=""
      footer={
        <>
          <Divider />
          <Stack
            spacing={2}
            p={3}
            direction="row"
            justifyContent="center"
            flexWrap="wrap"
          >
            {[
              { label: "Positive", color: theme.palette.success.main },
              { label: "Negative", color: theme.palette.error.main },
              { label: "Neutral", color: theme.palette.info.main },
              { label: "No comment", color: theme.palette.grey[700] },
            ].map((item, index) => (
              <Stack
                key={index}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ m: 0.5 }}
              >
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
          {!loading && seriesData.length > 0 && (
            <Chart
              options={optionscolumnchart}
              series={seriesData}
              type="donut"
              height={250}
              width="100%"
            />
          )}
        </Suspense>
      </Box>
    </DashboardCard>
  );
};

export default OurVisitors;
