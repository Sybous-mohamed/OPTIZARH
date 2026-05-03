import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
    const { darkMode } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
    useEffect(() => {
        if (isMobile && sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobile, sidebarOpen]);

    const handleSidebarLinkClick = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D0D] transition-colors duration-300">
            {/* Sidebar - 1ère partie (fixe à gauche) */}
            <div className={`
                fixed top-0 left-0 h-full z-50
                transition-transform duration-300 ease-in-out
                ${isMobile 
                    ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
                    : 'translate-x-0'
                }
            `}>
                <Sidebar onLinkClick={handleSidebarLinkClick} isMobile={isMobile} />
            </div>

            {/* Overlay pour mobile */}
            {isMobile && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 cursor-pointer"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Contenu principal (Header + Content) - 2ème et 3ème parties */}
            <div className={`
                transition-all duration-300
                ${!isMobile ? 'ml-[280px]' : 'ml-0'}
            `}>
                {/* Header - 2ème partie (fixe en haut) */}
                <div className="fixed top-0 right-0 left-0 z-30">
                    <Header 
                        sidebarOpen={sidebarOpen} 
                        setSidebarOpen={setSidebarOpen} 
                        isMobile={isMobile}
                    />
                </div>

                {/* Content - 3ème partie (scrollable) */}
                <main className="pt-14 min-h-screen">
                    <div className="p-4 md:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}