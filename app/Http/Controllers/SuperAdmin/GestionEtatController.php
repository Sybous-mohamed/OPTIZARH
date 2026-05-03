<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Role;
use App\Models\SuperAdmin\Grade;
use App\Models\SuperAdmin\Echelle;
use App\Models\SuperAdmin\Echelon;
use Barryvdh\DomPDF\Facade\Pdf;

class GestionEtatController extends Controller
{

    // ==========================================================
    //                    FONCTIONS PRINCIPALES
    // ==========================================================

    public function getByYear($year)
    {
        try {
            $data = SalaryYear::with(['roles.grades.echelles.echelons'])
                ->where('year', $year)
                ->first();

            if (!$data) {
                return response()->json(['year' => (int) $year, 'roles' => []]);
            }

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:1900|max:2200',
            'roles' => 'required|array|min:1',
            'roles.*.name' => 'required|string|min:1',
            'roles.*.grades' => 'required|array|min:1',
            'roles.*.grades.*.name' => 'required|string|min:1',
            'roles.*.grades.*.echelles' => 'required|array|min:1',
            'roles.*.grades.*.echelles.*.level' => 'required|string|min:1',
            'roles.*.grades.*.echelles.*.echelons' => 'required|array|min:1',
            'roles.*.grades.*.echelles.*.echelons.*.salary' => 'required|numeric|min:0',
            'roles.*.grades.*.echelles.*.echelons.*.index_val' => 'required|numeric|min:0',
            'roles.*.grades.*.echelles.*.echelons.*.order' => 'required|numeric|min:1',
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

                Cache::forget('salary_years');
                Cache::forget('starred_roles');

                $this->logActivity(
                    'Configuration des salaires',
                    'CREATE',
                    "Configuration de l'année {$request->year} enregistrée avec " . count($request->roles) . " poste(s)"
                );

                return response()->json(['message' => 'Configuration enregistrée avec succès'], 201);
            });
        } catch (\Exception $e) {
            $this->logActivity(
                'Configuration des salaires',
                'ERROR',
                "Erreur lors de l'enregistrement de l'année {$request->year}: " . $e->getMessage()
            );
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

            $this->logActivity(
                'Export PDF',
                'EXPORT',
                "Export PDF de la grille salariale pour l'année {$year}"
            );

            return $pdf->download("grille_salariale_{$year}.pdf");

        } catch (\Exception $e) {
            $this->logActivity(
                'Export PDF',
                'ERROR',
                "Erreur lors de l'export PDF pour l'année {$year}: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================================
    //              GESTION DES ANNÉES (NOUVEAU)
    // ==========================================================

    // Ajouter une nouvelle année
    public function addYear(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:1900|max:2200|unique:salary_years,year',
            'copy_from_year' => 'nullable|integer|exists:salary_years,year'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $year = $request->year;
                $copyFromYear = $request->copy_from_year;

                // Créer l'année
                $salaryYear = SalaryYear::create([
                    'year' => $year,
                    'is_active' => true
                ]);

                // Si on doit copier depuis une autre année
                if ($copyFromYear) {
                    $sourceYear = SalaryYear::where('year', $copyFromYear)
                        ->with(['roles.grades.echelles.echelons'])
                        ->first();

                    if ($sourceYear) {
                        foreach ($sourceYear->roles as $role) {
                            $newRole = $salaryYear->roles()->create([
                                'name' => $role->name,
                                'is_starred' => $role->is_starred
                            ]);

                            foreach ($role->grades as $grade) {
                                $newGrade = $newRole->grades()->create([
                                    'name' => $grade->name
                                ]);

                                foreach ($grade->echelles as $echelle) {
                                    $newEchelle = $newGrade->echelles()->create([
                                        'level' => $echelle->level
                                    ]);

                                    foreach ($echelle->echelons as $echelon) {
                                        $newEchelle->echelons()->create([
                                            'order' => $echelon->order,
                                            'index_val' => $echelon->index_val,
                                            'salary' => $echelon->salary
                                        ]);
                                    }
                                }
                            }
                        }
                        $message = "Année {$year} créée avec copie depuis {$copyFromYear}";
                    } else {
                        $message = "Année {$year} créée sans copie (source non trouvée)";
                    }
                } else {
                    $message = "Année {$year} créée avec succès";
                }

                Cache::forget('salary_years');

                $this->logActivity(
                    'Gestion des années',
                    'CREATE',
                    "Ajout de l'année {$year}" . ($copyFromYear ? " (copiée depuis {$copyFromYear})" : "")
                );

                return response()->json([
                    'message' => $message,
                    'year' => $salaryYear
                ], 201);
            });
        } catch (\Exception $e) {
            $this->logActivity(
                'Gestion des années',
                'ERROR',
                "Erreur lors de l'ajout de l'année {$request->year}: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function checkYearExists($year)
    {
        try {
            $exists = SalaryYear::where('year', $year)->exists();
            return response()->json(['exists' => $exists]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getAllYears()
    {
        try {
            $years = SalaryYear::orderBy('year', 'desc')->get();
            return response()->json($years);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function copyYear($fromYear, $toYear)
    {
        try {
            return DB::transaction(function () use ($fromYear, $toYear) {
                if (SalaryYear::where('year', $toYear)->exists()) {
                    return response()->json(['error' => "L'année {$toYear} existe déjà"], 422);
                }

                $sourceYear = SalaryYear::where('year', $fromYear)
                    ->with(['roles.grades.echelles.echelons'])
                    ->first();

                if (!$sourceYear) {
                    return response()->json(['error' => 'Année source non trouvée'], 404);
                }

                $targetYear = SalaryYear::create([
                    'year' => $toYear,
                    'is_active' => true
                ]);

                foreach ($sourceYear->roles as $role) {
                    $newRole = $targetYear->roles()->create([
                        'name' => $role->name,
                        'is_starred' => $role->is_starred
                    ]);

                    foreach ($role->grades as $grade) {
                        $newGrade = $newRole->grades()->create([
                            'name' => $grade->name
                        ]);

                        foreach ($grade->echelles as $echelle) {
                            $newEchelle = $newGrade->echelles()->create([
                                'level' => $echelle->level
                            ]);

                            foreach ($echelle->echelons as $echelon) {
                                $newEchelle->echelons()->create([
                                    'order' => $echelon->order,
                                    'index_val' => $echelon->index_val,
                                    'salary' => $echelon->salary
                                ]);
                            }
                        }
                    }
                }

                Cache::forget('salary_years');

                $this->logActivity(
                    'Copie configuration',
                    'CREATE',
                    "Copie de la configuration de {$fromYear} vers {$toYear}"
                );

                return response()->json(['message' => "Configuration copiée de {$fromYear} vers {$toYear}"]);
            });
        } catch (\Exception $e) {
            $this->logActivity(
                'Copie configuration',
                'ERROR',
                "Erreur lors de la copie: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Statistiques rapides pour une année
    public function getStats($year)
    {
        try {
            $salaryYear = SalaryYear::where('year', $year)->first();

            if (!$salaryYear) {
                return response()->json([
                    'total_roles' => 0,
                    'total_grades' => 0,
                    'total_echelles' => 0,
                    'total_echelons' => 0,
                    'total_salary_mass' => 0
                ]);
            }

            $roleIds = $salaryYear->roles()->pluck('id');
            $gradeIds = Grade::whereIn('role_id', $roleIds)->pluck('id');
            $echelleIds = Echelle::whereIn('grade_id', $gradeIds)->pluck('id');

            $totalRoles = $roleIds->count();
            $totalGrades = $gradeIds->count();
            $totalEchelles = $echelleIds->count();
            $totalEchelons = Echelon::whereIn('echelle_id', $echelleIds)->count();
            $totalSalaryMass = Echelon::whereIn('echelle_id', $echelleIds)->sum('salary');

            return response()->json([
                'total_roles' => $totalRoles,
                'total_grades' => $totalGrades,
                'total_echelles' => $totalEchelles,
                'total_echelons' => $totalEchelons,
                'total_salary_mass' => $totalSalaryMass
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================================
    //          FONCTIONS DE SUPPRESSION
    // ==========================================================

    public function destroyRole($id)
    {
        try {
            $item = Role::findOrFail($id);
            $roleName = $item->name;
            $year = $item->salaryYear->year ?? 'N/A';
            foreach ($item->grades as $grade) {
                foreach ($grade->echelles as $echelle) {
                    $echelle->echelons()->delete();
                }
                $grade->echelles()->delete();
            }
            $item->grades()->delete();
            $item->delete();
            Cache::forget('starred_roles');

            $this->logActivity(
                'Suppression poste',
                'DELETE',
                "Suppression du poste '{$roleName}' pour l'année {$year}"
            );

            return response()->json(['message' => 'Poste et toutes ses données supprimés avec succès']);
        } catch (\Exception $e) {
            $this->logActivity(
                'Suppression poste',
                'ERROR',
                "Erreur lors de la suppression: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyGrade($id)
    {
        try {
            $item = Grade::findOrFail($id);

            if ($item->echelles()->count() > 0) {
                return response()->json([
                    'error' => 'Ce grade contient des échelles. Supprimez-les d\'abord.'
                ], 422);
            }

            $gradeName = $item->name;
            $item->delete();

            $this->logActivity(
                'Suppression grade',
                'DELETE',
                "Suppression du grade '{$gradeName}'"
            );

            return response()->json(['message' => 'Grade supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyEchelle($id)
    {
        try {
            $item = Echelle::findOrFail($id);

            if ($item->echelons()->count() > 0) {
                return response()->json([
                    'error' => 'Cette échelle contient des échelons. Supprimez-les d\'abord.'
                ], 422);
            }

            $echelleLevel = $item->level;
            $item->delete();

            $this->logActivity(
                'Suppression échelle',
                'DELETE',
                "Suppression de l'échelle '{$echelleLevel}'"
            );

            return response()->json(['message' => 'Échelle supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyEchelon($id)
    {
        try {
            $item = Echelon::findOrFail($id);
            $echelonOrder = $item->order;
            $item->delete();

            $this->logActivity(
                'Suppression échelon',
                'DELETE',
                "Suppression de l'échelon {$echelonOrder}"
            );

            return response()->json(['message' => 'Échelon supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================================
    //            GESTION DES POSTES ÉTOILÉS
    // ==========================================================

    public function getStarredRoles()
    {
        try {
            $starredRoles = Cache::remember('starred_roles', 86400, function () {
                return Role::where('is_starred', true)
                    ->with(['grades.echelles.echelons'])
                    ->get();
            });

            return response()->json($starredRoles);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function toggleStarredRole($id)
    {
        try {
            $role = Role::findOrFail($id);
            $oldStatus = $role->is_starred;
            $role->is_starred = !$oldStatus;
            $role->save();

            if (!$oldStatus && $role->is_starred) {
                $this->copyRoleToAllYears($role);
                $message = "⭐ Poste '{$role->name}' étoilé et copié vers toutes les années";
            } else if ($oldStatus && !$role->is_starred) {
                $this->removeRoleFromAllOtherYears($role);
                $message = "⭐ Poste '{$role->name}' désétoilé et retiré des autres années";
            } else {
                $message = $role->is_starred ? "⭐ Poste '{$role->name}' étoilé" : "⭐ Poste '{$role->name}' désétoilé";
            }

            Cache::forget('starred_roles');
            $this->logActivity(
                'Poste étoilé',
                'UPDATE',
                $message
            );

            return response()->json([
                'message' => $message,
                'is_starred' => $role->is_starred
            ]);
        } catch (\Exception $e) {
            $this->logActivity(
                'Poste étoilé',
                'ERROR',
                "Erreur lors du toggle star: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function copyRoleToAllYears($role)
    {
        $allYears = SalaryYear::where('id', '!=', $role->salary_year_id)->get();
        $copiedCount = 0;

        foreach ($allYears as $year) {
            $existingRole = Role::where('salary_year_id', $year->id)
                ->where('name', $role->name)
                ->first();

            if (!$existingRole) {
                $newRole = $year->roles()->create([
                    'name' => $role->name,
                    'is_starred' => true
                ]);

                foreach ($role->grades as $grade) {
                    $newGrade = $newRole->grades()->create([
                        'name' => $grade->name
                    ]);

                    foreach ($grade->echelles as $echelle) {
                        $newEchelle = $newGrade->echelles()->create([
                            'level' => $echelle->level
                        ]);

                        foreach ($echelle->echelons as $echelon) {
                            $newEchelle->echelons()->create([
                                'order' => $echelon->order,
                                'index_val' => $echelon->index_val,
                                'salary' => $echelon->salary
                            ]);
                        }
                    }
                }
                $copiedCount++;
            }
        }

        $this->logActivity(
            'Copie poste étoilé',
            'CREATE',
            "Copie du poste '{$role->name}' vers {$copiedCount} année(s)"
        );
    }

    private function removeRoleFromAllOtherYears($role)
    {
        $allYears = SalaryYear::where('id', '!=', $role->salary_year_id)->get();
        $removedCount = 0;

        foreach ($allYears as $year) {
            $existingRole = Role::where('salary_year_id', $year->id)
                ->where('name', $role->name)
                ->first();

            if ($existingRole) {
                $existingRole->delete();
                $removedCount++;
            }
        }

        $this->logActivity(
            'Suppression poste désétoilé',
            'DELETE',
            "Suppression du poste '{$role->name}' de {$removedCount} année(s)"
        );
    }

    // ==========================================================
    //            LES FONCTIONS GET PAR PARTIE
    // ==========================================================

    public function getYears()
    {
        try {
            $years = Cache::remember('salary_years', 3600, function () {
                return SalaryYear::orderBy('year', 'desc')->get();
            });

            return response()->json($years);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getRoles($yearId)
    {
        try {
            $roles = Role::where('salary_year_id', $yearId)->get();
            return response()->json($roles);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getGrades($roleId)
    {
        try {
            $grades = Grade::where('role_id', $roleId)->get();
            return response()->json($grades);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getEchelles($gradeId)
    {
        try {
            $echelles = Echelle::with('echelons')->where('grade_id', $gradeId)->get();
            return response()->json($echelles);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getEchelons($echelleId)
    {
        try {
            $echelons = Echelon::where('echelle_id', $echelleId)
                ->orderBy('order', 'asc')
                ->get();
            return response()->json($echelons);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getRoleDetails($roleId)
    {
        try {
            $role = Role::with(['grades.echelles.echelons'])->find($roleId);

            if (!$role) {
                return response()->json(['message' => 'Rôle non trouvé'], 404);
            }

            return response()->json($role);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getGradeDetails($gradeId)
    {
        try {
            $grade = Grade::with(['echelles.echelons'])->find($gradeId);

            if (!$grade) {
                return response()->json(['message' => 'Grade non trouvé'], 404);
            }

            return response()->json($grade);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getEchelonDetails($id)
    {
        try {
            $echelon = Echelon::find($id);
            if (!$echelon) {
                return response()->json(['message' => 'Échelon non trouvé'], 404);
            }
            return response()->json($echelon);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getYearsWithIndemnites()
    {
        try {
            $yearsWithIndemnites = DB::table('gestion_indemnites')
                ->select('salary_year_id')
                ->distinct()
                ->pluck('salary_year_id')
                ->toArray();

            $years = SalaryYear::whereIn('id', $yearsWithIndemnites)
                ->orderBy('year', 'desc')
                ->get();

            return response()->json($years);
        } catch (\Exception $e) {
            \Log::error('Erreur getYearsWithIndemnites: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function copyYearConfig(Request $request)
    {
        $request->validate([
            'from_year' => 'required|integer',
            'to_year' => 'required|integer|different:from_year'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $sourceYear = SalaryYear::where('year', $request->from_year)
                    ->with(['roles.grades.echelles.echelons'])
                    ->first();

                if (!$sourceYear) {
                    return response()->json(['error' => 'Année source non trouvée'], 404);
                }

                $targetYear = SalaryYear::firstOrCreate(
                    ['year' => $request->to_year],
                    ['is_active' => true]
                );

                if ($targetYear->wasRecentlyCreated === false) {
                    $targetYear->roles()->delete();
                }

                $rolesCount = 0;

                foreach ($sourceYear->roles as $role) {
                    $newRole = $targetYear->roles()->create([
                        'name' => $role->name,
                        'is_starred' => $role->is_starred
                    ]);

                    foreach ($role->grades as $grade) {
                        $newGrade = $newRole->grades()->create([
                            'name' => $grade->name
                        ]);

                        foreach ($grade->echelles as $echelle) {
                            $newEchelle = $newGrade->echelles()->create([
                                'level' => $echelle->level
                            ]);

                            foreach ($echelle->echelons as $echelon) {
                                $newEchelle->echelons()->create([
                                    'order' => $echelon->order,
                                    'index_val' => $echelon->index_val,
                                    'salary' => $echelon->salary
                                ]);
                            }
                        }
                    }
                    $rolesCount++;
                }

                Cache::forget('salary_years');

                $this->logActivity(
                    'Copie configuration',
                    'CREATE',
                    "Copie de la configuration de {$request->from_year} vers {$request->to_year} ({$rolesCount} poste(s))"
                );

                return response()->json([
                    'message' => 'Configuration copiée de ' . $request->from_year . ' vers ' . $request->to_year
                ]);
            });
        } catch (\Exception $e) {
            $this->logActivity(
                'Copie configuration',
                'ERROR',
                "Erreur lors de la copie: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}