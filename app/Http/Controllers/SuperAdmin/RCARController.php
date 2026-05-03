<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\RcarType;
use App\Models\SuperAdmin\RcarDetail;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RcarController extends Controller
{
    // 1. GET: Récupérer la configuration
    public function getConfiguration($year)
    {
        $config = SalaryYear::where('year', $year)
            ->with(['rcarTypes' => function($query) {
                $query->select('id', 'salary_year_id', 'label', 'is_favorite');
            }, 'rcarTypes.details'])
            ->first();

        if (!$config) {
            return response()->json(['message' => 'Aucune configuration trouvée', 'rcar_types' => []], 200);
        }

        $this->logActivity(
            'Consultation RCAR',
            'READ',
            "Récupération de la configuration RCAR pour l'année {$year}"
        );

        return response()->json($config);
    }

    public function saveConfiguration(Request $request)
    {
        $validated = $request->validate([
            'salary_year_id' => 'required|exists:salary_years,id',
            'types' => 'required|array',
            'types.*.label' => 'required|string',
            'types.*.details' => 'array',
        ]);

        return DB::transaction(function () use ($validated) {
            // Supprimer l'ancienne config pour cette année
            RcarType::where('salary_year_id', $validated['salary_year_id'])->delete();

            $typesCount = 0;

            foreach ($validated['types'] as $typeData) {
                // Check if this label is favorite in ANY other year
                $isFav = RcarType::whereRaw('LOWER(label) = ?', [strtolower($typeData['label'])])
                                 ->where('is_favorite', true)
                                 ->exists();

                $type = RcarType::create([
                    'salary_year_id' => $validated['salary_year_id'],
                    'label' => $typeData['label'],
                    'is_favorite' => $isFav
                ]);
                $typesCount++;

                if (!empty($typeData['details'])) {
                    foreach ($typeData['details'] as $detail) {
                        RcarDetail::create([
                            'rcar_type_id' => $type->id,
                            'designation' => $detail['designation'] ?? $detail['name'] ?? '',
                            'plafond' => $detail['plafond'] ?? null,
                            'percentage' => $detail['percentage'] ?? 0,
                        ]);
                    }
                }
            }

            $year = SalaryYear::find($validated['salary_year_id'])?->year;
            
            $this->logActivity(
                'Configuration RCAR',
                'UPDATE',
                "Mise à jour de la configuration RCAR pour l'année {$year} ({$typesCount} type(s))"
            );

            return response()->json(['message' => 'Paramétrage RCAR enregistré']);
        });
    }

    public function toggleFavorite(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {

            $sourceType = RcarType::with('details')->findOrFail($id);
            $isFavorite = $request->input('is_favorite');
            $oldStatus = $sourceType->is_favorite;
            $sourceType->update(['is_favorite' => $isFavorite]);
            
            if ($isFavorite) {
                $otherYears = SalaryYear::where('id', '!=', $sourceType->salary_year_id)->get();
                $copiedCount = 0;

                foreach ($otherYears as $year) {
                    $existing = RcarType::where('salary_year_id', $year->id)
                                        ->where('label', $sourceType->label)
                                        ->first();
                    if ($existing) {
                        $existing->delete(); 
                    }

                    $newType = RcarType::create([
                        'salary_year_id' => $year->id,
                        'label'          => $sourceType->label,
                        'is_favorite'    => true
                    ]);

                    foreach ($sourceType->details as $detail) {
                        RcarDetail::create([
                            'rcar_type_id' => $newType->id,
                            'designation'  => $detail->designation,
                            'type' => $detail['type'] ?? 'salariale', 
                            'plafond'      => $detail->plafond,
                            'percentage'   => $detail->percentage,
                        ]);
                    }
                    $copiedCount++;
                }
                
                $this->logActivity(
                    'RCAR Favori',
                    'UPDATE',
                    "Propagation du type RCAR '{$sourceType->label}' vers {$copiedCount} année(s)"
                );
            } else {
                RcarType::where('label', $sourceType->label)->update(['is_favorite' => false]);
                $this->logActivity(
                    'RCAR Favori',
                    'UPDATE',
                    "Retrait du favori pour le type RCAR '{$sourceType->label}'"
                );
            }

            return response()->json(['message' => 'Configuration propagée avec succès']);
        });
    }

    public function deleteType($id) {
        $type = RcarType::find($id);
        $typeName = $type ? $type->label : 'Inconnu';
        RcarType::destroy($id);
        
        $this->logActivity(
            'Suppression type RCAR',
            'DELETE',
            "Suppression du type RCAR : {$typeName}"
        );
        
        return response()->json(['message' => 'Type supprimé']);
    }

    public function deleteDetail($id) {
        $detail = RcarDetail::find($id);
        $detailName = $detail ? $detail->designation : 'Inconnu';
        RcarDetail::destroy($id);
        
        $this->logActivity(
            'Suppression détail RCAR',
            'DELETE',
            "Suppression de la ligne RCAR : {$detailName}"
        );
        
        return response()->json(['message' => 'Ligne supprimée']);
    }
    
    public function getYearsWithData()
    {
        $yearsWithData = DB::table('rcar_types')
            ->join('salary_years', 'rcar_types.salary_year_id', '=', 'salary_years.id')
            ->select('salary_years.id', 'salary_years.year')
            ->distinct()
            ->orderBy('salary_years.year', 'desc')
            ->get();
        
        $this->logActivity(
            'Consultation années RCAR',
            'READ',
            'Récupération des années avec données RCAR'
        );
        
        return response()->json($yearsWithData);
    }
}