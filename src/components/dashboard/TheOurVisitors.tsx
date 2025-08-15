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

  // Estados
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

        if (res.status === 401) {
          sessionStorage.removeItem("token");
          alert("Sesión expirada, por favor ingresa nuevamente");
          navigate("/auth/login");
          return;
        }

        const data = await res.json();

        // console.log("Data fetched:", data);

        let counts: Record<string, number> = {
          "Very Satisfied": 0,
          "Satisfied": 0,
          "Neutral": 0,
          "Dissatisfied": 0,
          "Very Dissatisfied": 0,
        };


        data.forEach((emp: any) => {
          if (emp.calification && counts.hasOwnProperty(emp.calification)) {
            counts[emp.calification]++;
          }
        });

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

  const optionscolumnchart: any = {
    labels: [
      "Very satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied",
      "Very dissatisfied",
    ],
    chart: {
      height: 250,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: `inherit`,
    },
    colors: [
      theme.palette.success.main,
      theme.palette.primary.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
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
        }
      },
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
  };

  return (
    <DashboardCard
      title="Chart No. 2"
      subtitle="Job Satisfaction"
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
              { label: "Very Satisfied", color: theme.palette.success.main },
              { label: "Satisfied", color: theme.palette.primary.main },
              { label: "Neutral", color: theme.palette.info.main },
              { label: "Dissatisfied", color: theme.palette.warning.main},
              { label: "Very Dissatisfied", color: theme.palette.error.main },
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