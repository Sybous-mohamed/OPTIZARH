import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Layout() {
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
            {/* 1. Sidebar chad l-issar (Fixed) */}
            <Sidebar />

            {/* 2. Container dial l-limen (Header + Page Content) */}
            <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                marginLeft: 200, // Bach n-khlliw blast Sidebar (200px)
                minWidth: 0 
            }}>
                <Header />
                <main style={{ flex: 1, padding: "24px", marginTop: 56 }}>
                    {/* Outlet hiya fin ghadi t-ban ay page (Dashboard, Users...) */}
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}