<?php
namespace App\Http\Controllers\Auth;

use App\Models\Auth\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller{
    public function register(Request $request) {
        $validator = Validator::make($request->all(), [
            'full_name'      => 'required|string|max:255',
            'email'          => 'required|string|email|max:255|unique:users,email',
            'password'       => 'required|string|min:8|confirmed',
            'role'           => 'required',
            'company_name'   => 'required|string',
            'sector'         => 'required|string',
            'must_change_password' => false,
        ], [
            'email.unique' => 'Cet email est déjà utilisé .',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'full_name'      => $request->full_name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'role'           => $request->role,
            'company_name'   => $request->company_name,
            'sector'         => $request->sector,
            'employee_count' => $request->employee_count,
            'must_change_password' => false,
        ]);

        event(new Registered($user));
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Compte créé avec succès',
            'access_token' => $token, 
            'token_type'   => 'Bearer',
            'user'         => $user,
        ], 201);
    }

    public function login(Request $request){
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Cet email n\'existe pas dans notre système'], 404);
        }
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Le mot de passe est incorrect'], 401);
        }
        if ($user->is_blocked) {
            return response()->json([
                'message' => 'Votre compte est suspendu. Veuillez contacter l\'administrateur.'
            ], 403); 
        }
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function sendVerificationEmail(Request $request){
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['status' => 'verification-link-sent']);
    }
public function userStatus(Request $request)
{
    // fresh() darouri bach i-jib l-état jdid mn database machi mn session
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    return response()->json([
        'email_verified_at' => $user->fresh()->email_verified_at,
        'user' => $user->fresh(),
        'role' => $user->role
    ]);
}

    public function updatePasswordFirst(Request $request) {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function skipPasswordChange(Request $request) {
        $user = $request->user();
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Skipped successfully']);
    }
// LOgout
    public function logout(Request $request){
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }
}