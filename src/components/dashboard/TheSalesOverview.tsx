import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box, TextField, MenuItem } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";
import { useNavigate } from "react-router-dom";

const Chart = React.lazy(() => import('react-apexcharts'));

const SalesOverview = () => {
  const [loading, setLoading] = useState(true);
  const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
  const [year, setYear] = useState<number | string>(2025);
  const [categories, setCategories] = useState<string[]>([]);
  const [seriesData, setSeriesData] = useState<number[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const primary = theme.palette.primary.main;

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
        setEmployees(data.dataEmployees || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (employees.length > 0) {
      processData(year);
    }
  }, [employees, year]);

  const showAlert = (msg: string, severity: "info" | "success" | "error") => {
    setAlertQueue(prev => [...prev, { msg, severity }]);
  };

  const processData = (selectedYear: string | number) => {
    const allClients = Array.from(new Set(employees.map(emp => emp.customer || "Unknown Client")));

    const result: { [key: string]: number } = {};

    allClients.forEach(client => {
      const clientEmployees = employees.filter(emp => (emp.customer || "Unknown Client") === client);
      
      const inactiveByYear: { [year: number]: number } = {};
      const totalByYear: { [year: number]: number } = {};

      clientEmployees.forEach(emp => {
        if (emp.active_until) {
          const yearEnd = new Date(emp.active_until).getFullYear();

          if (!totalByYear[yearEnd]) totalByYear[yearEnd] = clientEmployees.length;
          if (!inactiveByYear[yearEnd]) inactiveByYear[yearEnd] = 0;

          if (emp.status === "Not Active") {
            inactiveByYear[yearEnd] += 1;
          }
        }
      });

      if (selectedYear === "all") {
        // PROMEDIO HISTÓRICO
        const percentages: number[] = [];
        Object.keys(inactiveByYear).forEach(y => {
          const yearNum = Number(y);
          const total = totalByYear[yearNum] || clientEmployees.length;
          const inactive = inactiveByYear[yearNum];
          const perc = (inactive / total) * 100;
          percentages.push(perc);
        });

        if (percentages.length > 0) {
          const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
          result[client] = parseFloat(avg.toFixed(1));
        }
      } else {
        // SOLO EL AÑO SELECCIONADO
        const inactive = inactiveByYear[Number(selectedYear)] || 0;
        const total = totalByYear[Number(selectedYear)] || clientEmployees.length;
        if (inactive > 0) {
          result[client] = parseFloat(((inactive / total) * 100).toFixed(1));
        }
      }
    });

    setCategories(Object.keys(result));
    setSeriesData(Object.values(result));
  };

  // Chart options
  const optionscolumnchart: any = {
    plotOptions: {
      bar: { horizontal: false, borderRadius: 6, columnWidth: "35%" },
    },
    grid: { show: true, strokeDashArray: 3, borderColor: "rgba(0,0,0,.1)" },
    colors: [primary],
    chart: { foreColor: "#adb0bb", fontFamily: "inherit", toolbar: { show: false } },
    xaxis: { categories, axisTicks: { show: false }, axisBorder: { show: false } },
    stroke: { show: true, width: 5, colors: ["transparent"] },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => `${val}%` } },
  };

  const seriescolumnchart = [{ name: "Attrition %", data: seriesData }];

  const years = [
    "all",
    ...Array.from(
      new Set(
        employees
          .filter(emp => emp.active_until)
          .map(emp => new Date(emp.active_until).getFullYear())
      )
    ).sort((a, b) => b - a)
  ];

  return (
    <DashboardCard
      title="Historic Attrition Risk"
      subtitle=""
      action={
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            {years.map(y => (
              <MenuItem key={y} value={y}>
                {y === "all" ? "Todos" : y}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
    >
      <Box height="295px">
        {!loading && (
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="bar"
            height={295}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default SalesOverview;
