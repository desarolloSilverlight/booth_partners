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

import BaseCard from "src/components/BaseCard/BaseCard";


const products = [
  {
    id: "1",
    name: "Andres Criales",
    post: "Engineer Web Designer",
    pname: "Silverlight Colombia S.A.S",
    priority: "Activo",
    pbg: "success.main",
    budget: "3.9",
  },
  {
    id: "2",
    name: "Rodrigo Quintero",
    post: "Manager",
    pname: "Silverlight Colombia S.A.S",
    priority: "Activo",
    pbg: "success.main",
    budget: "24.5",
  },
  {
    id: "3",
    name: "Juan Chaparro",
    post: "Human Resources",
    pname: "Silverlight Colombia S.A.S",
    priority: "No Activo",
    pbg: "error.main",
    budget: "12.8",
  },
  /*{
    id: "4",
    name: "Nirav Joshi",
    post: "Frontend Engineer",
    pname: "Hosting Press HTML",
    priority: "Critical",
    pbg: "success.main",
    budget: "2.4",
  },*/
];

const BasicTable = () => {
  return (
    <BaseCard title="Empleados y Clientes">

      <TableContainer
        sx={{
          width: {
            xs: "274px",
            sm: "100%",
          },
        }}
      >
        <Table
          aria-label="simple table"
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle1">
                  No.
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1">
                  Job position and Name Employe
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1">
                  Customer
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1">
                  Status
                </Typography>
              </TableCell>
              {/*
              <TableCell align="right">
                <Typography variant="subtitle1">
                  Budget
                </Typography>
              </TableCell>
              */}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.name}>
                <TableCell>
                  <Typography fontSize="15px" fontWeight={500}>
                    {product.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Box>
                      <Typography fontSize="14px" fontWeight={600}>
                        {product.name}
                      </Typography>
                      <Typography color="textSecondary" fontSize="13px">
                        {product.post}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" fontSize="14px">
                    {product.pname}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    sx={{
                      pl: "4px",
                      pr: "4px",
                      backgroundColor: product.pbg,
                      color: "#fff",
                    }}
                    size="small"
                    label={product.priority}
                  ></Chip>
                </TableCell>
                {/*
                <TableCell align="right">
                  <Typography fontSize="14px">${product.budget}k</Typography>
                </TableCell>
                */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </BaseCard>

  );
};

export default BasicTable;
