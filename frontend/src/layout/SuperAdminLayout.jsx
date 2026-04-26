import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
    const theme = useTheme();
    if (!theme) {
        return (
            <div className="flex min-h-screen bg-[#050505] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }
    return (
        <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 ml-[240px]">
                <Header />
                <main className="flex-1 overflow-y-auto" style={{ paddingTop: '56px' }}>
                    <div className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}