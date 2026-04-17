<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SuperAdminController extends Controller{
    public function setup(Request $request){

        if (User::where('role', 'superadmin')->exists()) {
            return response()->json([
                'message' => 'Le système est déjà configuré.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = User::create([
                'full_name'     => $request->full_name,
                'email'         => $request->email,
                'password'      => Hash::make($request->password),
                'role'          => 'superadmin',
                'company_name'  => 'OptizaRH System',
                'is_active'     => true,
                'email_verified_at' => now(),
            ]);
            $token = $user->createToken('main')->plainTextToken;
            return response()->json([
                'message' => 'Système initialisé avec succès !',
                'user'    => $user,
                'token'   => $token
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur technique lors de la création.',
                'error'   => $e->getMessage() 
            ], 500);
        }
    }
    public function checkStatus(){
        $isInitialized = User::where('role', 'superadmin')->exists();
        return response()->json(['isInitialized' => $isInitialized]);
    }
}