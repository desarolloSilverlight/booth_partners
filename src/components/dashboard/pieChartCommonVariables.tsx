import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";

const Chart = React.lazy(() => import("react-apexcharts"));

interface PieChartCommonVariablesProps {
  dataShap: string;
  height?: number; // optional override to fix chart height
}

const PieChartCommonVariables: React.FC<PieChartCommonVariablesProps> = ({ dataShap, height }) => {
  const theme = useTheme();
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  // Formatea labels del modelo: quita prefijos num__/cat__, reemplaza '_' por espacio y aplica Title Case
  const prettyLabel = (raw: string): string => {
    if (!raw) return raw;
    let t = raw.replace(/^(num__|cat__)/, "");
    // Reemplazar conectores comunes
    t = t.replace(/=/g, ": ");
    t = t.replace(/_/g, " ");
    // Colapsar espacios múltiples
    t = t.replace(/\s+/g, " ").trim();
    // Title Case básico
    t = t
      .split(" ")
      .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
    return t;
  };

  const displayLabels = useMemo(() => labels.map(prettyLabel), [labels]);

  // Calcula una altura dinámica para que la leyenda debajo no se corte
  const chartHeight = useMemo(() => {
    const count = Math.max(labels.length || 1, 1);
    const cols = 3; // aprox. 3 elementos por fila en la leyenda
    const rows = Math.ceil(count / cols);
    const base = 260; // altura base del pie
    const perRow = 28; // espacio por fila de leyenda
    return base + rows * perRow;
  }, [labels]);
  // If an explicit height is provided, use it; otherwise use dynamic height
  const finalHeight = height ?? chartHeight;

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const myHeaders = new Headers();
    myHeaders.append("authToken", token);
    myHeaders.append("Content-Type", "application/json");

    const sendBody = { nameCustomer: dataShap };

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(sendBody),
      redirect: "follow",
    };

    fetch(`${config.rutaApi}show_top_shap`, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        // console.log("Result PieChartCommonVariables:", result);
        if (result && Array.isArray(result.dataTopShap)) {
          const vars = result.dataTopShap.map((item: any) => item.shap_variable_name);
          const scores = result.dataTopShap.map((item: any) => item.avg_shap_score);
          setLabels(vars);
          setSeries(scores);
        } else {
          console.warn("Unexpected API format for PieChartCommonVariables");
        }
      })
      .catch((error) => console.error("Error fetching shap data for chart:", error));
  }, [dataShap]);

  // Brand palette (Lus)
  const colors = [
    // Primary
    "#589992", // Lake Green
    // Secondary
    "#C9ADCD", // Mauve
    "#E1DDED", // Lilac
    "#8581B5", // Violet
    "#255C82", // Blue
  ];

  const options: any = {
    chart: {
      type: "pie",
      height: finalHeight,
      toolbar: { show: false },
    },
    labels: displayLabels.length > 0 ? displayLabels : ["Loading..."],
    colors: colors,
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      floating: false,
      fontSize: "12px",
      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
      y: {
        // ocultar cualquier valor numérico en el tooltip
        formatter: () => '',
        title: { formatter: () => '' },
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
    stroke: {
      show: false,
    },
  };

  return (
    <DashboardCard title="Major Risk Drivers" subtitle="">
      <Box height={`${finalHeight}px`}>
        <Suspense fallback={<div>Cargando gráfico...</div>}>
          <Chart
            options={options}
            series={series.length > 0 ? series : [0, 0, 0, 0]}
            type="pie"
            height={finalHeight}
          />
        </Suspense>
      </Box>
    </DashboardCard>
  );
};

export default PieChartCommonVariables;
