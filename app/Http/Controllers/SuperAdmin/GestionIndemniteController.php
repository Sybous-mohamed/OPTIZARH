<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\GestionIndemnite;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Role;
use App\Models\SuperAdmin\Grade;
use App\Models\SuperAdmin\Echelle;
use App\Models\SuperAdmin\Echelon;

class GestionIndemniteController extends Controller
{
    public function index($yearId)
    {
        try {
            $indemnites = GestionIndemnite::where('salary_year_id', $yearId)
                ->with(['role', 'grade', 'echelle', 'echelon'])
                ->latest()
                ->get();
            
            return response()->json($indemnites);
        } catch (\Exception $e) {
            $this->logActivity(
                'Liste des indemnités',
                'READ',
                "Erreur lors du chargement des indemnités pour l'année ID: {$yearId}: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'libelle' => 'required|string|max:255',
                'type' => 'required|in:Fixe,Pourcentage',
                'valeur' => 'required|numeric|min:0',
                'salary_year_id' => 'required|exists:salary_years,id',
                'role_id' => 'nullable|exists:roles,id',
                'grade_id' => 'nullable|exists:grades,id',
                'echelle_id' => 'nullable|exists:echelles,id',
                'echelon_id' => 'nullable|exists:echelons,id',
                'is_for_all' => 'boolean' 
            ]);

            $indemnite = GestionIndemnite::create($validated);
            
            // Préparer le message pour le log
            $target = $validated['is_for_all'] ? 'Tous les employés' : 'Cible spécifique';
            if (!$validated['is_for_all'] && isset($validated['role_id'])) {
                $role = Role::find($validated['role_id']);
                $target = $role ? $role->name : 'Rôle non trouvé';
                if (isset($validated['grade_id'])) {
                    $grade = Grade::find($validated['grade_id']);
                    $target .= ' / ' . ($grade ? $grade->name : 'Grade non trouvé');
                }
            }
            
            $this->logActivity(
                'Indemnité',
                'CREATE',
                "Ajout de l'indemnité '{$validated['libelle']}' (Type: {$validated['type']}, Valeur: {$validated['valeur']}) pour: {$target}"
            );

            return response()->json([
                'message' => 'Indemnité ajoutée avec succès',
                'data' => $indemnite->load(['role', 'grade', 'echelle', 'echelon'])
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->logActivity(
                'Indemnité',
                'ERROR',
                "Erreur de validation: " . json_encode($e->errors())
            );
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity(
                'Indemnité',
                'ERROR',
                "Erreur lors de l'ajout: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $indemnite = GestionIndemnite::findOrFail($id);
            $indemniteLibelle = $indemnite->libelle;
            
            $indemnite->delete();
            
            $this->logActivity(
                'Indemnité',
                'DELETE',
                "Suppression de l'indemnité '{$indemniteLibelle}' (ID: {$id})"
            );
            
            return response()->json(['message' => 'Indemnité supprimée avec succès']);
        } catch (\Exception $e) {
            $this->logActivity(
                'Indemnité',
                'ERROR',
                "Erreur lors de la suppression de l'indemnité ID: {$id}: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getYearsWithIndemnites()
    {
        try {
            $years = SalaryYear::whereHas('indemnites')->orderBy('year', 'desc')->get();
            return response()->json($years);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}