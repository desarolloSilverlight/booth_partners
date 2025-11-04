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
    const prevPrevYear = prevYear - 1;

    const allCustomers = Array.from(new Set(employees.map((e) => e.customer || "Unknown Client")));

    const startFields = ["start_date", "hire_date", "created_at", "active_since", "fecha_ingreso"];
    const endFields = ["active_until", "end_date", "terminacion_date", "fecha_salida"];

    const getEmployeeKey = (emp: any, idx: number) => {
      return emp?.id ?? emp?.employee_id ?? emp?.document_number ?? `${emp?.email ?? ""}__${idx}`;
    };

    // Helpers de fechas
    const startOfYear = (year: number) => new Date(year, 0, 1, 0, 0, 0, 0);
    const endOfYear = (year: number) => new Date(year, 11, 31, 23, 59, 59, 999);

    // Cuenta bajas cuyo end cae en ese año
    const countLeaversInYear = (clientEmps: any[], year: number) => {
      const leaverKeys = new Set<string>();
      clientEmps.forEach((emp, idx) => {
        const key = getEmployeeKey(emp, idx);
        const end = parseDateFromFields(emp, endFields);
        if (!end) return;
        if (end.getFullYear() === year) leaverKeys.add(key);
      });
      return leaverKeys.size;
    };

    // Nuevo denominador: personas únicas que estuvieron activas alguna vez en el periodo [ini, fin] (inclusive)
    const uniqueActiveInPeriod = (clientEmps: any[], ini: Date, fin: Date) => {
      const seen = new Set<string>();
      clientEmps.forEach((emp, idx) => {
        const key = getEmployeeKey(emp, idx);
        if (seen.has(key)) return;

        const s = parseDateFromFields(emp, startFields) ?? new Date(-8640000000000000); 
        const e = parseDateFromFields(emp, endFields) ?? new Date(8640000000000000);  

        // Intersección de intervalos (inclusiva)
        if (s.getTime() <= fin.getTime() && e.getTime() >= ini.getTime()) {
          seen.add(key);
        }
      });
      return seen.size;
    };

    const rows = allCustomers.map((customer) => {
      const clientEmployees = employees.filter((e) => (e.customer || "Unknown Client") === customer);

      // Periodos de cálculo
      const prevIni = startOfYear(prevYear);
      const prevFin = endOfYear(prevYear);
      const currIni = startOfYear(currentYear);
      const currFin = getEndOfPeriodForYear(currentYear); // hoy si es el año actual, de lo contrario 31/dic

      // Numeradores
      const leaversPrev = countLeaversInYear(clientEmployees, prevYear);
      const leaversCurr = countLeaversInYear(clientEmployees, currentYear);

      // Denominadores (headcount único con presencia en el periodo)
      const denomPrev = uniqueActiveInPeriod(clientEmployees, prevIni, prevFin);
      const denomCurr = uniqueActiveInPeriod(clientEmployees, currIni, currFin);

      const calcAttritionPercent = (leavers: number, denom: number) => {
        if (denom > 0) {
          const raw = (leavers / denom) * 100;
          return parseFloat(Math.min(raw, 100).toFixed(1));
        } else {
          return leavers > 0 ? 100.0 : 0.0;
        }
      };

      const attrPrevReal = calcAttritionPercent(leaversPrev, denomPrev);
      const attrCurrReal = calcAttritionPercent(leaversCurr, denomCurr);

      const epsilon = 0.1;
      const basePrev = "#EDD9ED";
      const baseCurr = "#CD9ACD";

      return {
        customer,
        prevReal: attrPrevReal,
        currReal: attrCurrReal,
        prevPlot: attrPrevReal > 0 ? attrPrevReal : epsilon,
        currPlot: attrCurrReal > 0 ? attrCurrReal : epsilon,
        basePrev,
        baseCurr,
      };
    });

    rows.sort((a, b) => {
      return (b.currReal - a.currReal) || (b.prevReal - a.prevReal) || a.customer.localeCompare(b.customer);
    });

    setCategories(rows.map((r) => r.customer));
    setSeriesData([
      { name: `${prevYear}`, data: rows.map((r) => ({ x: r.customer, y: r.prevPlot, real: r.prevReal, fillColor: r.basePrev })) },
      { name: `${currentYear}`, data: rows.map((r) => ({ x: r.customer, y: r.currPlot, real: r.currReal, fillColor: r.baseCurr })) },
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
    // Colores por serie (los datapoints usan fillColor personalizado si son 0%)
    colors: ["#EDD9ED", "#CD9ACD"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: "60%",
        // stacked mantiene una "sombra" clickeable si fuese necesario en futuras mejoras
        // stacked: true,
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
    tooltip: {
      y: {
        formatter: (val: number, opts: any) => {
          try {
            const dp = opts?.w?.config?.series?.[opts.seriesIndex]?.data?.[opts.dataPointIndex];
            const real = typeof dp?.real === 'number' ? dp.real : undefined;
            const n = typeof real === 'number' ? real : val;
            return `${Number(n).toFixed(1)}%`;
          } catch {
            return `${val.toFixed?.(1) ?? val}%`;
          }
        },
      },
    },
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
