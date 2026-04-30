import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,   
  Users,            
  Settings,          
  Gift,             
  PiggyBank,         
  ShieldCheck,       
  Percent,           
  HandCoins,         
  GraduationCap,     
  Hospital,         
  Truck,             
  LogOut,           
  History           
} from "lucide-react";
import axiosClient from "../../apis/axiosConfig";

export default function Sidebar() {

  const location = useLocation();
  const active = location.pathname;

  const navItems = [
    { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/SuperAdmin/Dashboard" },
    { label: "Utilisateurs", icon: <Users size={18} />, path: "/SuperAdmin/users" },
    { label: "Parametrages", icon: <Settings size={18} />, path: "/SuperAdmin/Parametrages" },
    { label: "Indemnités", icon: <Gift size={18} />, path: "/SuperAdmin/AffichageIndementes" },
    { label: "Cotisation", icon: <PiggyBank size={18} />, path: "/SuperAdmin/Cotisation" },
    { label: "RCAR", icon: <ShieldCheck size={18} />, path: "/SuperAdmin/RCAR" },
    { label: "IR", icon: <Percent size={18} />, path: "/SuperAdmin/IRAffichage" },
    { label: "Crédit", icon: <HandCoins size={18} />, path: "/SuperAdmin/Credit" },
    { label: "Retraite & Tamdid", icon: <GraduationCap size={18} />, path: "/SuperAdmin/Retraite" },
    { label: "Assurances", icon: <Hospital size={18} />, path: "/SuperAdmin/assurances" },
    { label: "SNTL", icon: <Truck size={18} />, path: "/SuperAdmin/SNTL" },
  ];
  
  const adminItems = [
    { label: "Logs", icon: <History size={18} />, path: "/SuperAdmin/Logs" },
    { label: "Paramètres", icon: <Settings size={18} />, path: "/SuperAdmin/Parametres" },
  ];

  const handleLogout = async () => {
    try {
      await axiosClient.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <aside className="w-[260px] h-screen bg-white dark:bg-[#1A1A1A] flex flex-col fixed left-0 top-0 z-20 border-r border-gray-100 dark:border-[#2A2A2A] transition-colors duration-300 shadow-sm">
      {/* Logo Section */}
      <div className="p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 3v18M20 8l-8-5-8 5M20 16l-8 5-8-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white leading-none tracking-tight">SuperAdmin</h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-1">OptizaRH System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isItemActive = active === item.path || active.startsWith(item.path + "/");
            return (
              <NavItem 
                key={item.path} 
                item={item} 
                isActive={isItemActive} 
              />
            );
          })}
        </div>

        {/* Admin Section Divider */}
        <div className="px-4 mt-8 mb-3">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            Administration
          </span>
        </div>

        {/* Admin Navigation */}
        <div className="space-y-1">
          {adminItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={active === item.path} />
          ))}
        </div>
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-gray-100 dark:border-[#2A2A2A] bg-gray-50/30 dark:bg-[#1A1A1A]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group cursor-pointer"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// Composant NavItem
function NavItem({ item, isActive }) {
  return (
    <Link
      to={item.path}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 group relative
        ${isActive 
          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm" 
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-gray-900 dark:hover:text-white"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
      )}
      
      {/* Icon */}
      <span className={`${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
        {item.icon}
      </span>
      
      {/* Label */}
      <span>{item.label}</span>
    </Link>
  );
}