<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\SalaryYear;
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
        
        $this->logActivity(
            'Consultation SNTL',
            'READ',
            "Récupération des configurations SNTL pour l'année_id: {$yearId}"
        );
        
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
            'configs.*.Post_id' => 'nullable|integer', 
            'configs.*.grade_id' => 'nullable|integer',
            'configs.*.echelle_id' => 'nullable|integer',
            'configs.*.echelon_id' => 'nullable|integer',
            'configs.*.is_active' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $oldCount = SntlSetting::where('salary_year_id', $data['salary_year_id'])->count();
            SntlSetting::where('salary_year_id', $data['salary_year_id'])->delete();

            $newCount = 0;
            foreach ($data['configs'] as $conf) {
                SntlSetting::create([
                    'salary_year_id'  => $data['salary_year_id'],
                    'label'           => $conf['label'],
                    'valeur'          => $conf['valeur'],
                    'type_montant'    => $conf['type_montant'],
                    'categorie_cible' => $conf['categorie_cible'],
                    'Post_id'         => $conf['Post_id'] ?? null, 
                    'grade_id'        => $conf['grade_id'] ?? null,
                    'echelle_id'      => $conf['echelle_id'] ?? null,
                    'echelon_id'      => $conf['echelon_id'] ?? null,
                    'is_active'       => $conf['is_active'] ?? true,
                ]);
                $newCount++;
            }

            DB::commit();

            $this->logActivity(
                'Configuration SNTL',
                'UPDATE',
                "Mise à jour SNTL ({$oldCount} → {$newCount} configuration(s))"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Paramétrage SNTL enregistré avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logActivity(
                'Configuration SNTL',
                'ERROR',
                "Erreur lors de l'enregistrement: " . $e->getMessage()
            );
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
        $configLabel = $config->label;
        $config->delete();

        $this->logActivity(
            'Suppression SNTL',
            'DELETE',
            "Suppression de la configuration SNTL: {$configLabel}"
        );

        return response()->json(['message' => 'Configuration supprimée avec succès']);
    }

    /**
     * Helper pour récupérer la liste des années (Optional)
     */
    public function getAvailableYears(){
        $years = SalaryYear::orderBy('year', 'desc')->get();
        
        $this->logActivity(
            'Consultation années SNTL',
            'READ',
            'Récupération des années disponibles pour SNTL'
        );
        
        return response()->json($years);
    }

    /**
     * Get years that have SNTL data (with fallback)
     */
    public function getYearsWithData()
    {
        try {
            $yearsWithData = DB::table('sntl_configs')
                ->join('salary_years', 'sntl_configs.salary_year_id', '=', 'salary_years.id')
                ->select('salary_years.id', 'salary_years.year')
                ->distinct()
                ->orderBy('salary_years.year', 'desc')
                ->get();
            
            if ($yearsWithData->isEmpty()) {
                $allYears = SalaryYear::orderBy('year', 'desc')->get();
                return response()->json($allYears);
            }
            
            $this->logActivity(
                'Consultation années SNTL',
                'READ',
                'Récupération des années avec données SNTL'
            );
            
            return response()->json($yearsWithData);
            
        } catch (\Exception $e) {
            $allYears = SalaryYear::orderBy('year', 'desc')->get();
            return response()->json($allYears);
        }
    }
    
    public function getByYear($year)
    {
        try {
            $yearObj = SalaryYear::where('year', $year)->first();
            if (!$yearObj) {
                return response()->json([]);
            }
            
            $configs = SntlSetting::where('salary_year_id', $yearObj->id)
                ->where('is_active', true)
                ->get();
            
            return response()->json($configs);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }
}