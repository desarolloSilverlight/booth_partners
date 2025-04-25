import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
    const { token, loading } = useAuth();

    if (loading) return null; // Puedes poner un spinner si quieres

    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
