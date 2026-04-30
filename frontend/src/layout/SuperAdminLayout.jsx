import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
    const { darkMode } = useTheme();
    
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#0D0D0D] transition-colors duration-300">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 ml-[260px]">
                <Header />
                <main className="flex-1 overflow-y-auto pt-14">
                    <div className="p-3">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}