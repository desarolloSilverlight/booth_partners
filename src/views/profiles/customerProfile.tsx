import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from "@mui/material";
import { Grid2 as Grid } from "@mui/material";
import PieCharReasonDeparture from "src/components/dashboard/pieCharReasonDeparture";
import PieChartCommonVariables from "src/components/dashboard/pieChartCommonVariables";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import config from "src/config/config";

const CustomerProfile = () => {
  const [searchParams] = useSearchParams();
  const nameCustomer = searchParams.get("nameCustomer") ?? "";
  const navigate = useNavigate();
  const [attritionData, setAttritionData] = useState<any[]>([]);  
  const [shapData, setShapData] = useState<{ variable: string; score: number }[]>([]);
  const [alertQueue, setAlertQueue] = useState<{ msg: string; severity: "info" | "success" | "error" }[]>([]);

  const handleUnauthorized = () => {
    showAlert("Session expired. Please log in again.", "error");
    sessionStorage.removeItem("token");
    navigate("/auth/login");
    throw new Error("Unauthorized");
  };

  const showAlert = (msg: string, severity: "info" | "success" | "error") => {
    setAlertQueue((prev) => [...prev, { msg, severity }]);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Token defeated, enter again");
      navigate("/auth/login");
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("authToken", token);
    myHeaders.append("Content-Type", "application/json");

    const sendBody = { nameCustomer: nameCustomer };

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(sendBody),
      redirect: "follow",
    };

    fetch(`${config.rutaApi}show_top_shap`, requestOptions)
      .then((response) => {
        if (response.status === 401) return handleUnauthorized();
        return response.json();
      })
      .then((result) => {
        // console.log("Result fetch show_top_shap:", result);

        // ✅ Verificamos que dataTopShap exista y sea un array
        if (result && Array.isArray(result.dataTopShap)) {
          const formattedData = result.dataTopShap.map((item: any) => ({
            variable: item.shap_variable_name,
            score: item.avg_shap_score,
          }));

          setShapData(formattedData);
        } else {
          showAlert("Unexpected data format from API.", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        showAlert("An error occurred while fetching data.", "error");
      });

    fetch(`${config.rutaApi}show_attrition_category`, requestOptions)
    .then((response) => {
        if (response.status === 401) return handleUnauthorized();
        return response.json();
    })
    .then((res) => {
        // console.log("Result fetch show_attrition_category:", res);
        if (Array.isArray(res)) {
            setAttritionData(res);
        } else if (res && Array.isArray(res.data)) {
            setAttritionData(res.data);
        } else {
            showAlert("Unexpected data format for attrition category.", "error");
        }
    })
    .catch((error) => {
        console.error("Error fetching attrition category:", error);
        showAlert("An error occurred while fetching attrition category.", "error");
    });

  }, [nameCustomer, navigate]);

  return (
    <>
      {/* Tabla de SHAP */}
      <Box mb={3}>
        <BaseCard
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h5">
                {nameCustomer} - Attrition Risk By S.H.A.P
              </Typography>
            </Box>
          }
        >
            <TableContainer>
                <Table aria-label="main table" sx={{ whiteSpace: "nowrap" }}>
                <TableHead>
                    <TableRow>
                    <TableCell>Variable</TableCell>
                    <TableCell>Attrition Score</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {shapData.length > 0 ? (
                    shapData.map((item, index) => (
                        <TableRow key={index}>
                        <TableCell>{item.variable}</TableCell>
                        <TableCell>{item.score.toFixed(6)}</TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={2}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                        >
                            No data available
                        </Typography>
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </TableContainer>

            <TableContainer>
                <Table aria-label="attrition category table" sx={{ whiteSpace: "nowrap" }}>
                    <TableHead>
                    <TableRow>
                        <TableCell>Employee Name</TableCell>
                        <TableCell>Attrition Type</TableCell>
                        <TableCell>Attrition Category</TableCell>
                        <TableCell>Attrition Reason</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {attritionData.length > 0 ? (
                        attritionData.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.full_name}</TableCell>
                            <TableCell>{item.attrition_type}</TableCell>
                            <TableCell>{item.attrition_category}</TableCell>
                            <TableCell>{item.attrition_specific_reason}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4}>
                            <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                            >
                            No data available
                            </Typography>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </TableContainer>


        </BaseCard>
        
      </Box>

      {/*
      <Box mb={3}>
        <BaseCard
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h5">
                Overview of the analysis prediction
              </Typography>
            </Box>
          }
        >
          <TableContainer>
            <Table aria-label="risk counts" sx={{ whiteSpace: "nowrap" }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle1">Low Risks</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1">Medium Risks</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1">High Risks</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography fontWeight={600} color="success.main">
                      {0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color="warning.main">
                      {0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color="error.main">
                      {0}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      </Box>
            
      <Box mb={3}>
        <BaseCard
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="h5">aquí va el search</Typography>
            </Box>
          }
        >
          <TableContainer>
            <Table aria-label="main table" sx={{ whiteSpace: "nowrap" }}>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Perception</TableCell>
                  <TableCell>Analysis result</TableCell>
                  <TableCell>Predictive analysis</TableCell>
                </TableRow>
              </TableHead>
              <TableBody></TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      </Box>
      */}

      {/* Gráficos */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              lg: 6,
            }}
          >
            <PieCharReasonDeparture />
          </Grid>
          <Grid
            size={{
              xs: 12,
              lg: 6,
            }}
          >
            <PieChartCommonVariables dataShap={nameCustomer} />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default CustomerProfile;
