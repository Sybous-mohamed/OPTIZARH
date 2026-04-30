<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\RetraiteSetting;
use Illuminate\Http\Request;

class RetraiteController extends Controller{
    public function getSettings($year)
    {
        $settings = RetraiteSetting::where('year', $year)->first();
        
        if (!$settings) {
            // Ila mal9ach l-3am, n-rej3o default values
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
            ['year' => $validated['year']], // Condition
            $validated                      // Data to update/create
        );

        return response()->json([
            'message' => 'Paramètres enregistrés avec succès',
            'data' => $settings
        ], 200);
    }
}