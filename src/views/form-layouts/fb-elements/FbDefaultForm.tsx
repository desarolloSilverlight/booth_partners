import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import config from "src/config/config";
import BaseCard from "../../../components/BaseCard/BaseCard";
import { useNavigate, useLocation } from "react-router-dom";

const FbDefaultForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertQueue, setAlertQueue] = useState<{ msg: string, severity: "info" | "success" | "error" }[]>([]);
  const [currentAlert, setCurrentAlert] = useState<{ msg: string, severity: "info" | "success" | "error" } | null>(null);

  const [userData, setUserData] = useState({
    id_userSystem: "",
    first_name: "",
    last_name: "",
    emailLog: "",
    passLog: "",
    contry: "",
    systemProfile: "",
    userStatus: "",
  });

  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem('username');
  if (!token) {
    navigate("/auth/login");
    return;
  }

  useEffect(() => {
    if (username) {
      fetch(`${config.rutaApi}data_user_system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authToken': token },
        body: JSON.stringify({ username }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.dataUser) setUserData(data.dataUser);
        });
    }
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${config.rutaApi}updata_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authToken': token },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        setAlertQueue(q => [...q, { msg: "Data saved successfully", severity: "success" }]);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setAlertQueue(q => [...q, { msg: "Error saving the data", severity: "error" }]);
      }
    } catch (error) {
      setAlertQueue(q => [...q, { msg: "Network error while saving", severity: "error" }]);
    }
  };

  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      setCurrentAlert(alertQueue[0]);
      setAlertQueue(q => q.slice(1));
    }
  }, [alertQueue, currentAlert]);

  const handleCloseAlert = () => {
    setCurrentAlert(null);
  };

  const passwordsMatch = userData.passLog === confirmPass;

  return (
    <div>
      <Snackbar
        open={!!currentAlert}
        autoHideDuration={2000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {currentAlert ? (
          <Alert
            onClose={handleCloseAlert}
            severity={currentAlert.severity}
            sx={{ width: '100%' }}
          >
            {currentAlert.msg}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>

      <BaseCard title="My Profile">
        <form>
          <TextField
            name="first_name"
            label="First Name"
            variant="outlined"
            value={userData.first_name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            name="last_name"
            label="Last Name"
            variant="outlined"
            value={userData.last_name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            name="emailLog"
            label="Email"
            type="email"
            variant="outlined"
            value={userData.emailLog}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            name="passLog"
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={userData.passLog}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            name="confirmPass"
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            variant="outlined"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            error={confirmPass.length > 0 && !passwordsMatch}
            helperText={
              confirmPass.length > 0 && !passwordsMatch
                ? "Passwords do not match"
                : ""
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((show) => !show)}
                    edge="end"
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            name="contry"
            label="Country"
            variant="outlined"
            value={userData.contry}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          {/* Puedes agregar más campos si lo necesitas */}
          <div>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: '#093828',
                '&:hover': {
                  backgroundColor: '#06281a'
                }
              }}
              disabled={!passwordsMatch || userData.passLog === ""}
            >
              Save
            </Button>
          </div>
        </form>
      </BaseCard>
    </div>
  );
};

export default FbDefaultForm;