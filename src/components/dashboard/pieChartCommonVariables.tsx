import React, { Suspense, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import config from "src/config/config";

const Chart = React.lazy(() => import("react-apexcharts"));

interface PieChartCommonVariablesProps {
  dataShap: string;
}

const PieChartCommonVariables: React.FC<PieChartCommonVariablesProps> = ({ dataShap }) => {
  const theme = useTheme();
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

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

  const colors = ["#00E396", "#FEB019", "#008FFB", "#FF4560", "#775DD0"];

  const options: any = {
    chart: {
      type: "pie",
      height: 300,
      toolbar: { show: false },
    },
    labels: labels.length > 0 ? labels : ["Loading..."],
    colors: colors,
    legend: {
      show: true,
      position: "right",
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
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toFixed(3),
      },
    },
    stroke: {
      show: false,
    },
  };

  return (
    <DashboardCard title="Major Risk Drivers" subtitle="">
      <Box height="300px">
        <Suspense fallback={<div>Cargando gráfico...</div>}>
          <Chart
            options={options}
            series={series.length > 0 ? series : [0, 0, 0, 0]}
            type="pie"
            height={300}
          />
        </Suspense>
      </Box>
    </DashboardCard>
  );
};

export default PieChartCommonVariables;
