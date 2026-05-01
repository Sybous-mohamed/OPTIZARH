<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\SalaryYear; // Bach ila bghiti t-valider year id
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SntlSettingController extends Controller
{
    /**
     * Get configurations for a specific salary year
     */
    public function index(Request $request){
        $yearId = $request->query('year_id');

        if (!$yearId) {
            return response()->json(['error' => 'Le paramètre year_id est requis'], 400);
        }

        $configs = SntlSetting::where('salary_year_id', $yearId)->get();
        return response()->json($configs);
    }

    /**
     * Save or Update configurations for a specific year
     */
    public function store(Request $request){
        $data = $request->validate([
            'salary_year_id' => 'required|exists:salary_years,id',
            'configs' => 'required|array',
            'configs.*.label' => 'required|string',
            'configs.*.valeur' => 'required|numeric',
            'configs.*.type_montant' => 'required|in:fixe,pourcentage',
            'configs.*.categorie_cible' => 'required|string',
            // optional fields
            'configs.*.grade_id' => 'nullable|integer',
            'configs.*.echelle_id' => 'nullable|integer',
            'configs.*.echelon_id' => 'nullable|integer',
            'configs.*.is_active' => 'boolean',
        ]);

        try {
            // Transaction bach ila tra chi moshkil f l-loop may-t-msah walo
            DB::beginTransaction();

            // 1. N-mshou l-config l-9dam dial had l-3am spécifique
            SntlSetting::where('salary_year_id', $data['salary_year_id'])->delete();

            // 2. N-insertiw l-config jdad
            foreach ($data['configs'] as $conf) {
                SntlSetting::create([
                    'salary_year_id'  => $data['salary_year_id'],
                    'label'           => $conf['label'],
                    'valeur'          => $conf['valeur'],
                    'type_montant'    => $conf['type_montant'],
                    'categorie_cible' => $conf['categorie_cible'],
                    'grade_id'        => $conf['grade_id'] ?? null,
                    'echelle_id'      => $conf['echelle_id'] ?? null,
                    'echelon_id'      => $conf['echelon_id'] ?? null,
                    'is_active'       => $conf['is_active'] ?? true,
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Paramétrage SNTL enregistré avec succès pour l’année sélectionnée'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Une erreur est survenue lors de l’enregistrement',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single configuration line
     */
    public function destroy($id){
        $config = SntlSetting::findOrFail($id);
        $config->delete();

        return response()->json(['message' => 'Configuration supprimée avec succès']);
    }

    /**
     * Helper pour récupérer la liste des années (Optional)
     * Bach t-khdem biha f l-frontend f dak l-select
     */
    public function getAvailableYears(){
        $years = SalaryYear::orderBy('year', 'desc')->get();
        return response()->json($years);
    }
/**
 * Get years that have SNTL data (with fallback)
 */
public function getYearsWithData()
{
    try {
        // Récupérer les années avec données
        $yearsWithData = DB::table('sntl_configs')
            ->join('salary_years', 'sntl_configs.salary_year_id', '=', 'salary_years.id')
            ->select('salary_years.id', 'salary_years.year')
            ->distinct()
            ->orderBy('salary_years.year', 'desc')
            ->get();
        
        // Si aucune donnée, retourner toutes les années
        if ($yearsWithData->isEmpty()) {
            $allYears = SalaryYear::orderBy('year', 'desc')->get();
            return response()->json($allYears);
        }
        
        return response()->json($yearsWithData);
        
    } catch (\Exception $e) {
        // En cas d'erreur, retourner toutes les années
        $allYears = SalaryYear::orderBy('year', 'desc')->get();
        return response()->json($allYears);
    }
}
}