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

            $this->logActivity(
                'Consultation cotisations',
                'READ',
                "Récupération des cotisations pour l'année {$year}"
            );

            return response()->json($formatted);
        } catch (\Exception $e) {
            \Log::error('Erreur index cotisations: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

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
            
            Organisme::where('annee', $year)->delete();

            $orgCount = 0;

            foreach ($organismes as $orgData) {
                if (empty($orgData['name'])) {
                    continue;
                }
                
                $organisme = Organisme::create([
                    'nom'   => $orgData['name'],
                    'is_favorite' => isset($orgData['is_favorite']) ? (bool)$orgData['is_favorite'] : false,
                    'annee' => $year,
                ]);
                $orgCount++;
                
                $rubriques = isset($orgData['rubriques']) ? $orgData['rubriques'] : [];
                foreach ($rubriques as $rub) {
                    $taux = isset($rub['taux']) && $rub['taux'] !== '' ? floatval($rub['taux']) : 0;
                    $plafond = isset($rub['plafond']) && $rub['plafond'] !== '' ? floatval($rub['plafond']) : null;
                    $label = isset($rub['label']) ? $rub['label'] : 'Sans Désignation';
                    
                    $organisme->cotisations()->create([
                        'name'    => $label,
                        'taux'    => $taux,
                        'plafond' => $plafond,
                    ]);
                }
            }
            
            DB::commit();

            $this->logActivity(
                'Configuration cotisations',
                'UPDATE',
                "Mise à jour des cotisations pour l'année {$year} ({$orgCount} organisme(s))"
            );
            
            return response()->json(['message' => 'Configuration enregistrée avec succès'], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Store error: ' . $e->getMessage());
            $this->logActivity(
                'Configuration cotisations',
                'ERROR',
                "Erreur lors de l'enregistrement: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyOrganisme($id)
    {
        try {
            $organisme = Organisme::findOrFail($id);
            $orgName = $organisme->nom;
            $annee = $organisme->annee;
            $organisme->delete();
            
            $this->logActivity(
                'Suppression organisme',
                'DELETE',
                "Suppression de l'organisme '{$orgName}' pour l'année {$annee}"
            );
            
            return response()->json(['message' => 'Organisme supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyRubrique($id)
    {
        try {
            $cotisation = Cotisation::findOrFail($id);
            $cotName = $cotisation->name;
            $cotisation->delete();
            
            $this->logActivity(
                'Suppression rubrique cotisation',
                'DELETE',
                "Suppression de la rubrique : {$cotName}"
            );
            
            return response()->json(['message' => 'Rubrique supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function toggleFavorite(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $sourceOrg = Organisme::with('cotisations')->find($id);

                if (!$sourceOrg) {
                    return response()->json(['error' => 'Organisme introuvable'], 404);
                }

                $isFavorite = (bool) $request->input('is_favorite');
                $oldStatus = $sourceOrg->is_favorite;
                $sourceOrg->update(['is_favorite' => $isFavorite]);

                if ($isFavorite) {
                    $allYears = SalaryYear::pluck('year')->toArray();
                    $copiedCount = 0;

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
                        $copiedCount++;
                    }
                    
                    $this->logActivity(
                        'Cotisation Favori',
                        'UPDATE',
                        "Propagation de l'organisme '{$sourceOrg->nom}' vers {$copiedCount} année(s)"
                    );
                    
                    return response()->json([
                        'status' => 'success',
                        'message' => "⭐ L'organisme a été propagé à toutes les années"
                    ]);
                } else {
                    Organisme::where('nom', $sourceOrg->nom)->update(['is_favorite' => false]);
                    $this->logActivity(
                        'Cotisation Favori',
                        'UPDATE',
                        "Retrait du favori pour l'organisme '{$sourceOrg->nom}'"
                    );
                    
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

    public function getYearsWithData()
    {
        try {
            $years = Organisme::select('annee')
                ->distinct()
                ->orderBy('annee', 'desc')
                ->pluck('annee')
                ->toArray();
            
            $this->logActivity(
                'Consultation années cotisations',
                'READ',
                'Récupération des années avec données cotisations'
            );
            
            return response()->json($years);
        } catch (\Exception $e) {
            \Log::error('Erreur getYearsWithData: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}