import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Snackbar,
  TablePagination,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material";
import PieCharReasonDeparture from "src/components/dashboard/pieCharReasonDeparture";
import PieChartCommonVariables from "src/components/dashboard/pieChartCommonVariables";
import BaseCard from "src/components/BaseCard/BaseCard";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import config from "src/config/config";
import InputSearch from "src/components/forms/inputSearch/search";
import DOMPurify from "dompurify";

interface Predictive_Analysis {
  id: number;
  fullName: string;
  customer: string;
  calification: string;
  clasification: string;
  attrition_probability: string;
  text_ai: string;
}

const CustomerProfile = () => {
  const reportRef = (null as unknown) as React.RefObject<HTMLDivElement> | null;
  let setReportRef: ((el: HTMLDivElement | null) => void) | undefined;
  const [predictive_analitics, setPredictive_analitics] = useState<Predictive_Analysis[]>([]);
  const [filtereredData, setFilteredData] = useState<Predictive_Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [searchParams] = useSearchParams();
  const nameCustomer = searchParams.get("nameCustomer") ?? "";
  const navigate = useNavigate();
  const [attritionData, setAttritionData] = useState<any[]>([]);
  const [shapData, setShapData] = useState<{ variable: string; score: number }[]>([]);
  const [alertQueue, setAlertQueue] = useState<{ msg: string; severity: "info" | "success" | "error" }[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Predictive_Analysis | null>(null);

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEmployee(null);
  };


  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

        if (res && Array.isArray(res.dataCategory)) {
          setAttritionData(res.dataCategory);
        } else {
          showAlert("Unexpected data format from API.", "error");
          setAttritionData([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching attrition category:", error);
        showAlert("An error occurred while fetching attrition category.", "error");
      });

    fetch(`${config.rutaApi}show_employee_customer_profile`, requestOptions)
      .then((response) => {
        if (response.status === 401) return handleUnauthorized();
        return response.json();
      })
      .then((result) => {
        const data = result.dataAttrition;

        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        const formattedData: Predictive_Analysis[] = data.map((item: any) => {
          return {
            id: item.fkid_employe,
            fullName: item.full_name || "",
            customer: item.customer || "",
            calification: (() => {
              try {
                const obj = typeof item.calification === "string"
                  ? JSON.parse(item.calification.replace(/'/g, '"'))
                  : item.calification;
                return obj?.Nivel || "";
              } catch {
                return "";
              }
            })(),
            clasification: item.clasification || "",
            attrition_probability: item.attrition_probability || "",
            text_ai: item.text_ai || "",
          };
        });

        setPredictive_analitics(formattedData);
        setFilteredData(formattedData);
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          showAlert(error.message || "Error in process", "error");
          console.error(error);
        }
      })
      .finally(() => {
        setLoading(false);
      });

  }, [nameCustomer, navigate]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(predictive_analitics);
    } else {
      const filteredData = predictive_analitics.filter((dataAnalysis) =>
        dataAnalysis.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataAnalysis.clasification.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filteredData);
    }
  }, [searchTerm, predictive_analitics]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(predictive_analitics);
    } else {
      const filteredData = predictive_analitics.filter((dataAnalysis) =>
        dataAnalysis.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataAnalysis.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filteredData);
    }
  }, [searchTerm, predictive_analitics]);

  const handleOpen = (employee: Predictive_Analysis) => {
    setSelectedEmployee(employee);
    setOpen(true);
  };

  const riskCounts = {
    low: filtereredData.filter(item => item.clasification.toLowerCase().includes("low")).length,
    medium: filtereredData.filter(item => item.clasification.toLowerCase().includes("medium")).length,
    high: filtereredData.filter(item => item.clasification.toLowerCase().includes("high")).length,
  }

  const parseTextAI = (text: string) => {
    if (!text) return {};

    return {
      brief: (text.match(/Attrition Risk Brief:([\s\S]*?)(?=\*\*Risk Level|Risk Level:)/i)?.[1] || "").trim(),
      riskLevel: (text.match(/Risk Level:([\s\S]*?)(?=\*\*Prioritized|Prioritized Risk Drivers:)/i)?.[1] || "").trim(),
      drivers: (text.match(/Prioritized Risk Drivers:([\s\S]*?)(?=\*\*Sentiment|Sentiment Analysis:)/i)?.[1] || "").trim(),
      sentiment: (text.match(/Sentiment Analysis:([\s\S]*?)(?=\*\*Overall|Overall Situation Assessment:)/i)?.[1] || "").trim(),
      assessment: (text.match(/Overall Situation Assessment:([\s\S]*?)(?=\*\*Recommended|Recommended Actions:)/i)?.[1] || "").trim(),
      actions: formatActions((text.match(/Recommended Actions:([\s\S]*)/i)?.[1] || "").trim()),
    };
  };

  const formatActions = (text: string) => {
    if (!text) return "";
    let out = String(text);
    const labelPattern = /(?:\*\*|__|<b>|<strong>)?\s*(Controllable by\s+(?:the\s+Client|Client|Us))\s*:?\s*(?:\*\*|__|<\/b>|<\/strong>)?/gi;

    out = out.replace(labelPattern, (_match, label) => {
      const normalized = label.trim();
      return `<b>${normalized}:</b> `;
    });

    return out.trim();
  };

  const cleanAndSplitText = (text: string) => {
    if (!text) return [];
    return text
      .split(/\n|\. /)
      .map(item => item.replace(/\*\*|^-|\d+$/g, "").trim())
      .filter(item => item.length > 0)
      .map(item => item.endsWith('.') ? item : item + '.');
  };

  const parsed = selectedEmployee?.text_ai ? parseTextAI(selectedEmployee.text_ai) : null;

  const driversList = parsed?.drivers ? cleanAndSplitText(parsed.drivers) : [];
  const sentimentList = parsed?.sentiment ? cleanAndSplitText(parsed.sentiment) : [];
  const assessmentList = parsed?.assessment ? cleanAndSplitText(parsed.assessment) : [];
  const actionsList = parsed?.actions ? cleanAndSplitText(parsed.actions) : [];

  const handleDownloadPdf = async () => {
    try {
      const element = document.getElementById('report-root');
      if (!element) return;

      // Increase scale for better quality
      const canvas = await html2canvas(element as HTMLElement, { scale: 2, useCORS: true, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = { width: canvas.width, height: canvas.height };
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add extra pages if the content spans multiple pages
      while (heightLeft > -1) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Build filename
      const dayjs = (await import('dayjs')).default;
      const safeName = (nameCustomer || 'Customer').replace(/[^a-z0-9-_]/gi, '_');
      const filename = `Report_PDF_${safeName}_${dayjs().format('YYYYMMDD')}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Error generating PDF. Check console for details.');
    }
  };

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
                width: "100%",
                flexWrap: "nowrap",
                px: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flexGrow: 1,
                }}
              >
                {nameCustomer}
              </Typography>

              <Box sx={{ flexShrink: 0 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleDownloadPdf}
                  sx={{
                    backgroundColor: "#0D4B3B",
                    color: "#ffffff",
                    textTransform: "none",
                    borderRadius: "20px",
                    px: 2,
                    "&:hover": { backgroundColor: "#0a3d32" },
                  }}
                >
                  Download PDF
                </Button>
              </Box>
            </Box>
          }
        >

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 3,
            }}
          >

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
              <PieChartCommonVariables dataShap={nameCustomer} />
            </Box>

            {/* Derecha: tabla */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400, // ✅ Igual altura que la gráfica
              }}
            >
              <TableContainer
                sx={{
                  boxShadow: "none",
                  border: "1px solid #eee",
                  borderRadius: 2,
                  width: "100%", // ✅ Que use todo el espacio del Box
                  height: "100%", // ✅ Que llene la altura del Box
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center", // ✅ Centra verticalmente el contenido
                }}
              >
                <Table
                  aria-label="main table"
                  sx={{
                    whiteSpace: "nowrap",
                    "& th, & td": {
                      textAlign: "center", // ✅ Centra todas las celdas
                      verticalAlign: "middle",
                    },
                    "& th": {
                      fontWeight: "bold", // ✅ Negrita en encabezados
                      fontSize: "0.95rem",
                      backgroundColor: "#f9f9f9", // 🎨 Opcional: sutil fondo al header
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>VARIABLE</TableCell>
                      <TableCell>ATTRITION SCORE</TableCell>
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
            </Box>
          </Box>
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
              }}
            >
              <Typography variant="h5">
                {nameCustomer} - Attrition Details
              </Typography>
            </Box>
          }
        >
          {/* Contenedor principal */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            {/* Izquierda: gráfica */}
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
              <PieCharReasonDeparture dataAttrition={nameCustomer} />
            </Box>

            {/* Derecha: tabla con paginación */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <TableContainer
                sx={{
                  boxShadow: "none",
                  border: "1px solid #eee",
                  borderRadius: 2,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflowX: "auto",
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#c1c1c1",
                    borderRadius: 4,
                  },
                }}
              >
                <Table
                  aria-label="attrition table"
                  sx={{
                    whiteSpace: "nowrap",
                    minWidth: 600,
                    "& th, & td": {
                      textAlign: "center",
                      verticalAlign: "middle",
                    },
                    "& th": {
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      backgroundColor: "#f9f9f9",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>EMPLOYEE NAME</TableCell>
                      <TableCell>ATTRITION TYPE</TableCell>
                      <TableCell>ATTRITION CATEGORY</TableCell>
                      <TableCell>ATTRITION REASON</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attritionData.length > 0 ? (
                      attritionData
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((item, index) => (
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

                {/* 🔹 Paginación elegante */}
                {attritionData.length > 0 && (
                  <TablePagination
                    component="div"
                    count={attritionData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[8, 15]}
                    sx={{
                      borderTop: "1px solid #eee",
                      backgroundColor: "#fafafa",
                      ".MuiTablePagination-toolbar": {
                        justifyContent: "center",
                      },
                    }}
                  />
                )}
              </TableContainer>
            </Box>
          </Box>
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
              }}
            >
              <Typography variant="h5">
              </Typography>
            </Box>
          }
        >
          <TableContainer>
            <Table aria-label="risk counts" sx={{ whiteSpace: "nowrap" }}>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle1">Low Risks</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1">Medium Risks</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1">High Risks</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><Typography fontWeight={600} color="success.main">{riskCounts.low}</Typography></TableCell>
                  <TableCell><Typography fontWeight={600} color="warning.main">{riskCounts.medium}</Typography></TableCell>
                  <TableCell><Typography fontWeight={600} color="error.main">{riskCounts.high}</Typography></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      </Box>

      <Box mb={3}>
        <BaseCard title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5">Predictive Attrition Analysis</Typography>
            </Box>
            <InputSearch
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onClearSearch={handleClearSearch}
              placeholder="Analyzing ...."
              width={{ xs: '100%', sm: 300, md: 400 }}
            />

          </Box>
        }>
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
              <TableBody>
                {filtereredData.map((dataAnalysis, index) => (
                  <TableRow key={dataAnalysis.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{dataAnalysis.fullName}</TableCell>
                    <TableCell>{dataAnalysis.customer}</TableCell>
                    <TableCell>{dataAnalysis.calification}</TableCell>
                    <TableCell>{dataAnalysis.clasification}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                        onClick={() => handleOpen(dataAnalysis)}
                      >
                        Show Risk
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </BaseCard>
      </Box>

      {/* Modal global */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {selectedEmployee && (
          <>
            <DialogTitle sx={{ bgcolor: "#2a3547", color: "white", borderRadius: "8px 8px 0 0" }}>
              ATTRITION RISK INSIGHTS - {selectedEmployee.fullName}
              <Chip
                label={selectedEmployee.clasification}
                color={
                  selectedEmployee.clasification.toLowerCase().includes("high") ? "error"
                    : selectedEmployee.clasification.toLowerCase().includes("medium") ? "warning"
                      : "success"
                }
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              {/* Título */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>Prioritized Risk Drivers</Typography>

              {/* Contenedor en fila */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {/* Recuadro 1: Nombre */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column", // Cambia a columna
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    flex: 1,
                    minWidth: 100
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", mb: 1 }}>🏢</Typography>
                  <Typography variant="body1" fontWeight="bold" align="center">
                    {selectedEmployee.customer}
                  </Typography>
                </Box>

                {/* Recuadro 2: Carita + Sentiment */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    flex: 2
                  }}
                >
                  {/* Carita */}
                  <Typography
                    sx={{
                      fontSize: "2rem",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {selectedEmployee.calification === "Positive" ? "😀" :
                      selectedEmployee.calification === "Negative" ? "😞" :
                        selectedEmployee.calification === "Neutral" ? "😐" :
                          "🤨"}
                  </Typography>

                  {/* Texto: Calificación + Sentiment Analysis */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      {selectedEmployee.calification === "Positive" ? "Positive" :
                        selectedEmployee.calification === "Negative" ? "Negative" :
                          selectedEmployee.calification === "Neutral" ? "Neutral" :
                            "No comments to analyze"}
                    </Typography>
                    {sentimentList.length > 0 && (
                      <Box>
                        {sentimentList.map((item, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 0.5 }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Recuadro 3: Prioritized Risk Drivers */}
                {parsed && driversList.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      p: 2,
                      bgcolor: "grey.100",
                      borderRadius: 2,
                      flex: 2,
                      minWidth: 280
                    }}
                  >
                    {/* Emoji de riesgo */}
                    <Typography
                      sx={{
                        fontSize: "2rem",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {selectedEmployee.clasification.toLowerCase().includes("high") ? "❌" :
                        selectedEmployee.clasification.toLowerCase().includes("medium") ? "⚠️" :
                          selectedEmployee.clasification.toLowerCase().includes("low") ? "✅" :
                            "⚪"}
                    </Typography>

                    {/* Texto y lista de drivers */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight="bold" gutterBottom>
                        Prioritized Risk Drivers
                      </Typography>
                      {driversList.map((item, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 1 }}
                        >
                          • {item}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Overall Situation Assessment */}
              {parsed && assessmentList.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  {/* Emoji de assessment */}
                  <Typography
                    sx={{
                      fontSize: "2rem",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    📝
                  </Typography>
                  {/* Texto y lista de assessment */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Situation Assessment
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {assessmentList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </Box>
                </Box>
              )}

              {/* Recommended Actions */}
              {parsed && actionsList.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  {/* Emoji de acción */}
                  <Typography
                    sx={{
                      fontSize: "2rem",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    📊
                  </Typography>
                  {/* Texto y lista de acciones */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Recommended Actions
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {actionsList.map((item, index) => (
                        <li
                          key={index}
                          // sanitiza y renderiza HTML (aquí tus <b> aparecerán en negrilla)
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}
                        />
                      ))}
                    </ul>
                  </Box>
                </Box>
              )}

              {!parsed && <Typography>No analysis available.</Typography>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} variant="contained" color="primary">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default CustomerProfile;
