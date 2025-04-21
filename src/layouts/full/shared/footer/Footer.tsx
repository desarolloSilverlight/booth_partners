'use client';
import { Box, Typography } from "@mui/material";
import { Link } from "react-router";

const Footer = () => {
    return (
        <Box sx={{ pt: 6, pb: 3, textAlign: "center" }}>
            <Typography>
                © {new Date().getFullYear()} Producto Desarrollado Por{" "}
                <Link to="https://silverlight.com.co/">
                    <Typography color='primary.main' component='span'>
                        Silverlight Colombia S.A.S</Typography>
                </Link>{" "}
            </Typography>
        </Box>
    );
};

export default Footer;
