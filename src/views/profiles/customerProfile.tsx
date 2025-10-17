import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    TableContainer,
} from "@mui/material";
import { Grid2 as Grid } from "@mui/material";
import PieCharReasonDeparture from "src/components/dashboard/pieCharReasonDeparture";
import PieChartCommonVariables from "src/components/dashboard/pieChartCommonVariables";
import BaseCard from "src/components/BaseCard/BaseCard";


const CustomerProfile = () => {
    return (
        <>  
            <Box mb={3}>
                <BaseCard
                    title={
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="h5">Customer Name</Typography>                           
                        </Box>
                    }
                >
                
                </BaseCard>
            </Box>

            <Box mb={3}>
                <BaseCard
                    title={
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="h5">Overview of the analysis prediction</Typography>
                            {/*
                            <Button
                                variant="contained"
                                color="success" // Cambia a verde
                                size="small"
                                onClick={handleDownloadExcel}
                                sx={{ ml: 2, minWidth: 140 }} // Margen izquierdo y ancho mínimo opcional
                            >
                                Download Excel
                            </Button>
                            */}
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
                                    <TableCell><Typography fontWeight={600} color="success.main">{0}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={600} color="warning.main">{0}</Typography></TableCell>
                                    <TableCell><Typography fontWeight={600} color="error.main">{0}</Typography></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </BaseCard>
            </Box>

            <Box mb={3}>
                <BaseCard title={
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                        <Typography variant="h5">aqui va el search</Typography>
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
                                {/*
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
                                */}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </BaseCard>
            </Box>

            <Box mb={3}>
                <Grid container spacing={2}>                    
                    <Grid
                        size={{
                            xs: 12,
                            lg: 6
                        }}>
                        <PieCharReasonDeparture />
                    </Grid>
                    <Grid
                        size={{
                            xs: 12,
                            lg: 6
                        }}>
                        <PieChartCommonVariables />
                    </Grid>                      
                </Grid>
            </Box>        
        </>
    );
};

export default CustomerProfile;