import { useEffect, useState } from "react";
import axiosClient from "../api/axios";

export default function Dashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Jib ma3loumat l'user mli t-fth l'page
        axiosClient.get('/api/user')
            .then(res => setUser(res.data))
            .catch(err => window.location.href = "/"); // Ila m'connectich, rj3o l'login
    }, []);

    if (!user) return <div className="p-8">Chargement...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
                <h1 className="text-2xl font-bold text-indigo-600">Tableau de Bord</h1>
                <p className="mt-4 text-gray-600 italic">Bienvenue dans votre espace RH,</p>
                <div className="mt-6 p-4 border-t border-gray-100">
                    <p><strong>Nom:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </div>
                <button 
                    onClick={async () => {
                        await axiosClient.post('/logout');
                        window.location.href = "/";
                    }}
                    className="mt-8 bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}