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
                // IMPORTANT: 'salary_year_id' khass ikoun hna bach t-khedem l-relation
                $query->select('id', 'salary_year_id', 'label', 'is_favorite');
            }, 'rcarTypes.details'])
            ->first();

        if (!$config) {
            return response()->json(['message' => 'Aucune configuration trouvée', 'rcar_types' => []], 200);
        }

        return response()->json($config);
    }

    // 2. SAVE: Sauvegarder (avec persistance du favori)
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
            return response()->json(['message' => 'Paramétrage RCAR enregistré']);
        });
    }

    // 3. TOGGLE FAVORITE: Appliquer à toutes les années
    public function toggleFavorite(Request $request, $id)
{
    return DB::transaction(function () use ($request, $id) {
        // 1. Kan-jibou l-organisme l-asli (l-source) m3a les détails dyalo
        $sourceType = RcarType::with('details')->findOrFail($id);
        $isFavorite = $request->input('is_favorite');

        // 2. Updati l-source hwa l-owl
        $sourceType->update(['is_favorite' => $isFavorite]);

        // 3. ILA KAN IS_FAVORITE = TRUE, ghadi n-copiawh l-ga3 les années
        if ($isFavorite) {
            // Njibou ga3 les années (SalaryYear) men ghir had l-3am li hna fih
            $otherYears = SalaryYear::where('id', '!=', $sourceType->salary_year_id)->get();

            foreach ($otherYears as $year) {
                // a. N-meshou ila fayt kan 3ndu chi config b nefs l-label f dak l-3am
                $existing = RcarType::where('salary_year_id', $year->id)
                                    ->where('label', $sourceType->label)
                                    ->first();
                if ($existing) {
                    $existing->delete(); // delete() ghadi imseh hta les details (cascade)
                }

                // b. N-creeyi l-organisme jdid f dak l-3am
                $newType = RcarType::create([
                    'salary_year_id' => $year->id,
                    'label'          => $sourceType->label,
                    'is_favorite'    => true
                ]);

                // c. N-copiaw les détails kamlin
                foreach ($sourceType->details as $detail) {
                    RcarDetail::create([
                        'rcar_type_id' => $newType->id,
                        'designation'  => $detail->designation,
                        'plafond'      => $detail->plafond,
                        'percentage'   => $detail->percentage,
                    ]);
                }
            }
        } else {
            // ILA REDITIHA FALSE: ghadi n-updatiw ghir l-statut f ga3 les années
            RcarType::where('label', $sourceType->label)->update(['is_favorite' => false]);
        }

        return response()->json(['message' => 'Configuration propagée avec succès']);
    });
}

    public function deleteType($id) {
        RcarType::destroy($id);
        return response()->json(['message' => 'Type supprimé']);
    }

    public function deleteDetail($id) {
        RcarDetail::destroy($id);
        return response()->json(['message' => 'Ligne supprimée']);
    }
}