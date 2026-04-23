<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Organisme;
use App\Models\SuperAdmin\CotisationRule;
use App\Models\SuperAdmin\ActivityLog; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CotisationController extends Controller
{
    public function index(Request $request) {
        $year = $request->query('year');
        return Organisme::with(['rules' => function($q) use ($year) {
            if ($year) $q->where('year', $year);
        }])->whereHas('rules', function($q) use ($year) {
            if ($year) $q->where('year', $year);
        })->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string',
            'type' => 'required|string',
            'year' => 'required|integer',
            'taux' => 'required|numeric',
            'plafond' => 'nullable|numeric',
            'mgpap' => 'boolean',
            'omfam' => 'boolean',
            'rattachement' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            $organisme = Organisme::create([
                'nom' => $validated['nom'],
                'type' => $validated['type'],
                'rattachement' => $validated['rattachement']
            ]);

            $organisme->rules()->create([
                'year' => $validated['year'],
                'taux' => $validated['taux'],
                'plafond' => $validated['plafond'],
                'mgpap' => $validated['mgpap'] ?? false,
                'omfam' => $validated['omfam'] ?? false,
                'derniere_maj' => now()
            ]);

            // --- ZID LOG HNA ---
            ActivityLog::create([
                'user_id'     => auth()->id(),
                'titre'       => 'Cotisation',
                'action_type' => 'CREATE',
                'description' => "Ajout de l'organisme de cotisation : " . $validated['nom'] . " pour l'année " . $validated['year'],
                'annee'       => date('Y'),
            ]);

            return response()->json(['message' => 'تم الحفظ بنجاح'], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $organisme = Organisme::findOrFail($id);
        
        $validated = $request->validate([
            'taux' => 'numeric',
            'plafond' => 'nullable|numeric',
            'mgpap' => 'boolean',
            'omfam' => 'boolean',
            'year' => 'required|integer'
        ]);

        $organisme->rules()->updateOrCreate(
            ['year' => $validated['year']],
            [
                'taux' => $validated['taux'],
                'plafond' => $validated['plafond'],
                'mgpap' => $validated['mgpap'],
                'omfam' => $validated['omfam'],
                'derniere_maj' => now()
            ]
        );

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'titre'       => 'Cotisation',
            'action_type' => 'UPDATE',
            'description' => "Mise à jour des règles de cotisation pour : " . $organisme->nom . " (Année: " . $validated['year'] . ")",
            'annee'       => date('Y'),
        ]);

        return response()->json(['message' => 'تم التحديث بنجاح']);
    }

    public function destroy($id)
    {
        $organisme = Organisme::find($id);
        
        if ($organisme) {
            $nomOrganisme = $organisme->nom;
            
            ActivityLog::create([
                'user_id'     => auth()->id(),
                'titre'       => 'Cotisation',
                'action_type' => 'DELETE',
                'description' => "Suppression de l'organisme de cotisation : " . $nomOrganisme,
                'annee'       => date('Y'),
            ]);

            $organisme->delete();
        }

        return response()->json(['message' => 'La suppression est valide']);
    }
}