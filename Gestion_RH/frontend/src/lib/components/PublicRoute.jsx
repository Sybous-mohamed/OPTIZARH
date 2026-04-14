import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Ila deja m-logui, siffat l-dashboard dyalo direct
    if (token) {
        const redirectPath = role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;