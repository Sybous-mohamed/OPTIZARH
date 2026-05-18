import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apis/axiosConfig';
import { useLoading } from '../../context/LoadingContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; // Zid had l-icons

const ChangePasswordFirst = () => {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { setLoading } = useLoading();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            return toast.error("Les mots de passe ne correspondent pas");
        }

        setLoading(true);
        try {
            const response = await api.post('/api/user/update-password-first', {
                password,
                password_confirmation: passwordConfirmation
            });

            const updatedUser = { ...user, must_change_password: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success("Mot de passe mis à jour !");
            redirectUser(updatedUser.role);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            await api.post('/api/user/skip-password-change');
            const updatedUser = { ...user, must_change_password: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success("Bienvenue !");
            redirectUser(updatedUser.role);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const redirectUser = (role) => {
        const paths = {
            rh: "/RH/Dashboard",
            admin: "/Admin/Dashboard",
            employee: "/Employee/Dashboard"
        };
        navigate(paths[role?.toLowerCase()] || "/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Sécurisez votre compte
                </h2>
                <p className="text-sm text-gray-600 text-center mb-6">
                    SuperAdmin a généré votre compte. Souhaitez-vous personnaliser votre mot de passe maintenant ?
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Input Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Input Confirmation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                        <div className="relative mt-1">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Mettre à jour et continuer
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between">
                    <hr className="w-full border-gray-300" />
                    <span className="px-2 text-gray-400 text-sm">OU</span>
                    <hr className="w-full border-gray-300" />
                </div>

                <button
                    onClick={handleSkip}
                    className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition duration-200 font-medium">
                    Garder le mot de passe actuel
                </button>
            </div>
        </div>
    );
};

export default ChangePasswordFirst;