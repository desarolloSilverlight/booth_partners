import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { SearchBarProps } from "./types";

const InputSearch = ({
    searchTerm,
    onSearchChange,
    onClearSearch,
    placeholder = "Buscar...",
    width = 300
}: SearchBarProps) => {
    return (
        <TextField
            size="small"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
                width: width,
                "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    backgroundColor: "background.paper",
                },
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
                endAdornment: searchTerm && (
                    <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={onClearSearch}
                            aria-label="Limpiar búsqueda"
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default InputSearch;