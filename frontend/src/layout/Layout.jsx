import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
    const { darkMode, theme, updateTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

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

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const root = document.documentElement;
        
        if (savedTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            if (theme !== 'dark') {
                updateTheme('dark');
            }
        } else if (savedTheme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
            if (theme !== 'light') {
                updateTheme('light');
            }
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
            if (theme !== 'light') {
                updateTheme('light');
            }
        }
    }, [location.pathname, theme, updateTheme]);

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
        <div className={`min-h-screen ${darkMode ? 'dark:bg-black' : 'bg-gray-50'}`}>
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

            {isMobile && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 cursor-pointer"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`transition-all duration-300 ${!isMobile ? 'ml-[280px]' : 'ml-0'}`}>
                <div className="fixed top-0 right-0 left-0 z-30">
                    <Header 
                        sidebarOpen={sidebarOpen} 
                        setSidebarOpen={setSidebarOpen} 
                        isMobile={isMobile}
                    />
                </div>

                <main className="pt-16 min-h-screen">
                    <div className="p-3 md:p-5">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}