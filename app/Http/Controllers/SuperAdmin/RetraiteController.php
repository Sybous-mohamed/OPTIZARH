<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\RetraiteSetting;
use Illuminate\Http\Request;

class RetraiteController extends Controller{
    
    public function getSettings($year)
    {
        $settings = RetraiteSetting::where('year', $year)->first();
        
        $this->logActivity(
            'Consultation Retraite',
            'READ',
            "Récupération des paramètres retraite pour l'année {$year}"
        );
        
        if (!$settings) {
            return response()->json([
                'year' => $year,
                'age_legal' => 60,
                'duree_max' => 0,
                'nb_fois' => 0
            ]);
        }

        return response()->json($settings);
    }

    // Bach t-sauvegarder (dik handleSave dialek)
    public function storeOrUpdate(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'age_legal' => 'required|integer',
            'duree_max' => 'required|integer',
            'nb_fois' => 'required|integer',
        ]);

        $settings = RetraiteSetting::updateOrCreate(
            ['year' => $validated['year']],
            $validated
        );

        $this->logActivity(
            'Configuration Retraite',
            'UPDATE',
            "Mise à jour des paramètres retraite pour l'année {$validated['year']} (âge: {$validated['age_legal']})"
        );

        return response()->json([
            'message' => 'Paramètres enregistrés avec succès',
            'data' => $settings
        ], 200);
    }
}