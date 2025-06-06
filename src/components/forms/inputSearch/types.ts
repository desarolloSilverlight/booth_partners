export interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onClearSearch: () => void;
    placeholder?: string;
    width?: number | string | {
        xs?: number | string;
        sm?: number | string;
        md?: number | string;       
    };
}