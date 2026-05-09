import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Settings, Gift, PiggyBank, ShieldCheck, Percent, HandCoins, GraduationCap, 
  Hospital, Truck, LogOut, History, FileText, Calendar, Clock
} from "lucide-react";
import axiosClient from "../../apis/axiosConfig";
import { useTheme } from "../../../context/ThemeContext";

export default function Sidebar({ onLinkClick, isMobile }) {
    const location = useLocation();
    const active = location.pathname;
    const role = localStorage.getItem('role') || 'superadmin';
    const { darkMode } = useTheme();

    // ⭐ Navigation par rôle
    const navigation = {
        superadmin: {
            main: [
                { label: "Tableau de bord", icon: <LayoutDashboard size={20} />, path: "/SuperAdmin/Dashboard" },
                { label: "Paramétrages", icon: <Settings size={20} />, path: "/SuperAdmin/Parametrages" },
                { label: "Utilisateurs", icon: <Users size={20} />, path: "/SuperAdmin/users" },
                { label: "Indemnités", icon: <Gift size={20} />, path: "/SuperAdmin/AffichageIndementes" },
                { label: "Cotisation", icon: <PiggyBank size={20} />, path: "/SuperAdmin/Cotisation" },
                { label: "RCAR", icon: <ShieldCheck size={20} />, path: "/SuperAdmin/RCAR" },
                { label: "IR", icon: <Percent size={20} />, path: "/SuperAdmin/IRAffichage" },
                { label: "Retraite & Tamdid", icon: <GraduationCap size={20} />, path: "/SuperAdmin/Retraite" },
                { label: "Assurances", icon: <Hospital size={20} />, path: "/SuperAdmin/assurances" },
                { label: "SNTL", icon: <Truck size={20} />, path: "/SuperAdmin/SNTL" },
            ],
            admin: [
                { label: "Dashboard Admin", icon: <LayoutDashboard size={20} />, path: "/Admin/Dashboard" },
                { label: "Employés", icon: <Users size={20} />, path: "/Admin/Employees" },
                { label: "Présences", icon: <Calendar size={20} />, path: "/Admin/Presences" },
                { label: "Congés", icon: <Clock size={20} />, path: "/Admin/Conges" },
            ],
            rh: [
                { label: "Dashboard RH", icon: <LayoutDashboard size={20} />, path: "/RH/Dashboard" },
                { label: "Recrutement", icon: <Users size={20} />, path: "/RH/Recrutement" },
                { label: "Formation", icon: <GraduationCap size={20} />, path: "/RH/Formation" },
                { label: "Évaluations", icon: <FileText size={20} />, path: "/RH/Evaluations" },
            ],
            employee: [
                { label: "Mon Dashboard", icon: <LayoutDashboard size={20} />, path: "/Employee/Dashboard" },
                { label: "Mon Profil", icon: <Users size={20} />, path: "/Employee/Profil" },
                { label: "Mes Congés", icon: <Calendar size={20} />, path: "/Employee/Conges" },
                { label: "Mes Documents", icon: <FileText size={20} />, path: "/Employee/Documents" },
            ]
        },
        admin: {
            main: [
                { label: "Tableau de bord", icon: <LayoutDashboard size={20} />, path: "/Admin/Dashboard" },
                { label: "Employés", icon: <Users size={20} />, path: "/Admin/Employees" },
                { label: "Présences", icon: <Calendar size={20} />, path: "/Admin/Presences" },
                { label: "Congés", icon: <Clock size={20} />, path: "/Admin/Conges" },
                { label: "Paramètres", icon: <Settings size={20} />, path: "/Admin/Parametres" },
            ],
            admin: []
        },
        rh: {
            main: [
                { label: "Tableau de bord", icon: <LayoutDashboard size={20} />, path: "/RH/Dashboard" },
                { label: "Recrutement", icon: <Users size={20} />, path: "/RH/Recrutement" },
                { label: "Formation", icon: <GraduationCap size={20} />, path: "/RH/Formation" },
                { label: "Évaluations", icon: <FileText size={20} />, path: "/RH/Evaluations" },
                { label: "Paramètres", icon: <Settings size={20} />, path: "/RH/Parametres" },
            ],
            admin: []
        },
        employee: {
            main: [
                { label: "Mon Dashboard", icon: <LayoutDashboard size={20} />, path: "/Employee/Dashboard" },
                { label: "Mon Profil", icon: <Users size={20} />, path: "/Employee/Profil" },
                { label: "Mes Congés", icon: <Calendar size={20} />, path: "/Employee/Conges" },
                { label: "Mes Documents", icon: <FileText size={20} />, path: "/Employee/Documents" },
                { label: "Paramètres", icon: <Settings size={20} />, path: "/Employee/Parametres" },
            ],
            admin: []
        }
    };

    // ⭐ Récupérer les items selon le rôle
    const getNavItems = () => {
        if (role === 'superadmin') {
            return navigation.superadmin.main;
        } else if (role === 'admin') {
            return navigation.admin.main;
        } else if (role === 'rh') {
            return navigation.rh.main;
        } else if (role === 'employee') {
            return navigation.employee.main;
        }
        return [];
    };

    const getAdminItems = () => {
        if (role === 'superadmin') {
            return [
                { label: "Logs", icon: <History size={20} />, path: "/SuperAdmin/Logs" },
                { label: "Paramètres", icon: <Settings size={20} />, path: "/SuperAdmin/Parametres" },
            ];
        } else if (role === 'admin') {
            return [
                { label: "Paramètres", icon: <Settings size={20} />, path: "/Admin/Parametres" },
            ];
        } else if (role === 'rh') {
            return [
                { label: "Paramètres", icon: <Settings size={20} />, path: "/RH/Parametres" },
            ];
        } else if (role === 'employee') {
            return [
                { label: "Paramètres", icon: <Settings size={20} />, path: "/Employee/Parametres" },
            ];
        }
        return [];
    };

    const getRoleTitle = () => {
        switch(role) {
            case 'superadmin': return "SuperAdmin";
            case 'admin': return "Administrateur";
            case 'rh': return "Ressources Humaines";
            case 'employee': return "Employé";
            default: return "Utilisateur";
        }
    };

    const navItems = getNavItems();
    const adminItems = getAdminItems();

const handleLogout = async () => {
    try {
        await axiosClient.post("/logout");
    } catch (err) {
        console.error("Logout error:", err);
    } finally {
        // ⭐ Sauvegarder le thème avant de tout effacer
        const savedTheme = localStorage.getItem('theme');
        
        localStorage.clear();
        
        // ⭐ Restaurer le thème
        if (savedTheme) {
            localStorage.setItem('theme', savedTheme);
        }
        
        window.location.href = "/auth/login";
    }
};

    const handleLinkClick = () => {
        if (onLinkClick) {
            onLinkClick();
        }
    };

    return (
        <aside className={`
            w-[280px] bg-white dark:bg-[#1A1A1A] flex flex-col shadow-xl border-r border-gray-100 dark:border-[#2A2A2A]
            ${isMobile ? 'h-full overflow-y-auto' : 'h-screen overflow-hidden'}
        `}>
            {/* Logo Section */}
            <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M12 3v18M20 8l-8-5-8 5M20 16l-8 5-8-5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                            {getRoleTitle()}
                        </h1>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-1">
                            OptizaRH System
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className={`flex-1 overflow-y-auto py-4 px-3 ${!isMobile ? 'custom-scrollbar' : ''}`}>
                <div className="space-y-1.5">
                    {navItems.map((item) => {
                        const isItemActive = active === item.path || active.startsWith(item.path + "/");
                        return (
                            <NavItem 
                                key={item.path} 
                                item={item} 
                                isActive={isItemActive}
                                onClick={handleLinkClick}
                            />
                        );
                    })}
                </div>

                {adminItems.length > 0 && (
                    <>
                        <div className="px-4 mt-8 mb-4">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                Administration
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {adminItems.map((item) => (
                                <NavItem 
                                    key={item.path} 
                                    item={item} 
                                    isActive={active === item.path}
                                    onClick={handleLinkClick}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Footer - Logout */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-[#2A2A2A]">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group cursor-pointer"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}


function NavItem({ item, isActive, onClick }) {
    return (
        <Link
            to={item.path}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-gray-900 dark:hover:text-white"
            }`}>
            {isActive && (
                <div className="absolute left-0 w-1 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
            )}
            <span className={`${
                isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            }`}>
                {item.icon}
            </span>
            <span className="text-[14px]">{item.label}</span>
        </Link>
    );
}