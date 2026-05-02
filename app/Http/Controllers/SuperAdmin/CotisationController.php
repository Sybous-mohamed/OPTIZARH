<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Organisme;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Support\Facades\DB;
use App\Models\SuperAdmin\Cotisation;

class CotisationController extends Controller
{
    /**
     * Get cotisations configuration for a year
     */
    public function index(Request $request)
    {
        try {
            $year = $request->query('year');
            
            if (!$year) {
                return response()->json(['error' => 'L\'année est requise'], 400);
            }

            $organismes = Organisme::with('cotisations')
                ->where('annee', $year)
                ->get();

            $formatted = $organismes->map(function ($org) {
                return [
                    'id' => $org->id,
                    'name' => $org->nom,
                    'is_favorite' => (bool)$org->is_favorite,
                    'rubriques' => $org->cotisations->map(function ($cot) {
                        return [
                            'id' => $cot->id,
                            'label' => $cot->name,
                            'taux' => floatval($cot->taux),
                            'plafond' => $cot->plafond !== null ? floatval($cot->plafond) : null,
                        ];
                    })
                ];
            });

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Log::error('Erreur index cotisations: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store cotisations configuration
     */
   public function store(Request $request)
{
    try {
        \Log::info('Store cotisations request', $request->all());
        
        $year = $request->input('year');
        $organismes = $request->input('organismes', []);
        
        if (!$year) {
            return response()->json(['error' => 'Année requise'], 400);
        }
        
        DB::beginTransaction();
        
        // Delete old configuration
        Organisme::where('annee', $year)->delete();
        
        foreach ($organismes as $orgData) {
            if (empty($orgData['name'])) {
                continue;
            }
            
            $organisme = Organisme::create([
                'nom'   => $orgData['name'],
                'is_favorite' => isset($orgData['is_favorite']) ? (bool)$orgData['is_favorite'] : false,
                'annee' => $year,
            ]);
            
            $rubriques = isset($orgData['rubriques']) ? $orgData['rubriques'] : [];
            foreach ($rubriques as $rub) {
                $taux = isset($rub['taux']) && $rub['taux'] !== '' ? floatval($rub['taux']) : 0;
                $plafond = isset($rub['plafond']) && $rub['plafond'] !== '' ? floatval($rub['plafond']) : null;
                $label = isset($rub['label']) ? $rub['label'] : 'Sans Désignation';
                
                // Ne pas inclure 'type' dans la création
                $organisme->cotisations()->create([
                    'name'    => $label,
                    'taux'    => $taux,
                    'plafond' => $plafond,
                ]);
            }
        }
        
        DB::commit();
        
        return response()->json(['message' => 'Configuration enregistrée avec succès'], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Store error: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    /**
     * Delete an organisme
     */
    public function destroyOrganisme($id)
    {
        try {
            $organisme = Organisme::findOrFail($id);
            $organisme->delete();
            return response()->json(['message' => 'Organisme supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a rubrique (cotisation)
     */
    public function destroyRubrique($id)
    {
        try {
            $cotisation = Cotisation::findOrFail($id);
            $cotisation->delete();
            return response()->json(['message' => 'Rubrique supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Toggle favorite status and propagate to all years
     */
    public function toggleFavorite(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $sourceOrg = Organisme::with('cotisations')->find($id);

                if (!$sourceOrg) {
                    return response()->json(['error' => 'Organisme introuvable'], 404);
                }

                $isFavorite = (bool) $request->input('is_favorite');
                $sourceOrg->update(['is_favorite' => $isFavorite]);

                if ($isFavorite) {
                    $allYears = SalaryYear::pluck('year')->toArray();

                    foreach ($allYears as $yearValue) {
                        if ($yearValue == $sourceOrg->annee) continue;

                        Organisme::where('annee', $yearValue)
                            ->where('nom', $sourceOrg->nom)
                            ->delete();

                        $newOrg = Organisme::create([
                            'annee'       => $yearValue,
                            'nom'         => $sourceOrg->nom,
                            'is_favorite' => true
                        ]);

                        foreach ($sourceOrg->cotisations as $cot) {
                            $newOrg->cotisations()->create([
                                'name'    => $cot->name,
                                'taux'    => $cot->taux,
                                'plafond' => $cot->plafond,
                            ]);
                        }
                    }
                    
                    return response()->json([
                        'status' => 'success',
                        'message' => "⭐ L'organisme a été propagé à toutes les années"
                    ]);
                } else {
                    Organisme::where('nom', $sourceOrg->nom)->update(['is_favorite' => false]);
                    return response()->json([
                        'status' => 'success',
                        'message' => "⭐ Favori retiré"
                    ]);
                }
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get years that have cotisations data
     */
    public function getYearsWithData()
    {
        try {
            $years = Organisme::select('annee')
                ->distinct()
                ->orderBy('annee', 'desc')
                ->pluck('annee')
                ->toArray();
            
            return response()->json($years);
        } catch (\Exception $e) {
            \Log::error('Erreur getYearsWithData: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}