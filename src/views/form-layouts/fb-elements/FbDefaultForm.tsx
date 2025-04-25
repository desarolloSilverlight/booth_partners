import React from "react";
import {

  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Grid2 as Grid,
  RadioGroup,
  Radio,
  FormControl,
  MenuItem,
} from "@mui/material";
import BaseCard from "../../../components/BaseCard/BaseCard";

const numbers = [
  {
    value: "1",
    label: "Enable",
  },
  {
    value: "2",
    label: "Disable",
  },
];

const FbDefaultForm = () => {
  const [state, setState] = React.useState({
    checkedA: false,
    checkedB: false,
    checkedC: false,
  });

  const handleChange = (event: any) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  const [value, setValue] = React.useState("");

  const handleChange2 = (event: any) => {
    setValue(event.target.value);
  };

  const [number, setNumber] = React.useState("");

  const handleChange3 = (event: any) => {
    setNumber(event.target.value);
  };

  return (
    <div>
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* Basic Checkbox */}
      {/* ------------------------------------------------------------------------------------------------ */}
      <BaseCard title="My Profile">
        <form>
          <TextField
            id="default-value"
            label="Full Name"
            variant="outlined"
            defaultValue="Andres Felipe Criales Cortes"
            fullWidth
            sx={{
              mb: 2,
            }}
          />
          <TextField
            id="email-text"
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            sx={{
              mb: 2,
            }}
          />
          <TextField
            id="outlined-password-input"
            label="Password"
            type="password"
            autoComplete="current-password"
            variant="outlined"
            fullWidth
            sx={{
              mb: 2,
            }}
          />
          <TextField
            id="profile-text"
            label="Profile"
            type="outlined"
            variant="outlined"
            fullWidth
            sx={{
              mb: 2,
            }}
          />
          <TextField
            fullWidth
            id="standard-select-number"
            variant="outlined"
            select
            label="User Status"
            value={number}
            onChange={handleChange3}
            sx={{
              mb: 2,
            }}
          >
            {numbers.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {/*
          <TextField
            id="outlined-multiline-static"
            label="Textarea"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            sx={{
              mb: 2,
            }}
          />          
          <TextField
            id="readonly-text"
            label="Read Only"
            defaultValue="Hello World"
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            variant="outlined"
            fullWidth
            sx={{
              mb: 2,
            }}
          />
          */}
          <Grid
            container
            spacing={0}
            sx={{
              mb: 2,
            }}
          >
            <Grid size={{ lg: 4, md: 6, sm: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.checkedA}
                    onChange={handleChange}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Full Access"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.checkedB}
                    onChange={handleChange}
                    name="checkedB"
                    color="primary"
                  />
                }
                label="Read"
              />
              {/*
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.checkedC}
                    onChange={handleChange}
                    name="checkedC"
                    color="primary"
                  />
                }
                label="Check this custom checkbox"
              />
              */}
            </Grid>
            {/*       
            <Grid size={{ lg: 4, md: 6, sm: 12 }}>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="gender"
                  name="gender1"
                  value={value}
                  onChange={handleChange2}
                >
                  <FormControlLabel
                    value="radio1"
                    control={<Radio />}
                    label="Toggle this custom radio"
                  />
                  <FormControlLabel
                    value="radio2"
                    control={<Radio />}
                    label="Toggle this custom radio"
                  />
                  <FormControlLabel
                    value="radio3"
                    control={<Radio />}
                    label="Toggle this custom radio"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            */}
          </Grid>
          <div>
            <Button color="error" variant="contained">
              Save
            </Button>
          </div>
        </form>
      </BaseCard>
    </div>
  );
};

export default FbDefaultForm;
