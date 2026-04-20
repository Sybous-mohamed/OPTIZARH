<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Retraite;
use Illuminate\Http\Request;

class RetraiteController extends Controller
{
    public function index()
    {
        $settings = Retraite::first();
        
        if (!$settings) {
            $settings = Retraite::create([
                'age_legal_retraite' => 60,
                'notification_retraite' => '6 mois avant'
            ]);
        }
        
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $settings = Retraite::first();
        
        if ($settings) {
            $settings->update($request->all());
            return response()->json(['message' => 'Paramètres mis à jour avec succès', 'data' => $settings]);
        }

        return response()->json(['error' => 'Settings not found'], 404);
    }
}