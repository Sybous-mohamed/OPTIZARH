<?php

namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use App\Models\SuperAdmin\Indemnite;
use App\Models\SuperAdmin\ActivityLog;
use App\Http\Controllers\Controller; 

class IndemniteController extends Controller
{
   public function store(Request $request) {
    try {
        // 1. Validation darouria bach t-7mi l-app
        $validated = $request->validate([
            'nom'           => 'required|string',
            'type'          => 'required', // FIXE awla POURCENTAGE
            'valeur'        => 'required|numeric',
            'annee'         => 'required|integer',
            'tous_employes' => 'boolean',
            'statut'        => 'boolean',
            'grade'         => 'nullable|string',
            'echelle'       => 'nullable|string',
            'echelon'       => 'nullable|string',
        ]);

        // 2. Création
        $indemnite = Indemnite::create($validated);

        // 3. Activity Log (khass ikoun sécurisé)
        ActivityLog::create([
            'user_id'     => auth()->id() ?? 1, // Ila makanch session, dima sta3mel id=1
            'titre'       => 'Ajout',
            'action_type' => 'CREATE',
            'description' => "Ajout de l'indemnité " . $indemnite->nom,
            'annee'       => $indemnite->annee,
        ]);

        return response()->json($indemnite, 201);

    } catch (\Exception $e) {
        // Had l-line ghadi i-biyen lik l-erreur l-haqiqia f l-onglet Network
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

    // store logic dialek déjà mziana, ghir t-yqed men l-ActivityLog model namespace
public function update(Request $request, $id) {
    try {
        $indemnite = Indemnite::findOrFail($id);
        
        // Validation darouria hna bach may-t-plantech l-code
        $validated = $request->validate([
            'nom'           => 'string',
            'type'          => 'string',
            'valeur'        => 'numeric',
            'annee'         => 'integer',
            'tous_employes' => 'boolean',
            'statut'        => 'boolean',
            'grade'         => 'nullable|string',
            'echelle'       => 'nullable|string',
            'echelon'       => 'nullable|string',
        ]);

        $indemnite->update($validated);

        ActivityLog::create([
            'user_id'     => auth()->id() ?? 1,
            'titre'       => 'Modification',
            'action_type' => 'UPDATE',
            'description' => "Modification de l'indemnité: " . $indemnite->nom,
            'annee'       => $indemnite->annee,
        ]);
        
        return response()->json($indemnite, 200);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
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