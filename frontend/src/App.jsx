import React, { useEffect, useState } from 'react';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { superAdminApi } from './lib/apis/superadmin';
import { attachLoadingHandler } from "./lib/apis/axiosConfig";

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider, useLoading } from "./context/LoadingContext";

// Auth Components
import Login from './routes/auth/login';
import ChangePasswordFirst from './routes/auth/ChangePasswordFirst';
import SuperAdminRegister from './routes/superadmin/SuperAdminRegister'; 
import ForgotPassword from './routes/auth/ForgotPassword';
import ResetPassword from './routes/auth/ResetPassword';
import VerifyEmail from './routes/auth/VerifyEmail';
import VerifyNotice from './routes/auth/VerifyNotice';

// Layout
import Layout from './layout/Layout';

// SuperAdmin Components
import SuperAdminDashboard from "./routes/superadmin/Dashboard";
import Users from "./routes/superadmin/users";
import Parametrages from './routes/superadmin/Prametrages/Parmetrages';
import GestionEtat from "./routes/superadmin/Prametrages/GestionEtat";
import GestionIndemenitee from "./routes/superadmin/Prametrages/GestionIndementee";
import GestionCotisation from './routes/superadmin/Prametrages/Gestion_Cotisation';
import GestionRCAR from './routes/superadmin/Prametrages/Gestion_RCAR';
import IRGestion from "./routes/superadmin/Prametrages/GestionIR";
import GestionCredit from './routes/superadmin/Prametrages/GestionCredit'; 
import GestionSNTL from "./routes/superadmin/Prametrages/GestionSNTL";
import Indemente from "./routes/superadmin/AffichageIndementes";
import Cotisation from "./routes/superadmin/Cotisation";
import RCAR from "./routes/superadmin/RCAR";
import IRAffichage from "./routes/superadmin/IRAffichage";
import Retraite from "./routes/superadmin/Retraite";
import SNTL from './routes/superadmin/SNTL';
import AssuranceManagement from './routes/superadmin/AssuranceManagement';
import Logs from "./routes/superadmin/Logs";
import Parametres from './routes/superadmin/Parametres';

// Admin Components
import AdminDashboard from './routes/Admin/Dashboard';

// RH Components
import RHDashboard from './routes/Rh/Dashboard';

// Employee Components
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

    if (user.must_change_password && window.location.pathname !== '/auth/change-password-first') {
        return <Navigate to="/auth/change-password-first" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(role)) {
        const dashboards = {
            superadmin: "/SuperAdmin/Dashboard",
            admin: "/Admin/Dashboard",
            rh: "/RH/Dashboard",
            employee: "/Employee/Dashboard"
        };
        return <Navigate to={dashboards[role] || "/"} replace />;
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

    if (!token) {
        if (currentPath.includes('/auth/')) {
            return children;
        }
        return <Navigate to="/auth/login" replace />;
    }

    if (role !== 'superadmin' && user && !user.email_verified_at) {
        if (!currentPath.includes('/auth/verify')) {
            return <Navigate to="/auth/verify-notice" replace />;
        }
        return children;
    }

    if (token && role && currentPath.includes('/auth/')) {
        const paths = {
            superadmin: "/SuperAdmin/Dashboard",
            admin: "/Admin/Dashboard",
            rh: "/RH/Dashboard",
            employee: "/Employee/Dashboard"
        };
        return <Navigate to={paths[role] || "/auth/login"} replace />;
    }

    return children;
};

function AppContent() {
    const { setLoading } = useLoading();
    const [isFirstRun, setIsFirstRun] = useState(null);

    useEffect(() => {
        attachLoadingHandler(setLoading);
    }, [setLoading]);

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
            <div className="h-screen flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-t-2 border-blue-600 rounded-full"></div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={isFirstRun ? <Navigate to="/auth/setup" replace /> : <Navigate to="/auth/login" replace />} />

                {/* Auth Routes */}
                <Route path="/auth">
                    <Route index element={<Navigate to="/auth/login" replace />} />
                    <Route path="setup" element={isFirstRun ? <SuperAdminRegister /> : <Navigate to="/auth/login" replace />} />
                    <Route path="login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />
                    {/* <Route path="register" element={
                        <PublicRoute isFirstRun={isFirstRun}>
                            <RoleSelection />
                        </PublicRoute>
                    } />
                    <Route path="register/:role" element={
                        <PublicRoute isFirstRun={isFirstRun}>
                            <Register />
                        </PublicRoute>
                    } /> */}

                    <Route path="forgot-password" element={
                        <PublicRoute isFirstRun={isFirstRun}>
                            <ForgotPassword />
                        </PublicRoute>
                    } />
                    <Route path="reset-password/:token" element={<ResetPassword />} />
                    <Route path="verify-notice" element={<VerifyNotice />} />
                    <Route path="verify-email" element={<VerifyEmail />} />
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    <Route path="change-password-first" element={<ChangePasswordFirst />} />
                </Route>

                {/* SuperAdmin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                    <Route element={<Layout />}>
                        <Route path="/SuperAdmin/Dashboard" element={<SuperAdminDashboard />} />
                        <Route path="/SuperAdmin/Users" element={<Users />} />
                        <Route path="/SuperAdmin/Parametres" element={<Parametres />} />
                        <Route path="/SuperAdmin/Parametrages" element={<Parametrages />} />
                        <Route path="/SuperAdmin/Parametrages/GestionEtat" element={<GestionEtat />} />
                        <Route path="/SuperAdmin/Parametrages/GestionIndemenitee" element={<GestionIndemenitee />} />
                        <Route path="/SuperAdmin/Parametrages/GestionCotisation" element={<GestionCotisation />} />
                        <Route path="/SuperAdmin/Parametrages/GestionRCAR" element={<GestionRCAR />} />
                        <Route path="/SuperAdmin/Parametrages/GesionIR" element={<IRGestion />} />
                        <Route path="/SuperAdmin/Parametrages/GestionCredit" element={<GestionCredit />} />
                        <Route path="/SuperAdmin/Parametrages/GestionSNTL" element={<GestionSNTL />} />
                        <Route path="/SuperAdmin/AffichageIndementes" element={<Indemente />} />
                        <Route path="/SuperAdmin/Cotisation" element={<Cotisation />} />
                        <Route path="/SuperAdmin/RCAR" element={<RCAR />} />
                        <Route path="/SuperAdmin/IRAffichage" element={<IRAffichage />} />
                        <Route path="/SuperAdmin/Retraite" element={<Retraite />} />
                        <Route path="/SuperAdmin/SNTL" element={<SNTL />} />
                        <Route path="/SuperAdmin/assurances" element={<AssuranceManagement />} />
                        <Route path="/SuperAdmin/Logs" element={<Logs />} />
                    </Route>
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<Layout />}>
                        <Route path="/Admin/Dashboard" element={<AdminDashboard />} />
                    </Route>
                </Route>

                {/* RH Routes */}
                <Route element={<ProtectedRoute allowedRoles={['rh']} />}>
                    <Route element={<Layout />}>
                        <Route path="/RH/Dashboard" element={<RHDashboard />} />
                    </Route>
                </Route>

                {/* Employee Routes */}
                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                    <Route element={<Layout />}>
                        <Route path="/Employee/Dashboard" element={<EmployeeDashboard />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <LoadingProvider>
                    <I18nextProvider i18n={i18n}>
                        <AppContent />
                    </I18nextProvider>
                </LoadingProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}