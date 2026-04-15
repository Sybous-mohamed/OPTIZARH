import React from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" />;
    }

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg> {/* Hna kan l-ghalat, kanat </ol> blast </svg> */}
                    </div>
                    <span className="font-bold text-xl text-gray-800 tracking-tight">
                        Optiza<span className="text-indigo-600">RH</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            {user?.role || 'Super Admin'}
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-red-200"
                    >
                        Déconnexion
                    </button>
                </div>
            </nav>

            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {user?.name}! 👋</h1>
                        <p className="text-gray-500 mt-2">Voici un aperçu global de votre système RH.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Entreprises</p>
                            <h3 className="text-2xl font-bold text-gray-900">12</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Utilisateurs</p>
                            <h3 className="text-2xl font-bold text-gray-900">48</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Statut</p>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">OPÉRATIONNEL</span>
                        </div>
                    </div>

                    <div className="mt-10 bg-indigo-50 border border-indigo-100 p-8 rounded-3xl">
                        <h2 className="text-xl font-bold text-indigo-900">Prêt à commencer ?</h2>
                        <p className="text-indigo-700/80 mt-2 mb-6 max-w-lg">
                            Vous êtes maintenant connecté en tant que Super Administrateur. Vous pouvez gérer les accès, configurer les paramètres de l'entreprise et surveiller les journaux du système.
                        </p>
                        <button className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                            Paramètres Système
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;