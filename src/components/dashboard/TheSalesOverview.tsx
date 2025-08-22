import React, { use, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";
import { useNavigate } from "react-router-dom";

const Chart = React.lazy(() => import('react-apexcharts'));


const SalesOverview = () => {
  const [loading, setLoading] = useState(true);
  const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
  const navigate = useNavigate();
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  // const secondary = theme.palette.secondary.main;

  const [categories, setCategories] = useState<string[]>([]);
  const [seriesData, setSeriesData] = useState<number[]>([]);

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

        const res = await fetch(`${config.rutaApi}employee_system_list`, requestOptions);

        if (res.status === 401) {
          sessionStorage.removeItem("token");
          alert("Sesión expirada, por favor ingresa nuevamente");
          navigate("/auth/login");
          return;
        }

        const data = await res.json();

        const notActive = data.dataEmployees.filter((row: any) => row.status === "Not Active");

        const grouped = notActive.reduce((acc: any, row: any) => {
          const client = row.customer || "Unknown Client";
          acc[client] = (acc[client] || 0) + 1;
          return acc;
        }, {});

        const clients = Object.keys(grouped);
        const counts = Object.values(grouped) as number[];

        setCategories(clients);
        setSeriesData(counts);

        // console.log("Categories:", clients);
        // console.log("Series Data:", counts);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const showAlert = (msg: string, severity: "info" | "success" | "error") => {
    setAlertQueue(prev => [...prev, { msg, severity }]);
  };


  // chart
  const optionscolumnchart: any = {
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "35%",
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: "rgba(0,0,0,.1)",
    },
    colors: [primary],
    chart: {
      width: 70,
      height: 40,
      foreColor: "#adb0bb",
      fontFamily: "inherit",
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    stroke: {
      show: true,
      width: 5,
      colors: ["transparent"],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
    },
  };
  const seriescolumnchart = [
    { name: "Employe", data: seriesData },
    //{ name: "Pixel", data: [280, 250, 325, 215, 250, 310, 170] },
  ];


  return (
    <>

      <DashboardCard
        title="Chart No. 1"
        subtitle="Historic Attrition Risk"
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
                Attritions
              </Typography>
            </Stack>
            {/*
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 9,
                  height: 9,
                  bgcolor: secondary,
                  svg: { display: "none" },
                }}
              ></Avatar>
              <Typography variant="subtitle2" color="secondary.main">
                Empleado
              </Typography>
            </Stack>
            */}
          </Stack>
        }
      >
        <Box height="295px" >
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="bar"
            height={295}
            width={"100%"}
          />
        </Box>
      </DashboardCard>

    </>
  );
};

export default SalesOverview;
