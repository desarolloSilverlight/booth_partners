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
}

interface AttritionItem {
  full_name: string;
  attrition_type: string;
  attrition_category: string;
  attrition_specific_reason: string;
}

const PieCharReasonDeparture: React.FC<PieCharReasonDepartureProps> = ({
  dataAttrition,
}) => {
  const theme = useTheme();
  const [chartSeries, setChartSeries] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldToAnalyze, setFieldToAnalyze] = useState<
    "attrition_type" | "attrition_category" | "attrition_specific_reason"
  >("attrition_specific_reason");

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

          const counts: Record<string, number> = {};
          data.forEach((item) => {
            const value =
              item[fieldToAnalyze as keyof AttritionItem] || "Unknown";
            counts[value] = (counts[value] || 0) + 1;
          });

          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const labels = Object.keys(counts);
          const series = Object.values(counts).map((v) =>
            Number(((v / total) * 100).toFixed(2))
          );

          setChartLabels(labels);
          setChartSeries(series);
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
    "#00fbfb",
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
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val: number) => `${val.toFixed(2)}%` },
    },
    stroke: { show: false },
  };

  return (
    <DashboardCard>
        <Box
            sx={{
            display: "flex",
            justifyContent: "flex-end", // Alinea el select a la derecha
            alignItems: "center",
            mb: 2, // Margen inferior para separar del gráfico
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
                <MenuItem value="attrition_specific_reason">
                    Attrition Reason
                </MenuItem>
            </Select>
        </Box>
        
        <Box
            sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
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
                <Chart
                options={options}
                series={chartSeries}
                type="pie"
                height="100%"
                width="100%"
                />
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
