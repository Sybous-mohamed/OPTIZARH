import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { superAdminApi } from './lib/apis/superadmin';

// Imports Components
import Login from './routes/auth/login';
import RoleSelection from './routes/auth/RoleSelection';
import Register from './routes/auth/Register';
import SuperAdminRegister from './routes/superadmin/SuperAdminRegister'; 

import SuperAdminDashboard from './routes/superadmin/Dashboard'; 
import Users from  './routes/superadmin/users';

import AdminDashboard from './routes/Admin/Dashboard';
import RHDashboard from './routes/Rh/Dashboard';
import EmployeeDashboard from './routes/employee/Dashboard';
import SuperAdminLayout from '../src/layout/SuperAdminLayout'; 

// --- 1. ProtectedRoute: K-t-7mi l-dashboards ---
const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) return <Navigate to="/auth/login" replace />;
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
    
    return <Outlet />; 
};

// --- 2. PublicRoute: K-t-mne3 l-user authenticated y-chouf l-login ---
const PublicRoute = ({ children, isFirstRun }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Ila dāz setup o l-user 7awel y-dkhel l-chi 7aja fiha "setup", rj3o l-login
    if (!isFirstRun && window.location.pathname.includes('setup')) {
        return <Navigate to="/auth/login" replace />;
    }

    if (token) {
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

function App() {
    const [isFirstRun, setIsFirstRun] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await superAdminApi.checkSetup();
                // isInitialized = true ya3ni setup dāz
                setIsFirstRun(!res.data.isInitialized);
            } catch (error) {
                console.error("Connection error:", error);
                setIsFirstRun(false); 
            }
        };
        checkStatus();
    }, []);

    // Loading screen 7ta i-jawéb l-backend
    if (isFirstRun === null) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* --- Logic Root (/) --- */}
                <Route path="/" element={
                    isFirstRun ? <Navigate to="/auth/setup" replace /> : <Navigate to="/auth/login" replace />
                } />

                {/* --- Auth Group (/auth/...) --- */}
                <Route path="/auth">
                    {/* Redirect /auth direct l /auth/login bach ma-tb9ach page bida */}
                    <Route index element={<Navigate to="/auth/login" replace />} />
                    
                    <Route path="setup" element={
                        isFirstRun ? <SuperAdminRegister /> : <Navigate to="/auth/login" replace />
                    } />
                    
                    <Route path="login" element={<PublicRoute isFirstRun={isFirstRun}><Login /></PublicRoute>} />
                    <Route path="register" element={<PublicRoute isFirstRun={isFirstRun}><RoleSelection /></PublicRoute>} />
                    <Route path="register/:role" element={<PublicRoute isFirstRun={isFirstRun}><Register /></PublicRoute>} />
                    
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                </Route>

                {/* --- SuperAdmin Group (/SuperAdmin/...) --- */}
                <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                    <Route path="/SuperAdmin" element={<SuperAdminLayout />}>
                        <Route index element={<Navigate to="/SuperAdmin/Dashboard" replace />} />
                        <Route path="Dashboard" element={<SuperAdminDashboard />} />
                        <Route path="Users" element={<Users/>}/>

                        {/* <Route path="" element={<Su />} />
                        <Route path="" element={<Us/>}/>
                        <Route path="" element={<SuperAdminDashboard />} />
                        <Route path="" element={<Users/>}/>
                        <Route path="" element={<SuperAdminDashboard />} />
                        <Route path="" element={<Users/>}/>
                        <Route path="" element={<SuperAdminDashboard />} />
                        <Route path="" element={<Users/>}/>
                        <Route path="" element={<SuperAdminDashboard />} />
                        <Route path="" element={<Users/>}/>
                         */}
                    </Route>
                </Route>

                {/* --- Admin Group (/Admin/...) --- */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/Admin">
                        <Route index element={<Navigate to="/Admin/Dashboard" replace />} />
                        <Route path="Dashboard" element={<AdminDashboard />} />
                    </Route>
                </Route>

                {/* --- RH Group (/RH/...) --- */}
                <Route element={<ProtectedRoute allowedRoles={['rh']} />}>
                    <Route path="/RH">
                        <Route index element={<Navigate to="/RH/Dashboard" replace />} />
                        <Route path="Dashboard" element={<RHDashboard />} />
                    </Route>
                </Route>

                {/* --- Employee Group (/Employee/...) --- */}
                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                    <Route path="/Employee">
                        <Route index element={<Navigate to="/Employee/Dashboard" replace />} />
                        <Route path="Dashboard" element={<EmployeeDashboard />} />
                    </Route>
                </Route>

                {/* --- Global Catch-all: Ayy route ma-m3roufach trj3o l / --- */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;