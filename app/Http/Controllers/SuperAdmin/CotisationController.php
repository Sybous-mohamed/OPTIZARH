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
    // app/Http/Controllers/Api/CotisationController.php
public function store(Request $request)
{
    $request->validate([
        'year' => 'required',
        'organismes' => 'required|array',
    ]);

    try {
        return DB::transaction(function () use ($request) {
            // N-ms7o l-qdim
            Organisme::where('annee', $request->year)->delete();

            foreach ($request->organismes as $orgData) {
                $organisme = Organisme::create([
                    'nom'   => $orgData['name'] ?? 'Sans Nom', 
                    'is_favorite' => $orgData['is_favorite'] ?? false,
                    'annee' => $request->year,
                ]);

                if (isset($orgData['rubriques']) && is_array($orgData['rubriques'])) {
                    foreach ($orgData['rubriques'] as $cot) {
                        $organisme->cotisations()->create([
                            'type'    => $cot['type'] ?? 'Social',
                            'name'    => $cot['label'] ?? $cot['name'] ?? 'Sans Désignation', 
                            // FIX HNA: T-akked anaho number o machi string khawya
                            'taux'    => (isset($cot['taux']) && $cot['taux'] !== '') ? $cot['taux'] : 0,
                            'plafond' => (isset($cot['plafond']) && $cot['plafond'] !== '') ? $cot['plafond'] : null,
                        ]);
                    }
                }
            }
            return response()->json(['message' => 'Success'], 201);
        });
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function index(Request $request)
{
    $year = $request->query('year');

    // Kan-jibo l-organismes m3a l-cotisations dyalhom (Eager Loading)
    $organismes = Organisme::with('cotisations')
        ->where('annee', $year)
        ->get();

    // Rejja3 l-data m-mappya bhal l-format dyal React state
    $formatted = $organismes->map(function ($org) {
        return [
            'id' => $org->id,
            'name' => $org->nom,
            'is_favorite' => (bool)$org->is_favorite,
            'rubriques' => $org->cotisations->map(function ($cot) {
                return [
                    'id' => $cot->id,
                    'label' => $cot->name, // React kayshufo b 'label'
                    'type' => $cot->type,
                    'taux' => $cot['taux'],
                    'plafond' => $cot['plafond'],
                ];
            })
        ];
    });

    return response()->json($formatted);
}

// Delete Organisme kamel
public function destroyOrganisme($id) {
    Organisme::findOrFail($id)->delete();
    return response()->json(['message' => 'Organisme supprimé']);
}

// Delete gher Rubrique wa7da
public function destroyRubrique($id) {
    Cotisation::findOrFail($id)->delete();
    return response()->json(['message' => 'Rubrique supprimée']);
}
public function toggleFavorite(Request $request, $id)
{
    return DB::transaction(function () use ($request, $id) {
        // 1. Qleb 3la l-organisme b l-ID hwa l-owl
        $sourceOrg = Organisme::with('cotisations')->find($id);

        // 2. Ila malqitich l-ID (hit t-msah f l-Store), qleb b l-ism w l-annee
        if (!$sourceOrg) {
            $sourceOrg = Organisme::with('cotisations')
                ->where('nom', $request->input('name'))
                ->where('annee', $request->input('year'))
                ->first();
        }

        if (!$sourceOrg) {
            return response()->json(['error' => 'Organisme introuvable. Veuillez rafraîchir.'], 404);
        }

        $isFavorite = (bool) $request->input('is_favorite');

        // 3. Update l-status dyal l-organisme li hna fih daba
        $sourceOrg->update(['is_favorite' => $isFavorite]);

        if ($isFavorite) {
            // 4. Jib ga3 l-sanawat mn table salary_years
            // Hna sta3melna 'year' hit hiya li derti f l-Seeder dyalk
            $allYears = SalaryYear::pluck('year')->toArray();

            foreach ($allYears as $yearValue) {
                // Mat-3awedch t-khdem 3la l-3am li knti fih aslan
                if ($yearValue == $sourceOrg->annee) continue;

                // 5. N-msah l-version l-qdima f dik l-annee (ila kant) bach n-tfadaw duplication
                Organisme::where('annee', $yearValue)
                    ->where('nom', $sourceOrg->nom)
                    ->delete();

                // 6. Creeyi copy jdida favoris f l-3am l-target
                $newOrg = Organisme::create([
                    'annee'       => $yearValue,
                    'nom'         => $sourceOrg->nom,
                    'is_favorite' => true
                ]);

                // 7. Copier ga3 les cotisations (rubriques) dyal l-source
                foreach ($sourceOrg->cotisations as $cot) {
                    $newOrg->cotisations()->create([
                        'name'    => $cot->name,
                        'type'    => $cot->type,
                        'taux'    => $cot->taux,
                        'plafond' => $cot->plafond,
                    ]);
                }
            }
        } else {
            // 8. Ila hyedti favorite, hyed l-star mn ga3 l-sanawat l-khrin
            Organisme::where('nom', $sourceOrg->nom)
                ->update(['is_favorite' => false]);
        }

        return response()->json([
            'status' => 'success', 
            'message' => $isFavorite ? 'Propagé avec succès' : 'Statut favori retiré'
        ]);
    });
}

}