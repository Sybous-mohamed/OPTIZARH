import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { superAdminApi } from './lib/apis/superadmin';
import { attachLoadingHandler } from "./lib/apis/axiosConfig";

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider, useLoading } from "./context/LoadingContext";

// Auth Components
import Login from './routes/auth/login';
import RoleSelection from './routes/auth/RoleSelection';
import Register from './routes/auth/Register';
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
    import GestionCredit from './routes/superadmin/Credit'; //
    import SNTL from "./routes/superadmin/Prametrages/SNTL";
import Indemente from "./routes/superadmin/AffichageIndementes";
import Cotisation from "./routes/superadmin/Cotisation";//
import RCAR from "./routes/superadmin/RCAR";//
import IRAffichage from "./routes/superadmin/IRAffichage";
import Credit from "./routes/superadmin/Credit";//
import Retraite from "./routes/superadmin/Retraite";
import AssuranceManagement from './routes/superadmin/AssuranceManagement';//


import Logs from "./routes/superadmin/Logs";
import Parametres from './routes/superadmin/Settings'//








//Admin Components
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

                    {/* 2.Auth Routes */}
                    <Route path="/auth">
                        <Route index element={<Navigate to="/auth/login" replace />} />
                        <Route path="setup" element={isFirstRun ? <SuperAdminRegister /> : <Navigate to="/auth/login" replace />} />
                        <Route path="login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />
                        <Route path="register" element={<PublicRoute isFirstRun={isFirstRun}><RoleSelection /></PublicRoute>} />
                        <Route path="register/:role" element={<PublicRoute isFirstRun={isFirstRun}><Register /></PublicRoute>} />
                        <Route path="forgot-password" element={<PublicRoute isFirstRun={isFirstRun}><ForgotPassword /></PublicRoute>} />
                        <Route path="reset-password/:token" element={<ResetPassword />} />
                        <Route path="verify-notice" element={<VerifyNotice />} />
                        <Route path="verify-email" element={<VerifyEmail />} />
                        <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    </Route>

                    {/* SuperAdmin */}
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
                                <Route path="SNTL" element={<SNTL />} />
                            </Route>
                            <Route path="affichageIndementes" element={<Indemente/>} />
                            <Route path="Cotisation" element={<Cotisation/>} />
                            <Route path="RCAR" element={<RCAR/>} />
                            <Route path="IRAffichage" element={<IRAffichage/>}/>
                            <Route path="Credit" element={<Credit />} />
                            <Route path="Retraite" element={<Retraite/>} />
                            <Route path="assurances" element={<AssuranceManagement />} />
                            

                            <Route path="Logs" element={<Logs/>}/>
                            <Route path="Parametres" element={<Parametres/>}/>
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
    );
}

export default function App(){
    return(
         <AuthProvider>
            <ThemeProvider>
                <LoadingProvider>
                    <AppContent />
                </LoadingProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}