import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";

const SalesOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  // 🔹 Cargar empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setLoading(false);
          navigate("/auth/login");
          return;
        }

        const myHeaders = new Headers();
        myHeaders.append("authToken", token);

        const res = await fetch(`${config.rutaApi}employee_system_list`, {
          method: "GET",
          headers: myHeaders,
        });

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
      processData();
    }
  }, [employees]);

  const parseDateFromFields = (emp: any, candidates: string[]) => {
    for (const key of candidates) {
      const v = emp[key];
      if (!v) continue;
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Helper: si el año es el actual usamos hoy, sino usamos 31-dic del año (final del año)
  const getEndOfPeriodForYear = (year: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    if (year === currentYear) {
      // usar la fecha de hoy (porque el año no ha terminado)
      return today;
    }
    // último instante del 31 dic del año solicitado
    return new Date(year, 11, 31, 23, 59, 59, 999);
  };

  const processData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const prevYear = currentYear - 1;

    const allCustomers = Array.from(new Set(employees.map((e) => e.customer || "Unknown Client"))).sort();

    const seriesPrev: number[] = [];
    const seriesCurr: number[] = [];

    const startFields = ["start_date", "hire_date", "created_at", "active_since", "fecha_ingreso"];
    const endFields = ["active_until", "end_date", "terminacion_date", "fecha_salida"];

    const getEmployeeKey = (emp: any, idx: number) => {
      return emp?.id ?? emp?.employee_id ?? emp?.document_number ?? `${emp?.email ?? ""}__${idx}`;
    };

    // cuenta empleados activos en una fecha D (únicos por key)
    const countActiveAtDate = (clientEmps: any[], D: Date) => {
      const seen = new Set<string>();
      let count = 0;
      clientEmps.forEach((emp, idx) => {
        const key = getEmployeeKey(emp, idx);
        if (seen.has(key)) return;
        const start = parseDateFromFields(emp, startFields);
        const end = parseDateFromFields(emp, endFields);

        const startedBeforeOrOn = !start || start.getTime() <= D.getTime();
        const endedBeforeOrOn = end && end.getTime() <= D.getTime(); // si end <= D entonces ya no está activo en D

        if (startedBeforeOrOn && !endedBeforeOrOn) {
          count++;
          seen.add(key);
        }
      });
      return count;
    };

    // número de personas que terminaron (tienen endDate) dentro del año (únicos por key)
    const countLeaversInYear = (clientEmps: any[], year: number) => {
      const leaverKeys = new Set<string>();
      clientEmps.forEach((emp, idx) => {
        const key = getEmployeeKey(emp, idx);
        const end = parseDateFromFields(emp, endFields);
        if (!end) return;
        if (end.getFullYear() === year) {
          leaverKeys.add(key);
        }
      });
      return leaverKeys.size;
    };

    for (const customer of allCustomers) {
      const clientEmployees = employees.filter((e) => (e.customer || "Unknown Client") === customer);

      // empleados al 1 de enero
      const empJan1Prev = countActiveAtDate(clientEmployees, new Date(prevYear, 0, 1));
      const empJan1Curr = countActiveAtDate(clientEmployees, new Date(currentYear, 0, 1));

      // empleados al final del periodo (31-dic si año pasado, hoy si año actual)
      const endPrev = getEndOfPeriodForYear(prevYear);
      const endCurr = getEndOfPeriodForYear(currentYear);

      const empEndPrev = countActiveAtDate(clientEmployees, endPrev);
      const empEndCurr = countActiveAtDate(clientEmployees, endCurr);

      const leaversPrev = countLeaversInYear(clientEmployees, prevYear);
      const leaversCurr = countLeaversInYear(clientEmployees, currentYear);

      // promedio simple de personal (1-ene y final del periodo)
      const avgPrev = (empJan1Prev + empEndPrev) / 2;
      const avgCurr = (empJan1Curr + empEndCurr) / 2;

      const calcAttritionPercent = (leavers: number, avgWorkforce: number) => {
        if (avgWorkforce > 0) {
          const raw = (leavers / avgWorkforce) * 100;
          // limitar a 100%
          const capped = Math.min(raw, 100);
          return parseFloat(capped.toFixed(1));
        } else {
          // si promedio es 0 pero hubo salidas -> 100% (todo se fue)
          if (leavers > 0) return 100.0;
          return 0.0;
        }
      };

      const attrPrev = calcAttritionPercent(leaversPrev, avgPrev);
      const attrCurr = calcAttritionPercent(leaversCurr, avgCurr);

      seriesPrev.push(attrPrev);
      seriesCurr.push(attrCurr);
    }

    setCategories(allCustomers);
    setSeriesData([
      { name: `${prevYear}`, data: seriesPrev },
      { name: `${currentYear}`, data: seriesCurr },
    ]);
  };

  const optionscolumnchart: any = {
    chart: {
      foreColor: "#adb0bb",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const clientName = categories[config.dataPointIndex];
          if (clientName) {
            navigate(`/profiles/customerProfile?nameCustomer=${encodeURIComponent(clientName)}`);
          }
        },
      },
    },
    colors: [secondary, primary],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "60%",
      },
    },
    grid: { show: true, strokeDashArray: 3, borderColor: "rgba(0,0,0,.08)" },
    xaxis: {
      categories,
      labels: {
        rotate: -30,
        rotateAlways: true,
        style: { fontSize: "13px" },
      },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => `${val}%` } },
    legend: { position: "top" },
  };

  const categoryWidth = 120;
  const chartWidth = Math.max(categories.length * categoryWidth, 600);

  return (
    <DashboardCard title="Historic Attrition Risk">
      <Box sx={{ height: 360, width: "100%", display: "flex", flexDirection: "column" }}>
        {!loading ? (
          <Box sx={{ overflowX: "auto", px: 1, py: 0.5 }}>
            <Box sx={{ width: chartWidth, minHeight: 280 }}>
              <Chart options={optionscolumnchart} series={seriesData} type="bar" height={280} width={chartWidth} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2">Cargando...</Typography>
          </Box>
        )}
      </Box>
    </DashboardCard>
  );
};

export default SalesOverview;
