"use client";
import { Grid2 as Grid, Box } from "@mui/material";
import SalesOverview from "src/components/dashboard/TheSalesOverview";
import OurVisitors from "src/components/dashboard/TheOurVisitors";
import PieChart from "src/components/dashboard/pieChart";
import RadarChart from "src/components/dashboard/radarChart";
import { useNavigate } from "react-router";
//import ProfileCard from "src/components/dashboard/TheProfileCard";
//import ActivityTimeline from "src/components/dashboard/TheActivityTimeline";
//import MyContacts from "src/components/dashboard/TheMyContacts";


export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid
                    size={{
                        xs: 12,
                        lg: 8
                    }}>
                    <Box
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/employees/listEmployes")}
                    >
                        <SalesOverview />
                    </Box>

                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 4
                    }}>
                    <Box
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/predictive_analysis/predictive_analysis")}
                    >
                        <OurVisitors />
                    </Box>
                </Grid>

                {/*    
                <Grid
                    size={{
                        xs: 12,
                        lg: 8
                    }}>
                    <PieChart />
                </Grid>
                */}


                <Grid
                    size={{
                        xs: 12,
                        lg: 4
                    }}>
                    <RadarChart />
                </Grid>


                {/*        
                <Grid
                    size={{
                        xs: 12,
                        lg: 4
                    }}>
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <ProfileCard />
                        </Grid>
                        <Grid size={12}>
                            <MyContacts />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        lg: 8
                    }}>
                    <ActivityTimeline />
                </Grid>
                */}
            </Grid>
        </Box>
    );
}

