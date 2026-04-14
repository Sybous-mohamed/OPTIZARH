import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { superAdminApi } from './lib/apis/superadmin';

// Imports dial les routes
import Login from './routes/auth/login';
import RoleSelection from './routes/auth/RoleSelection';
import Register from './routes/auth/Register';
import SuperAdminRegister from './routes/superadmin/SuperAdminRegister'; 
import SuperAdminDashboard from './routes/superadmin/Dashboard'; 
import AdminDashboard from './routes/Admin/Dashboard';
import RHDashboard from './routes/Rh/Dashboard';
import EmployeeDashboard from './routes/employee/Dashboard';

import SuperAdminLayout from '../src/layout/SuperAdminLayout'; 

// --- 1. Guard l-m-modified (Outlet) ---
const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
    
    // Outlet darori hna bach i-khedmo l-Nested Routes
    return <Outlet />; 
};

// --- 2. Public Guard (bqa kifma houwa) ---
const PublicRoute = ({ children, isFirstRun }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (isFirstRun) return children;
    if (token) {
        const paths = {
            superadmin: "/superadmin/dashboard",
            admin: "/admin/dashboard",
            rh: "/rh/dashboard",
            employee: "/employee/dashboard"
        };
        return <Navigate to={paths[role] || "/login"} replace />;
    }
    return children;
};

function App() {
    const [isFirstRun, setIsFirstRun] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await superAdminApi.checkSetup();
                setIsFirstRun(!res.data.isInitialized);
            } catch (error) {
                console.error("Erreur de connexion:", error);
                setIsFirstRun(false); 
            }
        };
        checkStatus();
    }, []);

    if (isFirstRun === null) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    isFirstRun ? <Navigate to="/superadmin/setup" replace /> : <Navigate to="/login" replace />
                } />

                <Route path="/superadmin/setup" element={<PublicRoute isFirstRun={isFirstRun}><SuperAdminRegister /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute isFirstRun={isFirstRun}><RoleSelection /></PublicRoute>} />
                <Route path="/register/:role" element={<PublicRoute isFirstRun={isFirstRun}><Register /></PublicRoute>} />

                <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                    <Route element={<SuperAdminLayout />}>
                        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

                    </Route>
                </Route>

                {/* --- Admin Group --- */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>

                {/* --- RH Group --- */}
                <Route element={<ProtectedRoute allowedRoles={['rh']} />}>
                    <Route path="/rh/dashboard" element={<RHDashboard />} />
                </Route>

                {/* --- Employee Group --- */}
                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                    <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;