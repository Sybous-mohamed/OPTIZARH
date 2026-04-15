import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // Ila makantch token, siffat l-user l-login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Ila kayna token, khallih ichouf l-pages (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;