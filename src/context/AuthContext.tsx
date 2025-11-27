import React, { createContext, useState, useContext, useEffect } from "react";

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    loading: boolean;
    profile: number; // perfil actual en memoria
    setProfile: (p: number) => void;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    setToken: () => {},
    loading: true,
    profile: 0,
    setProfile: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfileState] = useState<number>(0);

    useEffect(() => {
        const storedToken = sessionStorage.getItem("token");
        if (storedToken) {
            setTokenState(storedToken);
        }
        setLoading(false);
    }, []);

    const setToken = (t: string | null) => {
        if (t) {
            sessionStorage.setItem("token", t);
        } else {
            sessionStorage.removeItem("token");
            // Reset perfil al cerrar sesión
            setProfileState(0);
        }
        setTokenState(t);
    };

    const setProfile = (p: number) => {
        setProfileState(Number(p) || 0);
    };

    return (
        <AuthContext.Provider value={{ token, setToken, loading, profile, setProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
