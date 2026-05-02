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
        $annees = SalaryYear::orderBy('year', 'desc')->get();
        return response()->json($annees);
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
            return response()->json($employee, 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
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
            return response()->json($employee);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
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

            $employee->delete();
            return response()->json(['message' => 'Employé supprimé avec succès']);
        } catch (\Exception $e) {
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
            
            $pdf = Pdf::loadView('pdf.employees', [
                'employees' => $employees,
                'date' => now()->format('d/m/Y H:i'),
                'annee' => $anneeName,
                'total' => $employees->count()
            ]);
            $pdf->setPaper('a4', 'landscape');
            
            return $pdf->download('employes_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
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