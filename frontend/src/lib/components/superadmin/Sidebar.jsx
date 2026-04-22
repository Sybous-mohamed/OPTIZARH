import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, Users, Shield, Banknote, Wallet, 
  FileText, CreditCard, Truck, Users2, Percent, 
  History, Settings, LogOut 
} from "lucide-react";
import axiosClient from "../../apis/axiosConfig";

export default function Sidebar() {
  const location = useLocation();
  const active = location.pathname;

  const navItems = [
    { label: "Tableau de bord", icon: <LayoutGrid size={18} />, path: "/SuperAdmin/Dashboard" },
    { label: "Utilisateurs", icon: <Users size={18} />, path: "/SuperAdmin/users" },
    { label: "RCAR", icon: <Shield size={18} />, path: "/SuperAdmin/rcar" },
    { label: "Indemnités", icon: <Banknote size={18} />, path: "/SuperAdmin/Indementes" },
    { label: "Cotisation", icon: <Wallet size={18} />, path: "/SuperAdmin/Cotisation" },
    { label: "Retraite & Tamdid", icon: <FileText size={18} />, path: "/SuperAdmin/Retraite" },
    { label: "Crédit", icon: <CreditCard size={18} />, path: "/SuperAdmin/Credit" },
    { label: "SNTL", icon: <Truck size={18} />, path: "/SuperAdmin/SNTL" },
    { label: "Social", icon: <Users2 size={18} />, path: "/SuperAdmin/Social" },
    { label: "IR", icon: <Percent size={18} />, path: "/SuperAdmin/GesionIR" },
  ];

  const adminItems = [
    { label: "Logs", icon: <History size={18} />, path: "/SuperAdmin/Logs" },
    { label: "Paramètres", icon: <Settings size={18} />, path: "/SuperAdmin/settings" },
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
    <aside className="w-[240px] h-screen bg-white dark:bg-[#121212] flex flex-col fixed left-0 top-0 z-20 border-r border-gray-100 dark:border-[#262626] transition-colors duration-300">
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-2 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 3v18M20 8l-8-5-8 5M20 16l-8 5-8-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight">SuperAdmin</h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-1">OptizaRH System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={active === item.path} />
          ))}
        </div>

        <div className="px-8 mt-8 mb-2">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            Administration
          </span>
        </div>

        <div className="space-y-0.5">
          {adminItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={active === item.path} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-50 dark:border-[#262626] bg-gray-50/30 dark:bg-[#121212]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-[#C0392B] dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group cursor-pointer">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, isActive }) {
  return (
    <Link
      to={item.path}
      className={`
        flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg text-[13.5px] transition-all duration-200 group relative
        ${isActive 
          ? "bg-indigo-50/50 dark:bg-indigo-500/10 text-[#4F46E5] dark:text-indigo-400 font-bold" 
          : "text-gray-500 dark:text-[#B0B0B0] hover:bg-gray-50 dark:hover:bg-[#444444]/30 hover:text-gray-900 dark:hover:text-white"}
      `}
    >
      {isActive && (
        <div className="absolute left-0 w-1 h-5 bg-[#4F46E5] dark:bg-indigo-500 rounded-r-full" />
      )}
      
      <span className={`${isActive ? "text-[#4F46E5] dark:text-indigo-400" : "text-gray-400 dark:text-[#888888] group-hover:text-gray-600 dark:group-hover:text-gray-200"}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}