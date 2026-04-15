import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-[#F9FAFB]">
            <Sidebar />
            
            <div className="flex-1 ml-[240px] flex flex-col min-w-0">
                <Header />
                
                <main className="flex-1 p-8 mt-14">
                    {/* Hna fin kiban l-content dyal kol page */}
                    <div className="animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}