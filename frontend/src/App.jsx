import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { superAdminApi } from './lib/apis/superadmin';

import { AuthProvider } from './context/AuthContext';

// Auth Components
import Login from './routes/auth/login';
import RoleSelection from './routes/auth/RoleSelection';
import Register from './routes/auth/Register';
import SuperAdminRegister from './routes/superadmin/SuperAdminRegister'; 
import ForgotPassword from './routes/auth/ForgotPassword';
import ResetPassword from './routes/auth/ResetPassword';
import VerifyEmail from './routes/auth/VerifyEmail';
import VerifyNotice from './routes/auth/VerifyNotice';


// SuperAdmin
import SuperAdminLayout from '../src/layout/SuperAdminLayout';
import SuperAdminDashboard from './routes/superadmin/Dashboard'; 
import Users from './routes/superadmin/users';
import RCAR from './routes/superadmin/ParametrageRCAR';
import Indemente from './routes/superadmin/Indementes'

//Admin 
import AdminDashboard from './routes/Admin/Dashboard';

// RH
import RHDashboard from './routes/Rh/Dashboard';

// Employee
import EmployeeDashboard from './routes/employee/Dashboard';

/*
|--------------------------------------------------------------------------
|                           Protected Route
|--------------------------------------------------------------------------
*/
const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) return <Navigate to="/auth/login" replace />;
    if (role !== 'superadmin' && user.email_verified_at === null) {
        return <Navigate to="/auth/verify-notice" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

/*
|--------------------------------------------------------------------------
|                            Public Route 
|--------------------------------------------------------------------------
*/
const PublicRoute = ({ children, isFirstRun }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentPath = window.location.pathname;

    if (isFirstRun && !currentPath.includes('setup')) {
        return <Navigate to="/auth/setup" replace />;
    }

    const isVerifyPage = currentPath.includes('verify-notice') || currentPath.includes('verify-email');
    if (isVerifyPage) {
        return children;
    }

    if (token && role && user && !user.email_verified_at && role !== 'superadmin') {
        if (currentPath.includes('login') || currentPath.includes('register')) {
            return <Navigate to="/auth/verify-notice" replace />;
        }
        return children;
    }

    if (token && role && (role === 'superadmin' || (user && user.email_verified_at))) {
        const paths = {
            superadmin: "/SuperAdmin/Dashboard",
            admin: "/Admin/Dashboard",
            rh: "/RH/Dashboard",
            employee: "/Employee/Dashboard"
        };

        if (currentPath.includes('/auth/')) {
             return <Navigate to={paths[role] || "/auth/login"} replace />;
        }
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
                console.error("Connection error:", error);
                setIsFirstRun(false); 
            }
        };
        checkStatus();
    }, []);

    if (isFirstRun === null) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <AuthProvider>

            <Router>
                <Routes>
                    {/* 1. Root logic */}
                    <Route path="/" element={
                        isFirstRun ? <Navigate to="/auth/setup" replace /> : <Navigate to="/auth/login" replace />
                    } />

                    {/* 2. Group dyal Auth Routes */}
                    <Route path="/auth">

                        <Route index element={<Navigate to="/auth/login" replace />} />
                        <Route path="setup" element={
                            isFirstRun ? <SuperAdminRegister /> : <Navigate to="/auth/login" replace />
                        } />

                        {/* Login: Public */}
                        <Route path="login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />

                        {/* Register  Public */}
                        <Route path="register" element={<PublicRoute isFirstRun={isFirstRun}><RoleSelection /></PublicRoute>} />
                        <Route path="register/:role" element={<PublicRoute isFirstRun={isFirstRun}><Register /></PublicRoute>} />
                        
                        {/* Forgot/Reset: Public */}
                        <Route path="forgot-password" element={<PublicRoute isFirstRun={isFirstRun}><ForgotPassword /></PublicRoute>} />
                        <Route path="reset-password/:token" element={<ResetPassword />} />

                        {/* Verification Pages*/}
                        <Route path="verify-notice" element={<VerifyNotice />} />
                        <Route path="verify-email" element={<VerifyEmail />} />

                        <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    </Route>

                    {/* 3. Protected Dashboards */}
                    {/* SuperAdmin */}
                    <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                        <Route path="/SuperAdmin" element={<SuperAdminLayout />}>
                            <Route index element={<Navigate to="/SuperAdmin/Dashboard" replace />} />
                            <Route path="Dashboard" element={<SuperAdminDashboard />} />
                            <Route path="Users" element={<Users/>}/>
                            <Route path="RCAR" element={<RCAR/>} />
                            <Route path="Indementes" element={<Indemente/>} />
                        </Route>
                    </Route>

                    {/* Admin */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/Admin">
                            <Route index element={<Navigate to="/Admin/Dashboard" replace />} />
                            <Route path="Dashboard" element={<AdminDashboard />} />
                        </Route>
                    </Route>

                    {/* RH */}
                    <Route element={<ProtectedRoute allowedRoles={['rh']} />}>
                        <Route path="/RH">
                            <Route index element={<Navigate to="/RH/Dashboard" replace />} />
                            <Route path="Dashboard" element={<RHDashboard />} />
                        </Route>
                    </Route>

                    {/* Employee */}
                    <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                        <Route path="/Employee">
                            <Route index element={<Navigate to="/Employee/Dashboard" replace />} />
                            <Route path="Dashboard" element={<EmployeeDashboard />} />
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;