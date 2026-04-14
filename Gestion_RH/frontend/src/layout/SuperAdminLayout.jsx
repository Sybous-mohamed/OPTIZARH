import { Outlet } from "react-router-dom";
import Sidebar from "../lib/components/superadmin/Sidebar";
import Header from "../lib/components/superadmin/Header";

export default function Layout() {
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>

            <Sidebar />

            <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                marginLeft: 200, // Bach n-khlliw blast Sidebar (200px)
                minWidth: 0 
            }}>
                <Header />
                <main style={{ flex: 1, padding: "24px", marginTop: 56 }}>
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}