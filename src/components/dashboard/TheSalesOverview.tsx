import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";

const Chart = React.lazy(() => import('react-apexcharts'));


const SalesOverview = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

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
    colors: [primary, secondary],
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
      categories: ["Client 1", "Client 2", "Client 3", "Client 4", "Client 5", "Client 6", "Client 7"],
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
    { name: "Employe", data: [10, 15, 5, 2, 4, 12, 1] },
    //{ name: "Pixel", data: [280, 250, 325, 215, 250, 310, 170] },
  ];


  return (
    <>

      <DashboardCard
        title="Chart No. 1"
        subtitle="Top Clients by Attrition Rate"
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
