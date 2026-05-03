<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\AssuranceTranche;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AssuranceController extends Controller
{
    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            
            $this->logActivity(
                'Consultation années assurances',
                'READ',
                'Récupération de la liste des années pour les assurances'
            );
            
            return response()->json($annees);
        } catch (\Exception $e) {
            Log::error('getAnnees: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getByYear($year)
    {
        try {
            $annee = SalaryYear::where('year', $year)->first();
            
            if (!$annee) {
                return response()->json([
                    'annee' => $year,
                    'annee_id' => null,
                    'assurances' => []
                ]);
            }

            $assurances = Assurance::with('tranches')
                ->where('annee_id', $annee->id)
                ->orderBy('name')
                ->get();

            $this->logActivity(
                'Consultation assurances',
                'READ',
                "Récupération de la configuration des assurances pour l'année {$year}"
            );

            return response()->json([
                'annee' => $year,
                'annee_id' => $annee->id,
                'assurances' => $assurances
            ]);
        } catch (\Exception $e) {
            Log::error('getByYear: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Store request received', $request->all());
            
            $validated = $request->validate([
                'annee' => 'required|integer',
                'assurances' => 'required|array',
                'assurances.*.name' => 'required|string',
                'assurances.*.code' => 'required|string',
            ]);

            return DB::transaction(function () use ($request) {
                $annee = SalaryYear::firstOrCreate(
                    ['year' => $request->annee],
                    ['is_active' => true]
                );

                // Supprimer les anciennes données
                Assurance::where('annee_id', $annee->id)->delete();

                $assurancesCount = 0;

                foreach ($request->assurances as $assData) {
                    // Créer l'assurance
                    $assurance = Assurance::create([
                        'annee_id' => $annee->id,
                        'name' => $assData['name'],
                        'code' => $assData['code'],
                        'type' => $assData['type'] ?? 'sociale',
                        'is_active' => $assData['is_active'] ?? true,
                        'is_obligatoire' => $assData['is_obligatoire'] ?? true,
                        'taux_salarie' => $assData['taux_salarie'] ?? 0,
                        'taux_employeur' => $assData['taux_employeur'] ?? 0,
                        'plafond_mensuel' => $assData['plafond_mensuel'] ?? null,
                        'plafond_annuel' => $assData['plafond_annuel'] ?? null,
                        'description' => $assData['description'] ?? null
                    ]);

                    $assurancesCount++;

                    // Ajouter les tranches si existent
                    if (isset($assData['tranches']) && is_array($assData['tranches']) && count($assData['tranches']) > 0) {
                        foreach ($assData['tranches'] as $tranche) {
                            if (!empty($tranche['tranche_name'])) {
                                AssuranceTranche::create([
                                    'assurance_id' => $assurance->id,
                                    'tranche_name' => $tranche['tranche_name'],
                                    'min_salaire' => $tranche['min_salaire'] ?? 0,
                                    'max_salaire' => $tranche['max_salaire'] ?? null,
                                    'taux_salarie' => $tranche['taux_salarie'] ?? 0,
                                    'taux_employeur' => $tranche['taux_employeur'] ?? 0,
                                    'plafond' => $tranche['plafond'] ?? null
                                ]);
                            }
                        }
                    }
                }

                Cache::forget('assurances_' . $annee->id);

                $this->logActivity(
                    'Configuration assurances',
                    'UPDATE',
                    "Mise à jour de la configuration des assurances pour l'année {$request->annee} ({$assurancesCount} assurance(s))"
                );

                return response()->json(['message' => 'Configuration enregistrée avec succès'], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity(
                'Configuration assurances',
                'ERROR',
                "Erreur lors de l'enregistrement: " . $e->getMessage()
            );
            Log::error('Store error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyAssurance($id)
    {
        try {
            $assurance = Assurance::findOrFail($id);
            $assuranceName = $assurance->name;
            $assurance->delete();
            
            $this->logActivity(
                'Suppression assurance',
                'DELETE',
                "Suppression de l'assurance : {$assuranceName}"
            );
            
            return response()->json(['message' => 'Assurance supprimée avec succès']);
        } catch (\Exception $e) {
            $this->logActivity(
                'Suppression assurance',
                'ERROR',
                "Erreur lors de la suppression: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyTranche($id)
    {
        try {
            $tranche = AssuranceTranche::findOrFail($id);
            $trancheName = $tranche->tranche_name;
            $tranche->delete();
            
            $this->logActivity(
                'Suppression tranche assurance',
                'DELETE',
                "Suppression de la tranche : {$trancheName}"
            );
            
            return response()->json(['message' => 'Tranche supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}