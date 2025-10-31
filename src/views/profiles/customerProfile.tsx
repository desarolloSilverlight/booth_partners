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
import JobSatisfactionCustomer from "src/components/dashboard/jobSatifationCustomer";
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
  // Job Satisfaction aggregation for table
  const [jobSatCounts, setJobSatCounts] = useState({ Positive: 0, Negative: 0, Neutral: 0, NoComment: 0 });
  const jobSatTotal = jobSatCounts.Positive + jobSatCounts.Negative + jobSatCounts.Neutral + jobSatCounts.NoComment;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Predictive_Analysis | null>(null);
  const [employeeSalaryLevel, setEmployeeSalaryLevel] = useState<string | null>(null);

  // Helper: formatea nombres de variables (quita num__/cat__, reemplaza '_' y Title Case)
  const prettyLabel = (raw: string): string => {
    if (!raw) return raw;
    let t = raw.replace(/^(num__|cat__)/, "");
    t = t.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    // Title Case básico
    t = t
      .split(" ")
      .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
    return t;
  };

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
            variable: prettyLabel(item.shap_variable_name),
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

    // Fetch Job Satisfaction by customer for the right-side table (best effort)
    fetch(`${config.rutaApi}show_satisfaction_job`, requestOptions)
      .then((response) => {
        if (response.status === 401) return handleUnauthorized();
        return response.json();
      })
      .then((res) => {
        const counts = { Positive: 0, Negative: 0, Neutral: 0, NoComment: 0 } as typeof jobSatCounts;
        const arr: any[] = Array.isArray(res) ? res : (res?.data ?? res?.dataEmployees ?? res?.dataSatisfaction ?? res?.list ?? []);
        if (Array.isArray(arr)) {
          arr.forEach((emp: any) => {
            try {
              const raw = emp?.calification ?? "";
              if (!raw || typeof raw !== 'string') { counts.NoComment += 1; return; }
              const fixed = raw.replace(/'/g, '"');
              const obj = JSON.parse(fixed);
              let nivel: string = obj?.Nivel ?? '';
              if (nivel === 'Positivo') nivel = 'Positive';
              if (nivel === 'Negativo') nivel = 'Negative';
              if (nivel === 'Neutro') nivel = 'Neutral';
              if (/no\s*comment/i.test(nivel) || /no\s*comments\s*to\s*analyze/i.test(nivel)) nivel = 'No comment';
              if (nivel === 'No comment') counts.NoComment += 1;
              else if (nivel === 'Positive') counts.Positive += 1;
              else if (nivel === 'Negative') counts.Negative += 1;
              else if (nivel === 'Neutral') counts.Neutral += 1;
              else counts.NoComment += 1;
            } catch { counts.NoComment += 1; }
          });
        }
        setJobSatCounts(counts);
      })
      .catch((error) => {
        console.error('Error fetching job satisfaction:', error);
      });

  }, [nameCustomer, navigate]);

  // Fallback: derive Job Satisfaction counts from predictive_analitics if API is empty/unavailable
  useEffect(() => {
    const anyFromApi = jobSatCounts.Positive + jobSatCounts.Negative + jobSatCounts.Neutral + jobSatCounts.NoComment;
    if (anyFromApi > 0) return; // already have API counts
    if (!predictive_analitics || predictive_analitics.length === 0) return;
    const counts = { Positive: 0, Negative: 0, Neutral: 0, NoComment: 0 };
    predictive_analitics.forEach((it) => {
      let nivel = (it.calification || '').trim();
      if (!nivel) { counts.NoComment += 1; return; }
      if (/^positive$/i.test(nivel) || /^positivo$/i.test(nivel)) counts.Positive += 1;
      else if (/^negative$/i.test(nivel) || /^negativo$/i.test(nivel)) counts.Negative += 1;
      else if (/^neutral$/i.test(nivel) || /^neutro$/i.test(nivel)) counts.Neutral += 1;
      else if (/no\s*comment/i.test(nivel) || /no\s*comments\s*to\s*analyze/i.test(nivel)) counts.NoComment += 1;
      else counts.NoComment += 1;
    });
    setJobSatCounts(counts);
  }, [predictive_analitics]);

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

    // Reset salary level and fetch from API using employee id (fkid_employe)
    setEmployeeSalaryLevel(null);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return handleUnauthorized();

      const myHeaders = new Headers();
      myHeaders.append("authToken", token);
      myHeaders.append("Content-Type", "application/json");

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({ id: employee.id }), // backend expects id from item.fkid_employe
        redirect: "follow",
      };

      fetch(`${config.rutaApi}employees_profile`, requestOptions)
        .then((response) => {
          if (response.status === 401) return handleUnauthorized();
          return response.json();
        })
        .then((result) => {
          const dataEmp = result?.dataEmployee;
          if (dataEmp) {
            // Try common property names
            const sl = dataEmp.salary_level ?? dataEmp.salaryLevel ?? null;
            setEmployeeSalaryLevel(sl);
          }
        })
        .catch((err) => {
          console.error("Error fetching employee profile:", err);
        });
    } catch (e) {
      console.error(e);
    }
  };

  // Generate a standalone PDF of the current modal (title + content) without buttons and without scroll truncation
  const handleGenerateModalPdf = async () => {
    try {
      if (!selectedEmployee) return;

      const printable = document.getElementById('modal-printable');
      if (!printable) {
        console.warn('Printable modal container not found');
        return;
      }

      // Clone the printable content and expand scrollable areas to capture full content
      const clone = printable.cloneNode(true) as HTMLElement;

      // Remove any elements marked as no-print inside the clone (safety)
      clone.querySelectorAll('.no-print').forEach((el) => el.parentElement?.removeChild(el));

      // Ensure DialogContent inside the clone expands fully
      const dc = clone.querySelector('.MuiDialogContent-root') as HTMLElement | null;
      if (dc) {
        dc.style.overflow = 'visible';
        (dc.style as any).maxHeight = 'none';
      }

      // Mount off-screen to render layout correctly
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      wrapper.style.background = '#ffffff';
      // Let content size itself; ensure enough width so chips/labels don't clip
      const measuredWidth = Math.max(printable.scrollWidth, Math.ceil(printable.getBoundingClientRect().width), 900);
      wrapper.style.width = measuredWidth + 'px';
      clone.style.width = '100%';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Render to canvas at high resolution and full dimensions
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });

      // Clean up the temporary DOM
      document.body.removeChild(wrapper);

      // Prepare PDF (A4 portrait) and paginate the long canvas if needed
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth; // fill the width
      const fullImgHeight = (canvas.height * imgWidth) / canvas.width;

      if (fullImgHeight <= pageHeight) {
        const img = canvas.toDataURL('image/png');
        pdf.addImage(img, 'PNG', 0, 0, imgWidth, fullImgHeight);
      } else {
        // Slice canvas into page-sized chunks (in px) preserving aspect ratio
        const pageHeightPx = Math.floor((canvas.width * pageHeight) / pageWidth);
        let sY = 0;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        const pageCtx = pageCanvas.getContext('2d');
        if (!pageCtx) throw new Error('Canvas context not available');

        while (sY < canvas.height) {
          const chunkHeight = Math.min(pageHeightPx, canvas.height - sY);
          pageCanvas.height = chunkHeight; // reset height each iteration
          // Clear background to white
          pageCtx.fillStyle = '#FFFFFF';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          // Draw portion from the big canvas
          pageCtx.drawImage(
            canvas,
            0,
            sY,
            canvas.width,
            chunkHeight,
            0,
            0,
            canvas.width,
            chunkHeight
          );

          const img = pageCanvas.toDataURL('image/png');
          const imgHeight = (chunkHeight * imgWidth) / canvas.width;
          pdf.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight);

          sY += chunkHeight;
          if (sY < canvas.height) pdf.addPage();
        }
      }

      const dayjs = (await import('dayjs')).default;
      const safeName = (selectedEmployee.fullName || 'Employee').replace(/[^a-z0-9-_]/gi, '_');
      const filename = `Attrition_Risk_Insights_${safeName}_${dayjs().format('YYYYMMDD')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating modal PDF', error);
      alert('Error generating PDF. Check console for details.');
    }
  };

  const riskCounts = {
    low: filtereredData.filter(item => item.clasification.toLowerCase().includes("low")).length,
    medium: filtereredData.filter(item => item.clasification.toLowerCase().includes("medium")).length,
    high: filtereredData.filter(item => item.clasification.toLowerCase().includes("high")).length,
  }

  // Total de empleados activos considerados en el conteo de riesgo
  const totalEmpleados = riskCounts.low + riskCounts.medium + riskCounts.high;

  // Total para calcular % en la tabla de SHAP
  const shapTotal = shapData.reduce((acc, it) => acc + (Number.isFinite(it.score) ? it.score : 0), 0);

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

  // Extract raw HTML sections from Recommended Actions to render in separate boxes
  const extractActionsSection = (html: string, labelPattern: RegExp) => {
    if (!html) return '';
    const match = html.match(labelPattern);
    if (!match || match.index === undefined) return '';
    const start = match.index + match[0].length;
    const rest = html.slice(start);
    const nextIdx = rest.search(/<b>\s*Controllable by\s+(?:the\s+Client|Client|Us)\s*:<\/b>/i);
    const section = nextIdx >= 0 ? rest.slice(0, nextIdx) : rest;
    return section.trim();
  };

  const actionsUsHtml = extractActionsSection(parsed?.actions || '', /<b>\s*Controllable by\s+Us\s*:<\/b>/i);
  const actionsClientHtml = extractActionsSection(parsed?.actions || '', /<b>\s*Controllable by\s+(?:the\s+Client|Client)\s*:<\/b>/i);

  const handleDownloadPdf = async () => {
    try {
      // Definición de páginas: cada sub-arreglo son elementos a ubicar en la misma página
      const pageDefs: string[][] = [
        ['pdf-shap'],
        ['job-satisfaction'],
        ['pdf-attrition-chart-1'],
        ['pdf-attrition-chart-2'],
        ['pdf-attrition-chart-3'],
        ['pdf-attrition-table'],
        ['pdf-risk-count'],
        ['pdf-predictive-table'],
      ];

      // Crear PDF en horizontal A4
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let isFirstPage = true;

      const margin = 10;
      const gap = 6;

      const needsHeaderColor = (id: string) => (
        id === 'pdf-attrition-table' || id === 'pdf-risk-count' || id === 'pdf-predictive-table'
      );
      const applyTableHeadStyles = (root: HTMLElement, bg: string, color: string) => {
        const cells = root.querySelectorAll('thead th, thead td');
        cells.forEach((c: any) => {
          const cell = c as HTMLElement & { dataset: any };
          cell.dataset.prevBg = cell.style.backgroundColor || '';
          cell.dataset.prevColor = cell.style.color || '';
          cell.style.backgroundColor = bg;
          cell.style.color = color;
        });
      };
      const revertTableHeadStyles = (root: HTMLElement) => {
        const cells = root.querySelectorAll('thead th, thead td');
        cells.forEach((c: any) => {
          const cell = c as HTMLElement & { dataset: any };
          if (cell.dataset.prevBg !== undefined) cell.style.backgroundColor = cell.dataset.prevBg;
          if (cell.dataset.prevColor !== undefined) cell.style.color = cell.dataset.prevColor;
          delete cell.dataset.prevBg;
          delete cell.dataset.prevColor;
        });
      };


      const applyHideColumn = (root: HTMLElement, colIndex: number) => {
        const selector = `thead tr > *:nth-child(${colIndex}), tbody tr > *:nth-child(${colIndex})`;
        const cells = root.querySelectorAll(selector);
        cells.forEach((c: any) => {
          const cell = c as HTMLElement & { dataset: any };
          cell.dataset.prevDisplay = cell.style.display || '';
          cell.style.display = 'none';
        });
      };
      const revertHideColumn = (root: HTMLElement, colIndex: number) => {
        const selector = `thead tr > *:nth-child(${colIndex}), tbody tr > *:nth-child(${colIndex})`;
        const cells = root.querySelectorAll(selector);
        cells.forEach((c: any) => {
          const cell = c as HTMLElement & { dataset: any };
          if (cell.dataset.prevDisplay !== undefined) cell.style.display = cell.dataset.prevDisplay;
          delete cell.dataset.prevDisplay;
        });
      };

      // Helper: mostrar bloques solo-PDF (marcados dentro del contenedor) durante captura
      const showPdfOnlyBlocks = (root: HTMLElement) => {
        const blocks = root.querySelectorAll('[data-pdf-only="true"]') as NodeListOf<HTMLElement>;
        blocks.forEach((b) => {
          (b as any).dataset.prevDisplay = b.style.display || '';
          b.style.display = 'block';
        });
      };
      const hidePdfOnlyBlocks = (root: HTMLElement) => {
        const blocks = root.querySelectorAll('[data-pdf-only="true"]') as NodeListOf<HTMLElement>;
        blocks.forEach((b) => {
          const el = b as HTMLElement & { dataset: any };
          if (el.dataset.prevDisplay !== undefined) el.style.display = el.dataset.prevDisplay;
          delete el.dataset.prevDisplay;
        });
      };

      // Ocultar elementos marcados para ocultarse en PDF (e.g., tablas laterales duplicadas)
      const applyHideOnPdf = (root: HTMLElement) => {
        const nodes = root.querySelectorAll('[data-hide-on-pdf="true"]') as NodeListOf<HTMLElement>;
        nodes.forEach((n) => {
          (n as any).dataset.prevDisplay = n.style.display || '';
          n.style.display = 'none';
        });
      };
      const revertHideOnPdf = (root: HTMLElement) => {
        const nodes = root.querySelectorAll('[data-hide-on-pdf="true"]') as NodeListOf<HTMLElement>;
        nodes.forEach((n) => {
          const el = n as HTMLElement & { dataset: any };
          if (el.dataset.prevDisplay !== undefined) el.style.display = el.dataset.prevDisplay;
          delete el.dataset.prevDisplay;
        });
      };

      for (const group of pageDefs) {
        const elements = await Promise.all(
          group.map(async (id) => {
            const el = document.getElementById(id);
            if (!el) return null;

            if (needsHeaderColor(id)) {
              applyTableHeadStyles(el, '#0D4B3B', '#ffffff');
            }
            let hidCol = false;
            if (id === 'pdf-predictive-table') {
              applyHideColumn(el, 6);
              hidCol = true;
            }
            // Mostrar bloques solo-PDF dentro del contenedor (ej. total empleados en Risk Count)
            showPdfOnlyBlocks(el);
            // Ocultar elementos marcados para ocultar en PDF (evitar duplicados)
            applyHideOnPdf(el);
            const canvas = await html2canvas(el as HTMLElement, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              scrollY: -window.scrollY,
              ignoreElements: (node) => (node as HTMLElement)?.classList?.contains('no-print') || false,
            });
            if (needsHeaderColor(id)) {
              revertTableHeadStyles(el);
            }
            if (hidCol) {
              revertHideColumn(el, 6);
            }
            hidePdfOnlyBlocks(el);
            revertHideOnPdf(el);
            return { id, canvas, img: canvas.toDataURL('image/png') };
          })
        );

        const valid = elements.filter((e): e is { id: string; canvas: HTMLCanvasElement; img: string } => !!e);
        if (valid.length === 0) continue;

        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }

        if (valid.length === 1) {
          const { canvas, img } = valid[0];
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - margin * 2;
          const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
          const w = canvas.width * ratio;
          const h = canvas.height * ratio;
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;
          pdf.addImage(img, 'PNG', x, y, w, h);
        } else {
          // Distribuir verticalmente 2 bloques en la misma página con márgenes y gap
          const maxW = pageWidth - margin * 2;
          const scaledHeights = valid.map(({ canvas }) => canvas.height * (maxW / canvas.width));
          const totalH = scaledHeights.reduce((a, b) => a + b, 0);
          const availableH = pageHeight - margin * 2 - gap * (valid.length - 1);
          const scaleFactor = totalH > availableH ? availableH / totalH : 1;

          let yCursor = margin;
          for (let i = 0; i < valid.length; i++) {
            const { img, canvas } = valid[i];
            const w = maxW * scaleFactor;
            const h = scaledHeights[i] * scaleFactor;
            const x = margin + (maxW - w) / 2;
            pdf.addImage(img, 'PNG', x, yCursor, w, h);
            yCursor += h + (i < valid.length - 1 ? gap : 0);
          }
        }
      }


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
              <Box sx={{ flexShrink: 0 }}>
                <Button
                  className="no-print"
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

          {/* Página 1: Gráfica SHAP + Tabla */}
          <Box
            id="pdf-shap"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 2,
            }}
          >
            {/* Banner de título de la página 1 */}
            <Box sx={{
              position: 'relative',
              width: '100%',
              gridColumn: '1 / -1',
              mb: 2,
            }}>
              <Box sx={{
                backgroundColor: '#0D4B3B',
                color: '#ffffff',
                borderRadius: 1,
                px: 2,
                py: 1,
                textAlign: 'left',
              }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Report Profile {nameCustomer}
                </Typography>
              </Box>
            </Box>

            {/* Fila: gráfica y tabla */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'stretch',
                justifyContent: 'space-between',
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
                  minHeight: 200,
                  "& > *": {
                    width: "100% !important",
                    height: "100% !important",
                  },
                }}
              >
                <PieChartCommonVariables dataShap={nameCustomer} height={400} />
              </Box>

              {/* Derecha: tabla */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  minHeight: 400, // match chart height and avoid vertical centering gap
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
                    justifyContent: "flex-start", // place content at top to remove top blank space
                  }}
                >
                  <Table
                    aria-label="main table"
                    sx={{
                      whiteSpace: "nowrap",
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
                        <TableCell>VARIABLE</TableCell>
                        <TableCell>(%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shapData.length > 0 ? (
                        shapData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.variable}</TableCell>
                            <TableCell>{shapTotal > 0 ? `${((item.score / shapTotal) * 100).toFixed(1)}%` : '0.0%'}</TableCell>
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
            {/* cierre contenedor pdf-shap */}
          </Box>
        </BaseCard>
      </Box>

      {/* Job Satisfaction: chart + breakdown table */}
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
            </Box>
          }
        >

          {/* Job Satisfaction: Chart + Table */}
          <Box
            id="job-satisfaction"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 2,
            }}
          >
            {/* Título para pantalla y PDF */}
            <Box sx={{
              backgroundColor: '#0D4B3B',
              color: '#ffffff',
              borderRadius: 1,
              px: 2,
              py: 1,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Customer perspective on employees - {nameCustomer}
              </Typography>
            </Box>
            {/* Fila: gráfica y tabla */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'stretch',
                justifyContent: 'space-between',
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
                <JobSatisfactionCustomer dataShap={nameCustomer} height={300} countsOverride={jobSatCounts} />
              </Box>

              {/* Derecha: tabla */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  minHeight: 400, // match chart height and avoid vertical centering gap
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
                    justifyContent: "flex-start", // place content at top to remove top blank space
                  }}
                >
                  <Table
                    aria-label="job satisfaction table"
                    sx={{
                      whiteSpace: "nowrap",
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
                        <TableCell>CATEGORY</TableCell>
                        <TableCell>(%)</TableCell>
                        <TableCell>COUNT</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { label: 'Positive', color: '#589992', count: jobSatCounts.Positive },
                        { label: 'Negative', color: '#C9ADCD', count: jobSatCounts.Negative },
                        { label: 'Neutral', color: '#8581B5', count: jobSatCounts.Neutral },
                        { label: 'No comment', color: '#255C82', count: jobSatCounts.NoComment },
                      ].map((row, idx) => {
                        const pct = jobSatTotal > 0 ? ((row.count / jobSatTotal) * 100).toFixed(1) : '0.0';
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
                                {row.label}
                              </Box>
                            </TableCell>
                            <TableCell>{pct}%</TableCell>
                            <TableCell>{row.count}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
            {/* cierre contenedor pdf-shap */}
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
          {/* Contenedor principal: 3 gráficas arriba y tabla debajo */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Gráficas de Attrition */}
            <Box id="pdf-attrition-charts" sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box id="pdf-attrition-chart-1">
                <PieCharReasonDeparture
                  dataAttrition={nameCustomer}
                  fieldToAnalyzeProp="attrition_type"
                  showSelector={false}
                  height={460}
                  title="Attrition Type"
                  showTable
                  showPercentLabels={false}
                />
              </Box>
              <Box id="pdf-attrition-chart-2">
                <PieCharReasonDeparture
                  dataAttrition={nameCustomer}
                  fieldToAnalyzeProp="attrition_category"
                  showSelector={false}
                  height={460}
                  title="Attrition Category"
                  showTable
                  showPercentLabels={false}
                />
              </Box>
              <Box id="pdf-attrition-chart-3">
                <PieCharReasonDeparture
                  dataAttrition={nameCustomer}
                  fieldToAnalyzeProp="attrition_specific_reason"
                  showSelector={false}
                  height={460}
                  title="Attrition Reason"
                  showTable
                  showPercentLabels={false}
                  pdfFullTable
                />
              </Box>
            </Box>

            {/* Tabla debajo */}
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <TableContainer
                sx={{
                  boxShadow: "none",
                  border: "1px solid #eee",
                  borderRadius: 2,
                  width: "100%",
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
            {/* Tabla completa (todas las filas) SOLO para PDF, fuera de pantalla */}
            <Box
              sx={{
                position: 'fixed',
                left: '-10000px',
                top: 0,
                width: '1000px',
                bgcolor: '#fff',
                p: 1,
                zIndex: -1,
              }}
            >
              <TableContainer sx={{ boxShadow: 'none', border: '1px solid #eee', borderRadius: 2 }}>
                <Table id="pdf-attrition-table" aria-label="attrition table full" sx={{ whiteSpace: 'nowrap', minWidth: 600 }}>
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
                      attritionData.map((item, index) => (
                        <TableRow key={`full-${index}`}>
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.attrition_type}</TableCell>
                          <TableCell>{item.attrition_category}</TableCell>
                          <TableCell>{item.attrition_specific_reason}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary" textAlign="center">
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

      {/* Contenedor combinado para PDF: Risk Count + Predictive Attrition */}
      <Box id="pdf-risk-predictive" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Risk Count */}
        <Box mb={3}>
          <BaseCard
            title={
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    color: '#ffffff',
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#3A4752' }}>
                    Risk Count | Total employees analyzed: {totalEmpleados}
                  </Typography>
                </Box>
              </Box>
            }
          >
            <TableContainer id="pdf-risk-count">
              {/* Solo PDF: total de empleados analizados */}
              <Box data-pdf-only="true" sx={{ display: 'none', textAlign: 'right', px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3A4752' }}>
                  Total employees analyzed: {totalEmpleados}
                </Typography>
              </Box>
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

        {/* Predictive Attrition */}
        <Box mb={3}>
          <BaseCard title={
            <Box sx={{ width: '100%' }}>
              <Box
                sx={{
                  color: '#ffffff',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#3A4752' }}>
                  Predictive Attrition Analysis
                </Typography>
                {/* Ocultar en PDF */}
                <Box className="no-print">
                  <InputSearch
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                    placeholder="Analyzing ...."
                    width={{ xs: '100%', sm: 300, md: 400 }}
                  />
                </Box>
              </Box>
            </Box>
          }>
            <TableContainer id="pdf-predictive-table">
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
                          className="no-print"
                          size="small"
                          variant="contained"
                          sx={{
                            mt: 1,
                            backgroundColor: "#0D4B3B",
                            color: "#ffffff",
                            "&:hover": { backgroundColor: "#0a3d32" },
                          }}
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
      </Box>

      {/* Modal global */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {selectedEmployee && (
          <>
            {/* Printable area (title + content) */}
            <Box id="modal-printable">
              <DialogTitle sx={{ bgcolor: "#0D4B3B", color: "white", borderRadius: "8px 8px 0 0" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ATTRITION RISK INSIGHTS - {selectedEmployee.fullName}
                    </Typography>
                    <Chip
                      label={selectedEmployee.clasification}
                      color={
                        selectedEmployee.clasification.toLowerCase().includes("high") ? "error"
                          : selectedEmployee.clasification.toLowerCase().includes("medium") ? "warning"
                            : "success"
                      }
                      sx={{ ml: 1, flexShrink: 0 }}
                    />
                  </Box>
                </Box>
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
                    {/* Salary level (sección separada con mayor espacio arriba) */}
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: "2rem", mb: 1 }}>💲</Typography>
                      <Typography variant="body1" fontWeight="bold" align="center">
                        {employeeSalaryLevel ?? "N/A"}
                      </Typography>
                    </Box>
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

                {/* Recommended Actions: split into two boxes with spacing */}
                {parsed && (actionsUsHtml || actionsClientHtml || actionsList.length > 0) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    {actionsUsHtml && (
                      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ fontSize: '2rem', flexShrink: 0, display: 'flex', alignItems: 'center' }}>🛠️</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                            Controllable by Us
                          </Typography>
                          <Box
                            sx={{ whiteSpace: 'pre-line' }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actionsUsHtml) }}
                          />
                        </Box>
                      </Box>
                    )}
                    {actionsClientHtml && (
                      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ fontSize: '2rem', flexShrink: 0, display: 'flex', alignItems: 'center' }}>🤝</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                            Controllable by the Client
                          </Typography>
                          <Box
                            sx={{ whiteSpace: 'pre-line' }}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actionsClientHtml) }}
                          />
                        </Box>
                      </Box>
                    )}
                    {!actionsUsHtml && !actionsClientHtml && actionsList.length > 0 && (
                      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Recommended Actions
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {actionsList.map((item, index) => (
                            <li key={index} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Box>
                )}

                {!parsed && <Typography>No analysis available.</Typography>}
              </DialogContent>
            </Box>
            <DialogActions sx={{ position: 'sticky', bottom: 0, bgcolor: '#fff', borderTop: '1px solid #eee', zIndex: 1 }}>
              <Button
                className="no-print"
                onClick={handleGenerateModalPdf}
                variant="contained"
                sx={{
                  backgroundColor: "#0D4B3B",
                  color: "#ffffff",
                  "&:hover": { backgroundColor: "#0a3d32" },
                }}
              >
                Generate PDF
              </Button>
              <Button
                className="no-print"
                onClick={handleClose}
                variant="contained"
                sx={{
                  backgroundColor: "#0D4B3B",
                  color: "#ffffff",
                  "&:hover": { backgroundColor: "#0a3d32" },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default CustomerProfile;
