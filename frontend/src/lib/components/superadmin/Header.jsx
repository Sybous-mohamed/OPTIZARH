import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Search, Menu, X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }) {
    const { darkMode, toggleDarkMode } = useTheme();
    const [user, setUser] = useState({
        name: "Chargement...",
        role: "Utilisateur"
    });

    useEffect(() => {
        const savedName = localStorage.getItem('user_name');
        const savedRole = localStorage.getItem('role');

        if (savedName || savedRole) {
            setUser({
                name: savedName || "Utilisateur",
                role: savedRole || "Personnel"
            });
        } else {
            const savedUserObj = localStorage.getItem('user');
            if (savedUserObj) {
                try {
                    const parsed = JSON.parse(savedUserObj);
                    setUser({
                        name: parsed.full_name || "Admin",
                        role: savedRole || "Super User"
                    });
                } catch (e) {
                    console.error("Error parsing user object");
                }
            }
        }
    }, []);

    const getInitials = (name) => {
        if (!name || name === "Chargement...")
            return "AD";
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <header className={`h-16 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md  border-b border-gray-100 dark:border-[#2A2A2A]  flex items-center justify-between px-4 md:px-6  fixed top-0 right-0 z-30 transition-all duration-300 ${isMobile ? 'left-0' : 'left-[280px]'}`}>
            {/* Left section */}
            <div className="flex items-center gap-3 flex-1">
                {/* Menu button - toujours visible sur mobile */}
                {isMobile && (
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-all cursor-pointer">
                        <Menu size={20} />
                    </button>
                )}

                {/* Search Bar - cachée sur très petit mobile */}
                <div className="hidden sm:block flex-1 max-w-sm relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                        <Search size={18} />
                    </span>
                    <input  type="text"  placeholder="Rechercher..." 
                        className="w-full h-10 bg-gray-50 dark:bg-[#252525] border-none rounded-lg pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-200 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"/>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Dark Mode Toggle */}
                <button onClick={toggleDarkMode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-all cursor-pointer"
                    title={darkMode ? "Mode clair" : "Mode sombre"}>
                    {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors relative cursor-pointer">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A1A]"></span>
                </button>

                {/* Separator */}
                <div className="h-8 w-[1px] bg-gray-100 dark:bg-[#2A2A2A] hidden sm:block"></div>

                {/* Profile Section */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    {/* User info */}
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                            {user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                            {user.role}
                        </p>
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-white dark:border-[#2A2A2A] shadow-sm flex items-center justify-center text-white font-bold text-xs md:text-[11px] group-hover:scale-105 transition-transform cursor-pointer">
                        {getInitials(user.name)}
                    </div>
                </div>
            </div>
        </header>
    );
}