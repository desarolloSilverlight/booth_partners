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
  const { id } = useParams<{id: string}>();
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
                //console.log(result);
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
                        id="default-value-id"
                        label="Id Employee"
                        variant="outlined"
                        defaultValue={employee?.id}
                        fullWidth
                        sx={{
                            mb: 2,
                        }}                        
                    />
                    <TextField
                        id="default-value-name"
                        label="Full Name"
                        variant="outlined"
                        defaultValue={employee?.full_name}
                        fullWidth
                        sx={{
                            mb: 2,
                        }}                        
                    />
                    <TextField
                        id="default-value-gender"
                        label="Gender"
                        variant="outlined"
                        defaultValue={employee?.gender}
                        fullWidth
                        sx={{
                            mb: 2,
                        }}                        
                    />
                </form>
            </BaseCard>
        </div>
    );
};

export default showEmploye;