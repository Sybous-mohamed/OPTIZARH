<?php
namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Auth\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

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
                $data = SalaryYear::with(['Post.grades.echelles.echelons'])->find($anneeId);
            } elseif ($year) {
                $data = SalaryYear::with(['Post.grades.echelles.echelons'])
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
            
            return response()->json($data ?? ['Post' => []]);
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

            $employees = $query->with(['post', 'gradeRel', 'echelleRel', 'echelonRel'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
            
            $employees->getCollection()->transform(function ($employee) {
                $employee->date_naissance = $employee->date_naissance ? date('Y-m-d', strtotime($employee->date_naissance)) : null;
                $employee->date_embauche = $employee->date_embauche ? date('Y-m-d', strtotime($employee->date_embauche)) : null;
                return $employee;
            });
            
            return response()->json($employees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // 1. Validation (Zdna email unique f table users w l-champs jdad)
            $validated = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email', // Check f table users hsen
                'password' => 'required|min:6', // Password darouri
                'role' => 'required|string|in:employee,rh,admin',    // RH wala EMPLOYE
                'telephone' => 'nullable|string|max:20',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string',
                'situation_familiale' => 'nullable|string',
                'nombre_enfants' => 'nullable|integer|min:0|max:20',
                'departement' => 'nullable|string',
                'date_embauche' => 'nullable|date',
                'type_contrat' => 'nullable|string',
                'annee_id' => 'required|exists:salary_years,id',
                'Post_id' => 'nullable|exists:Post,id',
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
                'cotisation_id' => 'required|integer', 
                'cotisation_rubrique_id' => 'nullable|integer',
                'cotisation_label' => 'nullable|string',
                'cotisation_taux' => 'nullable|numeric|min:0|max:100',
                'rcar_type_id' => 'nullable|exists:rcar_types,id',
                'rcar_type_label' => 'nullable|string|max:255',
                'rcar_taux' => 'nullable|numeric|min:0|max:100',
                // Champs crédit
                'credit_type_id' => 'nullable|exists:credit_types,id',
                'montant_credit' => 'nullable|numeric|min:0',
                'taux_credit' => 'nullable|numeric|min:0|max:100',
                'credit_duree' => 'nullable|integer|min:1|max:360',
                'credit_date_debut' => 'nullable|date',
                'credit_date_fin' => 'nullable|date|after_or_equal:credit_date_debut',
                'credit_mensualite' => 'nullable|numeric|min:0',
                'credit_reste_a_payer' => 'nullable|numeric|min:0'
            ]);

            // Asta3mel DB::transaction bach ila whlat chi haja, may-creeyach user bla employé
            $employee = DB::transaction(function () use ($validated, $request) {
                
                // 2. Création de l'utilisateur (Le compte login)
                $user = User::create([
                    'full_name' => $validated['prenom'] . ' ' . $validated['nom'],
                    'email' => $validated['email'],
                    'password' => Hash::make($request->password),
                    'role' => $request->role,
                    'company_name' => null,
                    'sector' => null,
                    'must_change_password' => true
                ]);

                // 3. Traitement des calculs (Kima derti)
                if (isset($validated['echelon'])) {
                    $validated['echelon'] = (string) $validated['echelon'];
                }

                if (isset($validated['montant_credit'], $validated['taux_credit'], $validated['credit_duree'])) {
                    if (!isset($validated['credit_mensualite']) || $validated['credit_mensualite'] == 0) {
                        $validated['credit_mensualite'] = $this->calculerMensualiteCredit(
                            $validated['montant_credit'], $validated['taux_credit'], $validated['credit_duree']
                        );
                    }
                    if (!isset($validated['credit_reste_a_payer'])) {
                        $validated['credit_reste_a_payer'] = $validated['montant_credit'];
                    }
                }

                if (isset($validated['credit_date_debut'], $validated['credit_duree']) && !isset($validated['credit_date_fin'])) {
                    $dateFin = (new \DateTime($validated['credit_date_debut']))->modify('+' . $validated['credit_duree'] . ' months');
                    $validated['credit_date_fin'] = $dateFin->format('Y-m-d');
                }

                // 4. Création de l'employé lié au User ID
                $validated['user_id'] = $user->id; // Hna katrebet-hom
                return Employee::create($validated);
            });

            // 5. Logging
            $this->logActivity('Ajout employé', 'CREATE', "Ajout de l'employé : {$employee->prenom} {$employee->nom}");

            return response()->json($employee, 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity('Ajout employé', 'ERROR', "Erreur: " . $e->getMessage());
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
                // 'departement' => 'nullable|string|max:100',
                'date_embauche' => 'nullable|date',
                // 'type_contrat' => 'nullable|string|max:50',
                'annee_id' => 'sometimes|exists:salary_years,id',
                'Post_id' => 'nullable|exists:Post,id',
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
                'rcar_taux' => 'nullable|numeric|min:0|max:100',
                'credit_type_id' => 'nullable|exists:credit_types,id',
                'montant_credit' => 'nullable|numeric|min:0',
                'taux_credit' => 'nullable|numeric|min:0|max:100',
                'credit_duree' => 'nullable|integer|min:1|max:360',
                'credit_date_debut' => 'nullable|date',
                'credit_date_fin' => 'nullable|date|after_or_equal:credit_date_debut',
                'credit_mensualite' => 'nullable|numeric|min:0',
                'credit_reste_a_payer' => 'nullable|numeric|min:0'
            ];
            
            if ($request->has('email') && $request->email !== $employee->email) {
                $rules['email'] = 'required|email|unique:employees,email';
            }
            
            $request->validate($rules);
            
            $data = $request->all();
            if (isset($data['montant_credit']) || isset($data['taux_credit']) || isset($data['credit_duree'])) {
                $montant = $data['montant_credit'] ?? $employee->montant_credit;
                $taux = $data['taux_credit'] ?? $employee->taux_credit;
                $duree = $data['credit_duree'] ?? $employee->credit_duree;
                
                if ($montant && $taux && $duree) {
                    $data['credit_mensualite'] = $this->calculerMensualiteCredit($montant, $taux, $duree);
                }
            }
            
            // Recalculer la date de fin si nécessaire
            if ((isset($data['credit_date_debut']) || isset($data['credit_duree'])) && !isset($data['credit_date_fin'])) {
                $dateDebut = $data['credit_date_debut'] ?? $employee->credit_date_debut;
                $duree = $data['credit_duree'] ?? $employee->credit_duree;
                
                if ($dateDebut && $duree) {
                    $dateDebutObj = new \DateTime($dateDebut);
                    $dateFin = clone $dateDebutObj;
                    $dateFin->modify('+' . $duree . ' months');
                    $data['credit_date_fin'] = $dateFin->format('Y-m-d');
                }
            }
            
            $employee->update($data);
            
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
        $userId = $employee->user_id; // N-khbiw l-ID dyal user qbel mad-delete employee

        DB::transaction(function () use ($employee, $userId) {
            // 1. N-ms-hou l-employé (hadi lowla)
            $employee->delete();

            // 2. N-ms-hou l-user dyalou (ila kan m-lié)
            if ($userId) {
                User::where('id', $userId)->delete();
            }
        });

        $this->logActivity('Suppression employé', 'DELETE', "Suppression de: {$employeeName}");

        return response()->json(['message' => 'Supprimé avec succès']);

    } catch (\Exception $e) {
        // Had l-ligne ghadi t-goul lik f-logs chno wqe3 b-debt
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


public function getCredits($employeeId)
{
    try {
        $employee = Employee::findOrFail($employeeId);
        $credits = $employee->credits()->with('creditType')->get();
        
        return response()->json($credits);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

/**
 * Ajouter un crédit à un employé
 */
public function addCredit(Request $request, $employeeId)
{
    try {
        $validated = $request->validate([
            'credit_type_id' => 'nullable|exists:credit_types,id',
            'montant_credit' => 'required|numeric|min:1',
            'taux_credit' => 'required|numeric|min:0|max:100',
            'credit_duree' => 'required|integer|min:1|max:360',
            'credit_date_debut' => 'nullable|date',
            'credit_date_fin' => 'nullable|date',
            'credit_mensualite' => 'nullable|numeric',
            'credit_reste_a_payer' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);
        
        if (!isset($validated['credit_mensualite']) || $validated['credit_mensualite'] == 0) {
            $validated['credit_mensualite'] = $this->calculerMensualiteCredit(
                $validated['montant_credit'],
                $validated['taux_credit'],
                $validated['credit_duree']
            );
        }
        
        if (!isset($validated['credit_date_fin']) && isset($validated['credit_date_debut'])) {
            $dateDebut = new \DateTime($validated['credit_date_debut']);
            $dateFin = clone $dateDebut;
            $dateFin->modify('+' . $validated['credit_duree'] . ' months');
            $validated['credit_date_fin'] = $dateFin->format('Y-m-d');
        }
        

        if (!isset($validated['credit_reste_a_payer'])) {
            $validated['credit_reste_a_payer'] = $validated['montant_credit'];
        }
        
        $validated['employee_id'] = $employeeId;
        $validated['statut'] = 'ACTIF';
        
        $credit = EmployeeCredit::create($validated);
        
        $this->logActivity(
            'Ajout crédit employé',
            'CREATE',
            "Ajout d'un crédit à l'employé ID: {$employeeId} (Montant: {$validated['montant_credit']} MAD)"
        );
        
        return response()->json($credit->load('creditType'), 201);
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Mettre à jour un crédit
 */
public function updateCredit(Request $request, $creditId)
{
    try {
        $credit = EmployeeCredit::findOrFail($creditId);
        
        $validated = $request->validate([
            'montant_credit' => 'sometimes|numeric|min:1',
            'taux_credit' => 'sometimes|numeric|min:0|max:100',
            'credit_duree' => 'sometimes|integer|min:1|max:360',
            'credit_date_debut' => 'nullable|date',
            'credit_date_fin' => 'nullable|date',
            'credit_mensualite' => 'nullable|numeric',
            'credit_reste_a_payer' => 'nullable|numeric',
            'statut' => 'sometimes|in:ACTIF,REMBOURSE,ANNULE',
            'description' => 'nullable|string'
        ]);
        
        $credit->update($validated);
        
        $this->logActivity(
            'Modification crédit employé',
            'UPDATE',
            "Modification du crédit ID: {$creditId}"
        );
        
        return response()->json($credit->load('creditType'));
        
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Supprimer un crédit
 */
public function deleteCredit($creditId)
{
    try {
        $credit = EmployeeCredit::findOrFail($creditId);
        $credit->delete();
        
        $this->logActivity(
            'Suppression crédit employé',
            'DELETE',
            "Suppression du crédit ID: {$creditId}"
        );
        
        return response()->json(['message' => 'Crédit supprimé avec succès']);
        
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Calculer la mensualité d'un crédit
 */
private function calculerMensualiteCredit($montant, $tauxAnnuel, $dureeMois)
{
    $montant = (float) $montant;
    $tauxAnnuel = (float) $tauxAnnuel;
    $dureeMois = (int) $dureeMois;
    
    if ($montant <= 0 || $dureeMois <= 0) {
        return 0;
    }
    
    $tauxMensuel = ($tauxAnnuel / 100) / 12;
    
    if ($tauxMensuel == 0) {
        return round($montant / $dureeMois, 2);
    }
    
    $mensualite = $montant * ($tauxMensuel * pow(1 + $tauxMensuel, $dureeMois)) / (pow(1 + $tauxMensuel, $dureeMois) - 1);
    
    return round($mensualite, 2);
}
}