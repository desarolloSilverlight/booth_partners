import React, { createContext, useState, useContext, useEffect } from "react";

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    setToken: () => {},
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = sessionStorage.getItem("token");
        if (storedToken) {
            setTokenState(storedToken);
        }
        setLoading(false);
    }, []);

    const setToken = (token: string | null) => {
        if (token) {
            sessionStorage.setItem("token", token);
        } else {
            sessionStorage.removeItem("token");
        }
        setTokenState(token);
    };

    return (
        <AuthContext.Provider value={{ token, setToken, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
