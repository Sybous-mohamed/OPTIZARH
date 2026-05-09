import React, { useEffect, useState } from 'react';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Contexts & APIs
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

// SuperAdmin Components
import SuperAdminLayout from "../src/layout/SuperAdminLayout";
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

// Admin, RH, Employee Components (Hna fin kan l-erreur)
import AdminDashboard from './routes/Admin/Dashboard';
import RHDashboard from './routes/Rh/Dashboard';
import EmployeeDashboard from './routes/employee/Dashboard';

/* 
|--------------------------------------------------------------------------
| Protected Route: Kat-checki Token w Role
|--------------------------------------------------------------------------
*/
const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role')?.toLowerCase();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) return <Navigate to="/auth/login" replace />;
    if (role !== 'superadmin' && user.email_verified_at === null) {
        return <Navigate to="/auth/verify-notice" replace />;
    }
    
    if (user.must_change_password && window.location.pathname !== '/auth/change-password-first') {
        return <Navigate to="/auth/change-password-first" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

/* 
|--------------------------------------------------------------------------
| Public Route: Kat-mn3 li m-connecté i-arje3 l-login
|--------------------------------------------------------------------------
*/
const PublicRoute = ({ children, isFirstRun }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role')?.toLowerCase();
    const currentPath = window.location.pathname;

    if (isFirstRun && !currentPath.includes('setup')) {
        return <Navigate to="/auth/setup" replace />;
    }

    if (token && role) {
        const paths = {
            superadmin: "/SuperAdmin/Dashboard",
            admin: "/Admin/Dashboard",
            rh: "/RH/Dashboard",
            employee: "/Employee/Dashboard"
        };
        return <Navigate to={paths[role] || "/"} replace />;
    }
    return children;
};

function AppContent() {
    const { setLoading } = useLoading();
    const [isFirstRun, setIsFirstRun] = useState(null);

    useEffect(() => {
        attachLoadingHandler(setLoading);
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
    }, [setLoading]);

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
                {/* 1. Logic Home */}
                <Route path="/" element={isFirstRun ? <Navigate to="/auth/setup" replace /> : <Navigate to="/auth/login" replace />} />

                {/* 2. Auth Routes (RoleSelection & Register t-ms-ho) */}
                <Route path="/auth">
                    <Route index element={<Navigate to="/auth/login" replace />} />
                    <Route path="setup" element={isFirstRun ? <SuperAdminRegister /> : <Navigate to="/auth/login" replace />} />
                    <Route path="login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />
                    <Route path="forgot-password" element={<PublicRoute isFirstRun={isFirstRun}><ForgotPassword /></PublicRoute>} />
                    <Route path="reset-password/:token" element={<ResetPassword />} />
                    <Route path="verify-notice" element={<VerifyNotice />} />
                    <Route path="verify-email" element={<VerifyEmail />} />
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    <Route path="change-password-first" element={<ChangePasswordFirst />} />
                </Route>

                {/* 3. SuperAdmin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                    <Route path="/SuperAdmin" element={<SuperAdminLayout />}>
                        <Route index element={<Navigate to="/SuperAdmin/Dashboard" replace />} />
                        <Route path="Dashboard" element={<SuperAdminDashboard />} />
                        <Route path="Users" element={<Users/>}/>
                        <Route path="Parametrages">
                            <Route index element={<Parametrages />} />
                            <Route path="GestionEtat" element={<GestionEtat/>}/>
                            <Route path="GestionIndemenitee" element={<GestionIndemenitee/>} />
                            <Route path="GestionCotisation" element={<GestionCotisation/>} />
                            <Route path="GestionRCAR" element={<GestionRCAR/>} />
                            <Route path="GesionIR" element={<IRGestion/>}/>
                            <Route path="GestionCredit" element={<GestionCredit/>}/>
                            <Route path="GestionSNTL" element={<GestionSNTL />} />
                        </Route>
                        <Route path="affichageIndementes" element={<Indemente/>} />
                        <Route path="Cotisation" element={<Cotisation/>} />
                        <Route path="RCAR" element={<RCAR/>} />
                        <Route path="IRAffichage" element={<IRAffichage/>}/>
                        <Route path="Retraite" element={<Retraite/>} />
                        <Route path="SNTL" element={<SNTL/>} />
                        <Route path="assurances" element={<AssuranceManagement />} />
                        <Route path="Logs" element={<Logs/>}/>
                        <Route path="Parametres" element={<Parametres/>}/>
                    </Route>
                </Route>

                {/* 4. Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/Admin">
                        <Route index element={<Navigate to="/Admin/Dashboard" replace />} />
                        <Route path="Dashboard" element={<AdminDashboard />} />
                    </Route>
                </Route>

                {/* 5. RH Routes */}
                <Route element={<ProtectedRoute allowedRoles={['rh']} />}>
                    <Route path="/RH">
                        <Route index element={<Navigate to="/RH/Dashboard" replace />} />
                        <Route path="Dashboard" element={<RHDashboard />} />
                    </Route>
                </Route>

                {/* 6. Employee Routes */}
                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                    <Route path="/Employee">
                        <Route index element={<Navigate to="/Employee/Dashboard" replace />} />
                        <Route path="Dashboard" element={<EmployeeDashboard />} />
                    </Route>
                </Route>

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