import { icons } from "../../icons/icons";

export default function Header() {
    return (
        <header style={{
            height: 56, 
            background: "#fff", 
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            display: "flex", 
            alignItems: "center", 
            padding: "0 24px", 
            position: "fixed", // Fixed bach i-bqa dima l-foq
            top: 0,
            right: 0,
            left: 200, // Bach may-ghthach Sidebar
            zIndex: 10,
            justifyContent: "space-between"
        }}>
            {/* Search Bar /}
            <div style={{ flex: 1, maxWidth: 340, position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", display: "flex" }}>
                    {icons.search}
                </span>
                <input type="text" placeholder="Rechercher..." style={searchInputStyle} />
            </div>

            {/ Right Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button style={btnStyle}>{icons.bell}</button>
                <button style={btnStyle}>{icons.moon}</button>
                <div style={userChipStyle}>
                    <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Admin Principal</div>
                        <div style={{ fontSize: 11, color: "#888" }}>Super Utilisateur</div>
                    </div>
                    <div style={avatarStyle}>AP</div>
                </div>
            </div>
        </header>
    );
}
const searchInputStyle = { width: "100%", height: 36, border: "1px solid #eee", borderRadius: 20, background: "#f5f5f5", fontSize: 13, padding: "0 12px 0 40px", outline: "none" };
const btnStyle = { width: 34, height: 34, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" };
const userChipStyle = { display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 12px", borderRadius: 25, border: "1px solid #eee", cursor: "pointer", background: "#fff" };
const avatarStyle = { width: 32, height: 32, borderRadius: "50%", background: "#4B42C8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" };