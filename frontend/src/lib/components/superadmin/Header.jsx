import React from 'react';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function Header() {
    const theme = useTheme();
    // Safety check bach may-trahch l-error f l-console
    const darkMode = theme?.darkMode;
    const toggleDarkMode = theme?.toggleDarkMode;

    return (
        <header className="h-14 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#262626] flex items-center justify-between px-6 fixed top-0 right-0 left-[240px] z-10 transition-colors duration-300">
            
            {/* Search Bar */}
            <div className="flex-1 max-w-sm relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={18} />
                </span>
                <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className="w-full h-10 bg-gray-50 dark:bg-[#1c1c1c] border-none rounded-lg pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-gray-200 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Dark Mode Toggle Button */}
                <button 
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition-all cursor-pointer"
                >
                    {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition-colors relative cursor-pointer">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#121212]"></span>
                </button>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-[#262626] mx-2"></div>

                {/* Profile Section */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Admin Principal</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">Super Utilisateur</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white dark:border-[#262626] shadow-sm flex items-center justify-center text-white font-bold text-xs group-hover:scale-105 transition-transform">
                        AP
                    </div>
                </div>
            </div>
        </header>
    );
}