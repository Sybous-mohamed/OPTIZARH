import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }) {
    const { darkMode, updateTheme } = useTheme();
    const { t } = useTranslation(['common']);
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [user, setUser] = useState({
        name: "Admin",
        role: "Super Admin",
        image: null
    });

    // ⭐ Redirection selon le rôle
    const handleProfileClick = () => {
        const role = localStorage.getItem('role');
        const routes = {
            superadmin: '/SuperAdmin/Parametres',
            admin: '/Admin/Parametres',
            rh: '/RH/Parametres',
            employee: '/Employee/Parametres'
        };
        navigate(routes[role] || '/');
    };

    // ⭐ Rôle title pour l'affichage
    const getRoleTitle = () => {
        const role = localStorage.getItem('role');
        const titles = {
            superadmin: 'Super Admin',
            admin: 'Administrateur',
            rh: 'Ressources Humaines',
            employee: 'Employé'
        };
        return titles[role] || 'Utilisateur';
    };

    const getInitials = (name) => {
        if (!name || name === "Chargement...") return "AD";
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const loadUserData = useCallback(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser({
                    name: parsedUser.full_name || "Admin",
                    role: getRoleTitle(),
                    image: parsedUser.profile_image || null
                });
            } catch (e) {
                console.error("Erreur f parsing dyal user data");
            }
        }
    }, []);

    useEffect(() => {
        loadUserData();
        window.addEventListener('userUpdated', loadUserData);
        return () => {
            window.removeEventListener('userUpdated', loadUserData);
        };
    }, [loadUserData]);

    const handleThemeToggle = useCallback(() => {
        const newTheme = darkMode ? 'light' : 'dark';
        updateTheme(newTheme);
    }, [darkMode, updateTheme, showNotification]);

    return (
        <header className={`h-16 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#2A2A2A] flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 z-30 transition-all duration-300 ${isMobile ? 'left-0' : 'left-[280px]'}`}>
            {/* Left section */}
            <div className="flex items-center gap-3 flex-1">
                {isMobile && (
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-all cursor-pointer">
                        <Menu size={20} />
                    </button>
                )}
                <div className="hidden sm:block flex-1 max-w-sm relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                        <Search size={18} />
                    </span>
                    <input type="text" placeholder={t('common:search')} 
                        className="w-full h-10 bg-gray-50 dark:bg-[#252525] border-none rounded-lg pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-200 transition-all"/>
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={handleThemeToggle}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-all cursor-pointer group"
                    title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
                >
                    {darkMode ? (
                        <Sun size={20} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
                    ) : (
                        <Moon size={20} className="group-hover:rotate-12 transition-transform" />
                    )}
                </button>

                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A1A]"></span>
                </button>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-[#2A2A2A] hidden sm:block"></div>

                {/* Profile Section */}
                <div onClick={handleProfileClick} className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                            {user.role}
                        </p>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-[#2A2A2A] shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                        {user.image ? (
                            <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-[11px]">
                                {getInitials(user.name)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}