<?php


namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get current user data
     */
    public function show(Request $request)
    {
        // Reje3 l-user m3a l-m3loumat l-kamla
        return response()->json($request->user());
    }

    /**
     * Update Profile (Personal Info Tab)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // 1. Validation dyal l-fields li drna f l-UI
        $validated = $request->validate([
            'prenom'              => 'required|string|max:255',
            'nom'                 => 'required|string|max:255',
            'email'               => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'telephone'           => 'nullable|string|max:20',
            'situation_familiale' => 'nullable|string|max:100',
            'nombre_enfants'      => 'nullable|integer|min:0',
            'profile_image'       => 'nullable|string', // Ila knti ghadi t-siftha k Base64 awla URL
        ]);

        // 2. Mise à jour
        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Informations personnelles mises à jour !',
            'user'    => $user
        ]);
    }

    /**
     * Update Platform Settings (Theme & Language)
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'theme'    => ['required', Rule::in(['light', 'dark', 'system'])],
            'language' => ['required', Rule::in(['en', 'fr', 'ar'])],
        ]);

        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Préférences de la plateforme mises à jour !',
            'user'    => $user
        ]);
    }

    /**
     * Update Password
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => ['required', 'confirmed', Password::defaults()],
        ]);

        // Vérification dyal l-password l-qdima
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Le mot de passe actuel est incorrect.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Mot de passe modifié avec succès !'
        ]);
    }
}