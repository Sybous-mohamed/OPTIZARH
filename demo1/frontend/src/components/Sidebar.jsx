import { useState } from "react";
import { Link, useLocation } from "react-router-dom"; // Link bach t-dir navigation
import { icons } from "../assets/icons";
import axiosClient from "../api/axios";

export default function Sidebar() {
    const location = useLocation(); 
    const active = location.pathname;

    const navItems = [
        { key: "dashboard", label: "Tableau de bord", icon: icons.dashboard, path: "/dashboard" },
        { key: "users", label: "Utilisateurs", icon: icons.users, path: "/users" },
        { key: "rcar", label: "RCAR", icon: icons.rcar, path: "/rcar" },
        { key: "salary", label: "Salaire et Indemnités", icon: icons.salary, path: "/salaires" },
        { key: "cotisation", label: "Cotisation", icon: icons.cotisation, path: "/cotisation" },
        { key: "retraite", label: "Retraite & Tamdid", icon: icons.retraite, path: "/retraite" },
        { key: "credit", label: "Crédit", icon: icons.credit, path: "/credit" },
        { key: "sntl", label: "SNTL", icon: icons.sntl, path: "/sntl" },
        { key: "social", label: "Social", icon: icons.social, path: "/social" },
        { key: "ir", label: "IR", icon: icons.ir, path: "/ir" },
    ];

    const adminItems = [
        { key: "logs", label: "Logs", icon: icons.logs, path: "/logs" },
        { key: "settings", label: "Paramètres", icon: icons.settings, path: "/settings" },
    ];

    const handleLogout = async () => {
        try {
            await axiosClient.post('/logout');
            window.location.href = "/login";
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <aside style={sidebarStyle}>
            <div style={logoStyle}>SUPERADMIN</div>
            
            <nav style={{ flex: 1, overflowY: "auto" }}>
                {/* Section Principal */}
                {navItems.map((item) => (
                    <NavItem 
                        key={item.key} 
                        item={item} 
                        isActive={active === item.key} 
                        onClick={() => setActive(item.key)} 
                    />
                ))}

                {/* Section Administration */}
                <div style={adminLabelStyle}>Administration</div>
                {adminItems.map((item) => (
                    <NavItem 
                        key={item.key} 
                        item={item} 
                        isActive={active === item.key} 
                        onClick={() => setActive(item.key)} 
                    />
                ))}
            </nav>

            {/* Logout Footer */}
            <div style={footerStyle}>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                    {icons.logout} Déconnexion
                </button>
            </div>
        </aside>
    );
}

// Composant sghir bach l-code i-koun nqi
function NavItem({ item, isActive, onClick }) {
    return (
        <Link 
            to={item.path} 
            onClick={onClick}
            style={{
                ...navItemStyle,
                background: isActive ? "#EEEDFE" : "none",
                color: isActive ? "#4B42C8" : "#666",
                borderLeft: isActive ? "3px solid #4B42C8" : "3px solid transparent",
                fontWeight: isActive ? "600" : "400"
            }}
        >
            {item.icon}
            <span>{item.label}</span>
        </Link>
    );
}

// --- Styles (CSS-in-JS) ---
const sidebarStyle = { width: 200, 
    minWidth: 200, 
    height: '100vh', 
    background: "#fff", 
    borderRight: "1px solid #f0f0f0", 
    display: "flex", 
    flexDirection: "column", 
    padding: "20px 0", 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    zIndex: 20 };
const logoStyle = { fontSize: 15, fontWeight: 700, color: "#4B42C8", padding: "0 20px 25px", letterSpacing: "0.05em" };
const adminLabelStyle = { fontSize: 10, fontWeight: 600, color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase", padding: "20px 20px 8px" };
const navItemStyle = { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 20px", textDecoration: "none", fontSize: 13, transition: "all 0.2s" };
const footerStyle = { padding: "12px 20px 0", borderTop: "0.5px solid rgba(0,0,0,0.08)", marginTop: "10px" };
const logoutButtonStyle = { display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 13, fontWeight: "600", padding: "8px 0" };