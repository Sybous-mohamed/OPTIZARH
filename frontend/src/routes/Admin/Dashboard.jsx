import React from 'react';

const DashboardLayout = ({ title, role, children }) => {
    
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-indigo-900 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-indigo-800">
                    Optiza<span className="text-indigo-400">RH</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <div className="px-4 py-2 bg-indigo-800 rounded-lg cursor-pointer">Tableau de bord</div>
                    <div className="px-4 py-2 hover:bg-indigo-800 rounded-lg cursor-pointer transition-colors">Profil</div>
                    <div className="px-4 py-2 hover:bg-indigo-800 rounded-lg cursor-pointer transition-colors">Paramètres</div>
                </nav>
                <div className="p-4 border-t border-indigo-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-medium py-2 px-4 rounded-lg transition-all"
                    >
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                            {role}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                            {localStorage.getItem('user_name')?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;