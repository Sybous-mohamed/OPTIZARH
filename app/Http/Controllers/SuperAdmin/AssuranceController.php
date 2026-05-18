<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AssuranceController extends Controller
{
    /**
     * Retourne la liste des années disponibles.
     */
    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            return response()->json($annees);
        } catch (\Exception $e) {
            Log::error('getAnnees: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Retourne les assurances pour une année donnée.
     */
    public function getByYear($year)
    {
        try {
            $annee = SalaryYear::where('year', $year)->first();

            if (!$annee) {
                return response()->json([
                    'annee'     => $year,
                    'annee_id'  => null,
                    'assurances' => [],
                ]);
            }

            $assurances = Assurance::where('annee_id', $annee->id)
                ->orderBy('name')
                ->get(['id', 'name', 'is_active', 'taux_salarie', 'plafond_mensuel']);

            return response()->json([
                'annee'      => $year,
                'annee_id'   => $annee->id,
                'assurances' => $assurances,
            ]);
        } catch (\Exception $e) {
            Log::error('getByYear: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Sauvegarde (remplace) toutes les assurances d'une année.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'annee'                        => 'required|integer',
                'assurances'                   => 'required|array',
                'assurances.*.name'            => 'required|string|max:255',
                'assurances.*.taux_salarie'    => 'nullable|numeric|min:0|max:100',
                'assurances.*.plafond_mensuel' => 'nullable|numeric|min:0',
                'assurances.*.is_active'       => 'boolean',
            ]);

            return DB::transaction(function () use ($request) {
                $annee = SalaryYear::firstOrCreate(
                    ['year' => $request->annee],
                    ['is_active' => true]
                );

                // Remplacement complet des assurances de l'année
                Assurance::where('annee_id', $annee->id)->delete();

                foreach ($request->assurances as $data) {
                    Assurance::create([
                        'annee_id'        => $annee->id,
                        'name'            => $data['name'],
                        'is_active'       => $data['is_active']       ?? true,
                        'taux_salarie'    => $data['taux_salarie']    ?? 0,
                        'plafond_mensuel' => $data['plafond_mensuel'] ?? null,
                    ]);
                }

                Cache::forget('assurances_' . $annee->id);

                return response()->json(['message' => 'Configuration enregistrée'], 201);
            });

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AssuranceController@store: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprime une assurance par son ID.
     */
    public function destroyAssurance($id)
    {
        try {
            $assurance = Assurance::findOrFail($id);
            $assurance->delete();
            return response()->json(['message' => 'Assurance supprimée']);
        } catch (\Exception $e) {
            Log::error('AssuranceController@destroyAssurance: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}