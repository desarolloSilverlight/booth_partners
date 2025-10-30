import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  CircularProgress,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
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
  showTable?: boolean; // Muestra tabla de valores al lado del gráfico
  showPercentLabels?: boolean; // Muestra porcentajes sobre el gráfico
  pdfFullTable?: boolean; // Para PDF: renderiza una copia completa de la tabla sin scroll
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
  showTable = false,
  showPercentLabels = true,
  pdfFullTable = false,
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

  // Altura dinámica: asegura espacio para leyenda inferior con pocas o muchas categorías
  const chartHeight = useMemo(() => {
    const count = Math.max(chartLabels.length || 1, 1);
    // Estimación: 2 elementos por fila de leyenda para evitar cortes con textos largos
    const cols = 2;
    const rows = Math.ceil(count / cols);
    const base = Math.max(height - 100, 220); // área base para el pie
    const perRow = 28; // alto estimado por fila de leyenda
    return base + rows * perRow;
  }, [chartLabels, height]);

  // Brand palette (Lus)
  const colors = [
    // Primary
    "#589992", // Lake Green
    "#D6EDE3", // Mint
    // Secondary
    "#C9ADCD", // Mauve
    "#E1DDED", // Lilac
    "#8581B5", // Violet
    "#D9E8F4", // Rain
    "#255C82", // Blue
    "#707070", // Stone
    "#AAAAAA", // Silver
    "#C7C5C4", // Timberwolf
  ];

  const options: any = {
    chart: {
      type: "pie",
      toolbar: { show: false },
      height: chartHeight,
    },
    labels: chartLabels,
    colors: colors,
    legend: {
      show: true,
      position: "bottom", // ✅ Todas las leyendas van debajo
      showForSingleSeries: true,
      showForNullSeries: true,
      showForZeroSeries: true,
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
      enabled: !!showPercentLabels,
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
      y: {
        // Oculta cualquier valor numérico en el tooltip
        formatter: () => '',
        title: {
          formatter: () => '',
        },
      },
      custom: function ({ seriesIndex, w }: any) {
        try {
          const label = w?.config?.labels?.[seriesIndex] ?? '';
          const color = w?.config?.colors?.[seriesIndex] ?? '#999';
          return `
            <div style="padding:6px 8px;display:flex;align-items:center;gap:6px;color:#ffffff;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
              <span style="color:#ffffff;">${label}</span>
            </div>
          `;
        } catch {
          return '';
        }
      },
    },
    stroke: { show: false },
  };

  // Tabla de valores (label, %, count)
  const tableRows = useMemo(() => {
    const total = chartSeries.reduce((a, b) => a + b, 0) || 1;
    return chartLabels.map((label, i) => {
      const count = chartSeries[i] || 0;
      const pct = (count / total) * 100;
      return { label, count, pct };
    }).sort((a, b) => b.count - a.count);
  }, [chartLabels, chartSeries]);

  return (
    <DashboardCard>
      {/* Título opcional */}
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
      )}

      {showSelector && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <Select
            value={fieldToAnalyze}
            onChange={(e) =>
              setFieldToAnalyze(
                e.target.value as "attrition_type" | "attrition_category" | "attrition_specific_reason"
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

      {showTable ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: chartHeight,
            }}
          >
            <Suspense fallback={<CircularProgress />}>
              {loading ? (
                <CircularProgress />
              ) : chartSeries.length > 0 ? (
                <Chart options={options} series={chartSeries} type="pie" height={chartHeight} width="100%" />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Suspense>
          </Box>

          <TableContainer sx={{
            border: '1px solid #eee',
            borderRadius: 2,
            maxHeight: chartHeight,
            overflow: 'auto',
          }}>
            <Table size="small" aria-label="values table" sx={{ whiteSpace: 'nowrap' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Variable</TableCell>
                  <TableCell align="right">%</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length > 0 ? (
                  tableRows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell align="right">{r.pct.toFixed(1)}%</TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">No data available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Tabla completa SOLO para PDF (sin scroll) */}
          {pdfFullTable && (
            <Box data-pdf-only="true" sx={{ display: 'none' }}>
              <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                <Table size="small" aria-label="values table full" sx={{ whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Variable</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.length > 0 ? (
                      tableRows.map((r, idx) => (
                        <TableRow key={`full-${idx}`}>
                          <TableCell>{r.label}</TableCell>
                          <TableCell align="right">{r.pct.toFixed(1)}%</TableCell>
                          <TableCell align="right">{r.count}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="text.secondary" textAlign="center">No data available</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: chartHeight,
          }}
        >
          <Suspense fallback={<CircularProgress />}>
            {loading ? (
              <CircularProgress />
            ) : chartSeries.length > 0 ? (
              <Chart options={options} series={chartSeries} type="pie" height={chartHeight} width="100%" />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No data available
              </Typography>
            )}
          </Suspense>
        </Box>
      )}
    </DashboardCard>
  );
};

export default PieCharReasonDeparture;
