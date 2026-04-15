import React from 'react';
import { icons } from "../../icons/icons";
import { Bell, Moon, Search } from 'lucide-react';

export default function Header() {
    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 right-0 left-[240px] z-10">
            {/* Search Bar */}
            <div className="flex-1 max-w-sm relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Search size={18} />
                </span>
                <input 
                    type="text" 
                    placeholder="Rechercher un dossier, un employé..." 
                    className="w-full h-10 bg-gray-50 border-none rounded-lg pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all"
                />
            </div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                    <Moon size={20} />
                </button>
                
                <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-none">Admin Principal</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">Super Utilisateur</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs group-hover:scale-105 transition-transform">
                        AP
                    </div>
                </div>
            </div>
        </header>
    );
}