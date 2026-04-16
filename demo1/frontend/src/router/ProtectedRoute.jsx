import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const isAuthenticated = document.cookie.includes('XSRF-TOKEN'); 
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}