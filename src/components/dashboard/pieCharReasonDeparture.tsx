import React, { Suspense, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  CircularProgress,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";

const Chart = React.lazy(() => import("react-apexcharts"));

interface PieCharReasonDepartureProps {
  dataAttrition: string;
  fieldToAnalyzeProp?:
    | "attrition_type"
    | "attrition_category"
    | "attrition_specific_reason";
  showSelector?: boolean;
  height?: number; // Altura mínima del contenedor del gráfico
  title?: string; // Título opcional sobre el gráfico
}

interface AttritionItem {
  full_name: string;
  attrition_type: string;
  attrition_category: string;
  attrition_specific_reason: string;
}

const PieCharReasonDeparture: React.FC<PieCharReasonDepartureProps> = ({
  dataAttrition,
  fieldToAnalyzeProp,
  showSelector = true,
  height = 400,
  title,
}) => {
  const theme = useTheme();
  const [chartSeries, setChartSeries] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldToAnalyze, setFieldToAnalyze] = useState<
    "attrition_type" | "attrition_category" | "attrition_specific_reason"
  >(fieldToAnalyzeProp || "attrition_specific_reason");

  // Sincroniza el estado si el prop cambia
  useEffect(() => {
    if (fieldToAnalyzeProp) setFieldToAnalyze(fieldToAnalyzeProp);
  }, [fieldToAnalyzeProp]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const myHeaders = new Headers();
    myHeaders.append("authToken", token);
    myHeaders.append("Content-Type", "application/json");

    const sendBody = { nameCustomer: dataAttrition };

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(sendBody),
      redirect: "follow",
    };

    fetch(`${config.rutaApi}show_attrition_category`, requestOptions)
      .then((response) => response.json())
      .then((res) => {
        if (res && Array.isArray(res.dataCategory)) {
          const data: AttritionItem[] = res.dataCategory;

          const normalizeLabel = (val: any) => {
            const base = (val === null || val === undefined) ? 'Unknown' : String(val);
            const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
            return cleaned === '' ? 'Unknown' : cleaned;
          };

          const counts: Record<string, number> = {};
          data.forEach((item) => {
            const rawVal = item[fieldToAnalyze as keyof AttritionItem];
            const value = normalizeLabel(rawVal);
            counts[value] = (counts[value] || 0) + 1;
          });

          const labels = Object.keys(counts);
          const seriesCounts = Object.values(counts);

          setChartLabels(labels);
          setChartSeries(seriesCounts);
        } else {
          setChartLabels([]);
          setChartSeries([]);
        }
      })
      .catch((error) => console.error("Error fetching attrition data:", error))
      .finally(() => setLoading(false));
  }, [dataAttrition, fieldToAnalyze]);

  const colors = [
    "#3608df",
    "#920a80",
    "#d16983ff",
    "#dd4719",
    "#ffb347",
    "#6fcf97",
    "#2f80ed",
    "#f2994a",
    "#27ae60",
    "#a020f0",
    "#e91e63",
  ];

  const options: any = {
    chart: {
      type: "pie",
      toolbar: { show: false },
      height: "100%",
    },
    labels: chartLabels,
    colors: colors,
    legend: {
      show: true,
      position: "bottom", // ✅ Todas las leyendas van debajo
      fontSize: "13px",
      horizontalAlign: "center",
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
      enabled: true,
      formatter: (_val: number, opts: any) => {
        try {
          const series: number[] = opts?.w?.globals?.series || [];
          const total = series.reduce((a, b) => a + b, 0);
          const idx = (typeof opts?.seriesIndex === 'number' && opts.seriesIndex >= 0)
            ? opts.seriesIndex
            : (typeof opts?.dataPointIndex === 'number' && opts.dataPointIndex >= 0)
              ? opts.dataPointIndex
              : 0;
          const raw = series[idx] ?? 0;
          const pct = total ? (raw / total) * 100 : 0;
          return `${pct.toFixed(1)}%`;
        } catch {
          return ``;
        }
      },
      style: {
        colors: ["#ffffff"],
        fontSize: "12px",
        fontWeight: 600,
      },
      dropShadow: { enabled: false },
    },
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
      custom: function({ seriesIndex, w }: any) {
        try {
          const label = w?.config?.labels?.[seriesIndex] ?? '';
          const color = w?.config?.colors?.[seriesIndex] ?? '#999';
          return `\n            <div style="padding:6px 8px;display:flex;align-items:center;gap:6px;">\n              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>\n              <span>${label}</span>\n            </div>\n          `;
        } catch {
          return '';
        }
      },
    },
    stroke: { show: false },
  };

  return (
    <DashboardCard>
      {/* Título opcional */}
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
      )}

      {showSelector && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Select
            value={fieldToAnalyze}
            onChange={(e) =>
              setFieldToAnalyze(
                e.target.value as
                  | "attrition_type"
                  | "attrition_category"
                  | "attrition_specific_reason"
              )
            }
            size="small"
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="attrition_type">Attrition Type</MenuItem>
            <MenuItem value="attrition_category">Attrition Category</MenuItem>
            <MenuItem value="attrition_specific_reason">Attrition Reason</MenuItem>
          </Select>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: height,
          "& > *": {
            width: "100% !important",
            height: "100% !important",
          },
        }}
      >
        <Suspense fallback={<CircularProgress />}>
          {loading ? (
            <CircularProgress />
          ) : chartSeries.length > 0 ? (
            <Chart options={options} series={chartSeries} type="pie" height="100%" width="100%" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available
            </Typography>
          )}
        </Suspense>
      </Box>
    </DashboardCard>
  );
};

export default PieCharReasonDeparture;
