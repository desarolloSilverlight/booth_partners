import React, { use } from "react";
import {
    TextField,
    FormControlLabel,
    Checkbox,
    Button,
    MenuItem,
    Autocomplete
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useNavigate, useParams } from "react-router";
import config from "src/config/config";
import { useEffect, useState } from "react";

interface Employee {
    id_employee: string;
    full_name: string;
    gender: string;
    birthday: string;
    civil_status: string;
    nationality: string;
    active_since: string;
    active_until: string;
    customer: string;
    status: string;
    pbg: string;
    document_type: string;
    document_number: string;
    age: string;
    region: string;
    type_of_contract: string;
    education_level: string;
    health_company: string;
    tiempoEmpresa: string;
    tiempoCargo: string;
    regular_hours: string;
    role_name: string;
    role_description: string;
    days?: string[];
    attrition_type: string;
    attrition_category: string;
    attrition_specific_reason: string;
    description_ia: string;

}

const showEmploye = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            console.error("Token not found");
            alert("Token defeated, enter again");
            navigate("/auth/login");
            setLoading(false);
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("authToken", token);
        myHeaders.append("Content-Type", "application/json");

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            redirect: "follow",
            body: JSON.stringify({ id }),
        };

        fetch(`${config.rutaApi}employees_profile`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                // console.log(result);
                setEmployee(result.dataEmployee);
            })
            .catch((error) => console.error("Error:", error))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div>
            <BaseCard title="Employee detail">
                <form>
                    <TextField
                        id="employee-id"
                        label="ID"
                        variant="outlined"
                        defaultValue={employee?.id_employee}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-full-name"
                        label="Full Name"
                        variant="outlined"
                        defaultValue={employee?.full_name}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-gender"
                        label="Gender"
                        variant="outlined"
                        defaultValue={employee?.gender}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-birthday"
                        label="Birthday"
                        variant="outlined"
                        defaultValue={employee?.birthday}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-civil-status"
                        label="Civil Status"
                        variant="outlined"
                        defaultValue={employee?.civil_status}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-nationality"
                        label="Nationality"
                        variant="outlined"
                        defaultValue={employee?.nationality}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-active-since"
                        label="Active Since"
                        variant="outlined"
                        defaultValue={employee?.active_since}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-active-until"
                        label="Active Until"
                        variant="outlined"
                        defaultValue={employee?.active_until}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-customer"
                        label="Customer"
                        variant="outlined"
                        defaultValue={employee?.customer}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-status"
                        label="Status"
                        variant="outlined"
                        defaultValue={employee?.status}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-document-type"
                        label="Document Type"
                        variant="outlined"
                        defaultValue={employee?.document_type}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-document-number"
                        label="Document Number"
                        variant="outlined"
                        defaultValue={employee?.document_number}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-age"
                        label="Age"
                        variant="outlined"
                        defaultValue={employee?.age}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-region"
                        label="Region"
                        variant="outlined"
                        defaultValue={employee?.region}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-type-of-conntract"
                        label="Type of Contract"
                        variant="outlined"
                        defaultValue={employee?.type_of_contract}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-education"
                        label="Education Level"
                        variant="outlined"
                        defaultValue={employee?.education_level}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-role-name"
                        label="Role Name"
                        variant="outlined"
                        defaultValue={employee?.role_name}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-attrition_type"
                        label="Attrition Type"
                        variant="outlined"
                        defaultValue={employee?.attrition_type}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-attrition_category"
                        label="Attrition Category"
                        variant="outlined"
                        defaultValue={employee?.attrition_category}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-attrtion-spesific-reasons"
                        label="Attrition Specific Reasons"
                        variant="outlined"
                        defaultValue={employee?.attrition_specific_reason}
                        multiline
                        rows={4} // o la cantidad que desees
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-attrition-possible-reasons"
                        label="Attrition Possible Reasons"
                        variant="outlined"
                        defaultValue={employee?.description_ia}
                        multiline
                        rows={4} // o la cantidad que desees
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                </form>
            </BaseCard>
        </div>
    );

};

export default showEmploye;