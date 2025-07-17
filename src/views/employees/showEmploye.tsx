import React, { use } from "react";
import {
    TextField,
    FormControlLabel,
    Checkbox,
    Button,
} from "@mui/material";
import BaseCard from "src/components/BaseCard/BaseCard";
import { useNavigate, useParams } from "react-router";
import config from "src/config/config";
import { useEffect, useState } from "react";

interface Employee {
    id: string;
    full_name: string;
    gender: string;
    birthday: string;
    civil_status: string;
    nationality: string;
    active_since: string;
    active_until: string;
    status: string;
    pbg: string;
    document_type: string;
    document_number: string;

    edad: string;
    region: string;
    district: string;
    education_level: string;
    health_company: string;

    tiempoEmpresa: string;
    tiempoCargo: string;
    type_of_contract: string;
    regular_hours: string;

    role_name: string;
    role_description: string;

    days?: string[];
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
            setLoading(false);
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("auth_token", config.tokenApiBuk);

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        fetch(`${config.rutaApiBuk}employees/${id}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                console.log(result);
                setEmployee(result.data);
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
                        defaultValue={employee?.id}
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
                        label="Edad"
                        variant="outlined"
                        defaultValue={employee?.edad}
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
                        id="employee-district"
                        label="District"
                        variant="outlined"
                        defaultValue={employee?.district}
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
                        id="employee-health-company"
                        label="Health Company"
                        variant="outlined"
                        defaultValue={employee?.health_company}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        id="employee-motivo-retiro"
                        label="Motivo Retiro"
                        variant="outlined"
                        multiline
                        rows={4} // o la cantidad que desees
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        fullWidth
                    >
                        Guardar
                    </Button>
                </form>
            </BaseCard>
        </div>
    );

};

export default showEmploye;