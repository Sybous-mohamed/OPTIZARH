<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Role;
use App\Models\SuperAdmin\Grade;
use App\Models\SuperAdmin\Echelle;
use App\Models\SuperAdmin\Echelon;

use Barryvdh\DomPDF\Facade\Pdf; 

class GestionEtatController extends Controller
{

    public function getByYear($year)
    {
        try {
            $data = SalaryYear::with(['roles.grades.echelles.echelons'])
                ->where('year', $year)
                ->first();

            if (!$data) {
                return response()->json(['year' => (int)$year, 'roles' => []]);
            }

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required',
            'roles' => 'required|array'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $salaryYear = SalaryYear::updateOrCreate(
                    ['year' => $request->year],
                    ['is_active' => true]
                );
                $salaryYear->roles()->delete();
                foreach ($request->roles as $rData) {
                    $role = $salaryYear->roles()->create([
                        'name' => $rData['name']
                    ]);

                    foreach ($rData['grades'] ?? [] as $gData) {
                        $grade = $role->grades()->create([
                            'name' => $gData['name']
                        ]);

                        foreach ($gData['echelles'] ?? [] as $echData) {
                            $echelle = $grade->echelles()->create([
                                'level' => $echData['level'] ?? $echData['name'] ?? '10'
                            ]);

                            foreach ($echData['echelons'] ?? [] as $eclData) {
                                $echelle->echelons()->create([
                                    'order' => $eclData['order'],
                                    'index_val' => $eclData['index_val'],
                                    'salary' => $eclData['salary']
                                ]);
                            }
                        }
                    }
                }
                
                return response()->json(['message' => 'Configuration enregistrée avec succès'], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function exportPDF($year)
    {
        try {
            $data = SalaryYear::with(['roles.grades.echelles.echelons'])
                ->where('year', $year)
                ->first();

            if (!$data) {
                $data = (object) ['year' => $year, 'roles' => [], 'message' => 'Aucune configuration trouvée'];
            }

            $pdf = Pdf::loadView('pdf.grille_salariale', [
                'data' => $data,
                'year' => $year,
                'date' => now()->format('d/m/Y')
            ]);
            
            $pdf->setPaper('a4', 'landscape');
            
            return $pdf->download("grille_salariale_{$year}.pdf");
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }



// ==========================================================
    //          FONCTIONS DE SUPPRESSION (DELETE ALL)
    // ==========================================================

    /** Mse7 Role */
    public function destroyRole($id) {
        $item = Role::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Role supprimé']);
    }

    /** Mse7 Grade */
    public function destroyGrade($id) {
        $item = Grade::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Grade supprimé']);
    }

    /** Mse7 Echelle */
    public function destroyEchelle($id) {
        $item = Echelle::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Echelle supprimée']);
    }

    /** Mse7 Echelon */
    public function destroyEchelon($id) {
        $item = Echelon::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Echelon supprimé']);
    }
    

    // ==========================================================
    //            LES FONCTIONS GET PAR PARTIE
    // ==========================================================
    public function getYears()
    {
        // ghadi n-jbdou ga3 l-a3wam li f l-base de données
        return response()->json(\App\Models\SuperAdmin\SalaryYear::all());
    }
    public function getRoles($yearId)
    {
        $roles = Role::where('salary_year_id', $yearId)->get();
        return response()->json($roles);
    }

    public function getGrades($roleId)
    {
        $grades = Grade::where('role_id', $roleId)->get();
        return response()->json($grades);
    }

    public function getEchelles($gradeId)
    {
        $echelles = Echelle::with('echelons')->where('grade_id', $gradeId)->get();
        return response()->json($echelles);
    }

    public function getEchelons($echelleId)
    {
        $echelons = Echelon::where('echelle_id', $echelleId)
            ->orderBy('order', 'asc')
            ->get();
        return response()->json($echelons);
    }


    public function getRoleDetails($roleId)
    {
        $role = Role::with(['grades.echelles.echelons'])->find($roleId);
        
        if (!$role) {
            return response()->json(['message' => 'Role non trouvé'], 404);
        }

        return response()->json($role);
    }
    
    public function getGradeDetails($gradeId)
    {
        $grade = Grade::with(['echelles.echelons'])->find($gradeId);
        
        if (!$grade) {
            return response()->json(['message' => 'Grade non trouvé'], 404);
        }

        return response()->json($grade);
    }

    public function getEchelonDetails($id)
    {
        $echelon = Echelon::find($id);
        if (!$echelon) {
            return response()->json(['message' => 'Echelon non trouvé'], 404);
        }
        return response()->json($echelon);
    }
}