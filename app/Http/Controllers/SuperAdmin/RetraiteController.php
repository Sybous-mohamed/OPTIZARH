<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Retraite;
use Illuminate\Http\Request;

class RetraiteController extends Controller{
    public function index(){
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
    $rules = [
        'age_legal_retraite'           => 'required|numeric|min:45|max:75',
        'notification_retraite'        => 'required|string', 
        'duree_prolongation_max'       => 'required|numeric|min:0|max:10', 
        'nb_prolongations_max'         => 'required|string', 
        'desactiver_rcar'              => 'required|boolean',
        'maintenir_autres_cotisations' => 'required|boolean',
    ];

    $messages = [
        'age_legal_retraite.min' => "L'âge de retraite minimum est 45 ans.",
        'age_legal_retraite.max' => "L'âge de retraite ne peut pas dépasser 75 ans.",
    ];

    $request->validate($rules, $messages);

    try {
        $settings = Retraite::first();
        if ($settings) {
            $settings->update($request->only(array_keys($rules)));
            $this->logActivity("Retraite", "UPDATE", "Mise à jour des paramètres généraux de retraite (Âge: " . $request->age_legal_retraite . ")");
            return response()->json([
                'status' => 'success',
                'message' => 'Configuration mise à jour',
                'data' => $settings
            ]);
        }
        return response()->json(['message' => 'Settings introuvables'], 404);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur Serveur'], 500);
    }
}
}