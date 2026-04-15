import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    // Hna khass t-kon 3ndk chi tariqa bach t-عرف wach l'user m'connecti
    // L-hal l-as-hal hwa t-chouf wach l-cookie dyal Laravel session kayn
    const isAuthenticated = document.cookie.includes('XSRF-TOKEN'); 

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}