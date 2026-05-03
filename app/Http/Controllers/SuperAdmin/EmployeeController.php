<?php
namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\SalaryYear;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;

class EmployeeController extends Controller
{
    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            
            $this->logActivity(
                'Consultation années',
                'READ',
                'Récupération de la liste des années'
            );
            
            return response()->json($annees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getClassification(Request $request)
    {
        $anneeId = $request->annee_id;
        $year = $request->year;
        
        try {
            if ($anneeId) {
                $data = SalaryYear::with(['roles.grades.echelles.echelons'])->find($anneeId);
            } elseif ($year) {
                $data = SalaryYear::with(['roles.grades.echelles.echelons'])
                    ->where('year', $year)
                    ->first();
            } else {
                return response()->json(['error' => 'annee_id or year required'], 400);
            }
            
            $this->logActivity(
                'Consultation classification',
                'READ',
                'Récupération de la classification pour ' . ($year ?? $anneeId)
            );
            
            return response()->json($data ?? ['roles' => []]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $query = Employee::query();

            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('prenom', 'like', "%$search%")
                        ->orWhere('nom', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%");
                });
            }

            if ($request->filled('statut') && $request->statut !== 'Tous') {
                $query->where('statut', $request->statut);
            }

            $employees = $query->orderBy('created_at', 'desc')->paginate(10);
            
            $this->logActivity(
                'Consultation employés',
                'READ',
                'Affichage de la liste des employés (Page ' . ($request->page ?? 1) . ')'
            );
            
            return response()->json($employees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:employees,email',
                'telephone' => 'nullable|string|max:20',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string',
                'situation_familiale' => 'nullable|string',
                'nombre_enfants' => 'nullable|integer|min:0|max:20',
                'departement' => 'nullable|string',
                'date_embauche' => 'nullable|date',
                'poste' => 'nullable|string',
                'type_contrat' => 'nullable|string',
                'annee_id' => 'required|exists:salary_years,id',
                'role_id' => 'nullable|exists:roles,id',
                'grade_id' => 'nullable|exists:grades,id',
                'echelle_id' => 'nullable|exists:echelles,id',
                'echelon_id' => 'nullable|exists:echelons,id',
                'grade' => 'nullable|string',
                'echelle' => 'nullable|string',
                'echelon' => 'nullable|string',  
                'salaire' => 'nullable|numeric|min:0',
                'indice' => 'nullable|numeric|min:0',
                'statut' => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_type' => 'nullable|string',
                'cotisation_id' => 'nullable|integer',
                'cotisation_rubrique_id' => 'nullable|integer',
                'cotisation_label' => 'nullable|string',
                'cotisation_taux' => 'nullable|numeric|min:0|max:100',
                'rcar_type_id' => 'nullable|exists:rcar_types,id',
                'rcar_type_label' => 'nullable|string|max:255',
                'rcar_taux' => 'nullable|numeric|min:0|max:100'
            ]);

            if (isset($validated['echelon']) && $validated['echelon'] !== null) {
                $validated['echelon'] = (string) $validated['echelon'];
            }

            $employee = Employee::create($validated);
            
            $this->logActivity(
                'Ajout employé',
                'CREATE',
                "Ajout de l'employé : {$employee->prenom} {$employee->nom} (Email: {$employee->email})"
            );
            
            return response()->json($employee, 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity(
                'Ajout employé',
                'ERROR',
                "Erreur lors de l'ajout: " . $e->getMessage()
            );
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $employee = Employee::find($id);
            if (!$employee) {
                return response()->json(['message' => 'Employé non trouvé'], 404);
            }
            
            $this->logActivity(
                'Consultation employé',
                'READ',
                "Consultation de l'employé : {$employee->prenom} {$employee->nom}"
            );
            
            return response()->json($employee);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $employee = Employee::find($id);
            if (!$employee) {
                return response()->json(['message' => 'Employé non trouvé'], 404);
            }

            $oldData = "{$employee->prenom} {$employee->nom}";

            $rules = [
                'prenom' => 'sometimes|string|max:255',
                'nom' => 'sometimes|string|max:255',
                'telephone' => 'nullable|string|max:20',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string|max:500',
                'situation_familiale' => 'nullable|string|max:50',
                'nombre_enfants' => 'nullable|integer|min:0|max:20',
                'departement' => 'nullable|string|max:100',
                'date_embauche' => 'nullable|date',
                'poste' => 'nullable|string|max:255',
                'type_contrat' => 'nullable|string|max:50',
                'annee_id' => 'sometimes|exists:salary_years,id',
                'role_id' => 'nullable|exists:roles,id',
                'grade_id' => 'nullable|exists:grades,id',
                'echelle_id' => 'nullable|exists:echelles,id',
                'echelon_id' => 'nullable|exists:echelons,id',
                'grade' => 'nullable|string|max:255',
                'echelle' => 'nullable|string|max:50',
                'echelon' => 'nullable|string|max:50',
                'salaire' => 'nullable|numeric|min:0',
                'indice' => 'nullable|numeric|min:0',
                'statut' => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_type' => 'nullable|string',
                'cotisation_id' => 'nullable|integer',
                'cotisation_rubrique_id' => 'nullable|integer',
                'cotisation_label' => 'nullable|string',
                'cotisation_taux' => 'nullable|numeric|min:0|max:100',
                'rcar_type_id' => 'nullable|exists:rcar_types,id',
                'rcar_type_label' => 'nullable|string|max:255',
                'rcar_taux' => 'nullable|numeric|min:0|max:100'
            ];
            
            if ($request->has('email') && $request->email !== $employee->email) {
                $rules['email'] = 'required|email|unique:employees,email';
            }
            
            $request->validate($rules);
            
            $employee->update($request->all());
            
            $this->logActivity(
                'Modification employé',
                'UPDATE',
                "Modification de l'employé : {$oldData} → {$employee->prenom} {$employee->nom}"
            );
            
            return response()->json($employee);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity(
                'Modification employé',
                'ERROR',
                "Erreur lors de la modification: " . $e->getMessage()
            );
            return response()->json(['message' => 'Erreur lors de la modification: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $employee = Employee::find($id);
            if (!$employee) {
                return response()->json(['message' => 'Employé non trouvé'], 404);
            }

            $employeeName = "{$employee->prenom} {$employee->nom}";
            $employee->delete();
            
            $this->logActivity(
                'Suppression employé',
                'DELETE',
                "Suppression de l'employé : {$employeeName}"
            );
            
            return response()->json(['message' => 'Employé supprimé avec succès']);
        } catch (\Exception $e) {
            $this->logActivity(
                'Suppression employé',
                'ERROR',
                "Erreur lors de la suppression: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function stats(Request $request)
    {
        try {
            $query = Employee::query();
            
            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }
            
            $total = $query->count();
            $actifs = $query->clone()->where('statut', 'ACTIF')->count();
            $conge = $query->clone()->where('statut', 'CONGÉ')->count();
            $departs = $query->clone()->where('statut', 'DÉPART')->count();
            
            $this->logActivity(
                'Statistiques employés',
                'READ',
                'Consultation des statistiques employés'
            );
            
            return response()->json([
                'total' => $total,
                'actifs' => $actifs,
                'conge' => $conge,
                'departs' => $departs
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function exportPDF(Request $request)
    {
        try {
            $query = Employee::query();
            
            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }
            
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('prenom', 'like', "%$search%")
                    ->orWhere('nom', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
                });
            }
            
            if ($request->filled('statut') && $request->statut !== 'Tous') {
                $query->where('statut', $request->statut);
            }
            
            $employees = $query->orderBy('nom', 'asc')->get();
            $anneeName = $request->annee_id ? SalaryYear::find($request->annee_id)?->year : 'Toutes';
            
            $actifs = $employees->where('statut', 'ACTIF')->count();
            $conges = $employees->where('statut', 'CONGÉ')->count();
            $departs = $employees->where('statut', 'DÉPART')->count();
            $totalSalaires = $employees->sum('salaire');
            
            $gradesSummary = $employees->groupBy('grade')->map(function($group, $grade) {
                return [
                    'name' => $grade ?: 'Non spécifié',
                    'count' => $group->count(),
                    'total' => $group->sum('salaire')
                ];
            })->values()->toArray();
            
            $pdf = Pdf::loadView('pdf.employees', [
                'employees' => $employees,
                'date' => now()->format('d/m/Y H:i'),
                'annee' => $anneeName,
                'total' => $employees->count(),
                'actifs' => $actifs,
                'conges' => $conges,
                'departs' => $departs,
                'totalSalaires' => $totalSalaires,
                'gradesSummary' => $gradesSummary,
                'gradesCount' => count($gradesSummary)
            ]);
            
            $pdf->setPaper('a4', 'landscape');
            
            $this->logActivity(
                'Export PDF employés',
                'EXPORT',
                "Export PDF de la liste des employés - " . ($anneeName !== 'Toutes' ? "Année {$anneeName}" : "Toutes années")
            );
            
            return $pdf->download('employes_' . now()->format('Ymd_His') . '.pdf');
            
        } catch (\Exception $e) {
            $this->logActivity(
                'Export PDF employés',
                'ERROR',
                "Erreur lors de l'export PDF: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function checkEmail(Request $request)
    {
        try {
            $email = $request->email;
            $id = $request->id;
            
            $exists = Employee::where('email', $email)
                ->when($id, function($q) use ($id) {
                    $q->where('id', '!=', $id);
                })
                ->exists();
            
            return response()->json(['exists' => $exists]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

