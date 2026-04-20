<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use App\Models\Auth\User;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller{
   public function __invoke(Request $request) {
    $user = User::find($request->route('id'));
    if (!$user) {
        return response()->json(['message' => 'Utilisateur introuvable.'], 404);
    }
    if (! $request->hasValidSignature()) {
        return response()->json(['message' => 'Lien expiré ou invalide.'], 403);
    }
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        $user->save(); 
    }
    return response()->json([
        'message' => 'Email vérifié avec succès.',
        'user' => $user->fresh() 
    ]);
}
}