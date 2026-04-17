<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\Request;
use App\Models\Indemnite;
use App\Models\ActivityLog;
use App\Http\Controllers\Controller; 

class IndemniteController extends Controller
{
    public function store(Request $request) {
    try {
        $data = Indemnite::create($request->all());

        ActivityLog::create([
            'user_id'     => auth()->id() ?? 1,
            'titre'       => 'Ajout',
            'action_type' => 'CREATE',
            'description' => "Ajoute Nouvelle indemnite: " . $data->nom,
            'annee'       => $data->annee ?? date('Y'),
        ]);

        return response()->json($data, 201);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function index() {
        $indemnites = Indemnite::orderByDesc('id')->get();

        $years = Indemnite::distinct()->pluck('annee')->sortDesc()->values();

        return response()->json([
            'data' => $indemnites,
            'available_years' => $years
        ], 200);
    }

    public function update(Request $request, $id) {
        $indemnite = Indemnite::findOrFail($id);
        $indemnite->update($request->all());

        ActivityLog::create([
            'user_id'     => auth()->id() ?? 1,
            'titre'       => 'Modification',
            'action_type' => 'UPDATE',
            'description' => "Modification de l'indemnité: " . $indemnite->nom,
            'annee'       => $indemnite->annee ?? date('Y'),
        ]);
        return response()->json($indemnite, 200);
    }

    public function destroy($id) {
        $indemnite = Indemnite::findOrFail($id);
        $indemnite->delete();
        ActivityLog::create([
            'user_id'     => auth()->id() ?? 1,
            'titre'       => 'Suppression',
            'action_type' => 'DELETE',
            'description' => "Supprime indemnite: " . $indemnite->nom,
            'annee'       => $indemnite->annee ?? date('Y'),
        ]);

        return response()->json(null, 204);
    }

    public function toggleStatut($id) {
        try {
            $indemnite = Indemnite::findOrFail($id);
            $indemnite->statut = !$indemnite->statut;
            $indemnite->save();
            ActivityLog::create([
                'user_id'     => auth()->id() ?? 1,
                'titre'       => 'Statut',
                'action_type' => 'UPDATE',
                'description' => "Changement de statut (" . ($indemnite->statut ? 'Activé' : 'Désactivé') . "): " . $indemnite->nom,
                'annee'       => $indemnite->annee ?? date('Y'),
            ]);

            
            return response()->json([
                'message' => 'Statut mis à jour',
                'new_statut' => $indemnite->statut
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    
}