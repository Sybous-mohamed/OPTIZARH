<?php

namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use App\Models\Auth\User;

class UserProfileController extends Controller
{
    /**
     * Jib data dyal l-user melli kat-lancer l-page Settings
     */
    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update Profile (General Settings)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // 1. Validation dyal l-data li jaya mn React
        $validated = $request->validate([
            'full_name'      => 'required|string|max:255',
            'company_name'   => 'nullable|string|max:255',
            'sector'         => 'nullable|string|max:255',
            'employee_count' => 'nullable|integer|min:0',
            'profile_image'  => 'nullable|string',
            'theme'    => ['required', Rule::in(['light', 'dark','system'])],
            'language' => ['required', Rule::in(['en', 'fr', 'ar'])],
        ]);

        // 2. Update f l-Base de données
        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Profile updated successfully!',
            'user'    => $user
        ]);
    }

    /**
     * Update Password (Security Settings)
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        // 1. Validation d l-passwords
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => ['required', 'confirmed', Password::defaults()],
        ]);

        // 2. T-akked wach Current Password s'hiha
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'The current password you entered is incorrect.'
            ], 422);
        }

        // 3. Hash w Save l-password jdida
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Password updated successfully!'
        ]);
    }
}