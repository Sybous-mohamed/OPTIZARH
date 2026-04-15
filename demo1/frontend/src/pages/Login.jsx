import { useState } from "react";
import axiosClient from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        // 1. Jib l'cookie (mn web middleware)
        await axiosClient.get('/sanctum/csrf-cookie');
        
        // 2. Login (hadi ghadi tmchi l' web.php routes)
        const response = await axiosClient.post('/login', formData);
        if (response.status === 204 || response.status === 200) {
                console.log("Connecté!");
                // Daba redirecti l'user l'Dashboard
                navigate("/dashboard"); 
        }
        // 3. Jib ma3loumat l'user (hadi ghadi tmchi l' api.php)
        const user = await axiosClient.get('/api/user');
        console.log("User data:", user.data);

    } catch (err) {
        console.error(err.response?.data);
    }
};

    return (
        <div className="flex h-screen">
            <div className="hidden lg:flex w-1/2 bg-indigo-600 text-white p-12 flex-col justify-between">
                <div>
                    <h1 className="text-4xl font-bold">Architect Admin</h1>
                    <p className="mt-8 text-xl">Bienvenue sur votre plateforme RH</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl">
                    {/* Dir path shih hna */}
                    <img src="https://placehold.co/600x400" alt="Preview" className="rounded-lg shadow-2xl" />
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h2 className="text-3xl font-semibold mb-6">Connexion</h2>
                        
                        {status && <div className="p-3 bg-red-100 text-red-700 rounded">{status}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Adresse Email</label>
                            <input 
                                type="email" 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                placeholder="example@gmail.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mot de passe</label>
                            <input 
                                type="password" 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                required
                            />
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors font-medium">
                            Se connecter
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}