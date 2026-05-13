<?php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\SuperAdmin\EmployeeController as SuperAdminEmployeeController;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\Employee;
use App\Models\Employe\EmployeeSalary;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Auth\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use DateTime;

class EmployeeController extends Controller
{
    private SuperAdminEmployeeController $delegate;

    public function __construct()
    {
        $this->delegate = app(SuperAdminEmployeeController::class);
    }

    // 🔐 Générer mot de passe sécurisé (10 caractères)
    private function generateSecurePassword($length = 10)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, $length);
    }

    // 📧 Envoyer email avec identifiants
    private function sendCredentialsEmail($employee, $plainPassword, $isUpdate = false)
    {
        try {
            $subject = $isUpdate 
                ? '🔐 Vos identifiants ont été mis à jour - Portail RH'
                : '🎉 Bienvenue - Vos identifiants de connexion';

            Mail::send('emails.employee_credentials', [
                'name'      => $employee->prenom . ' ' . $employee->nom,
                'email'     => $employee->email,
                'password'  => $plainPassword,
                'loginUrl'  => url('/auth/login'),
                'year'      => date('Y'),
                'isUpdate'  => $isUpdate
            ], function ($message) use ($employee, $subject) {
                $message->to($employee->email)
                        ->subject($subject);
            });

            $employee->update([
                'temp_password' => $plainPassword,
                'credentials_sent_at' => now()
            ]);

            Log::info("Email sent to: " . $employee->email);
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send email: " . $e->getMessage());
            return false;
        }
    }

    // 📅 GET /rh/employees/annees
    public function getAnnees()
    {
        try {
            $currentYear = (int) date('Y');
            $annees = SalaryYear::orderBy('year', 'asc')
                ->where('year', '>=', 2024)
                ->where('year', '<=', $currentYear)
                ->get();

            return response()->json($annees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 📋 GET /rh/employees
   // 📋 GET /rh/employees
public function index(Request $request)
{
    try {
        $query = Employee::query();

        // 🔥 FILTRE: Afficher uniquement les employés avec user.role = 'employee'
        $query->whereHas('user', function($q) {
            $q->where('role', 'employee');
        });

        if ($request->filled('annee_id')) {
            $query->where('annee_id', $request->annee_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('prenom', 'like', "%{$search}%")
                  ->orWhere('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }

        $employees = $query
            ->with(['post', 'gradeRel', 'echelleRel', 'echelonRel', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $employees->getCollection()->transform(function ($employee) {
            $employee->date_naissance = $employee->date_naissance
                ? date('Y-m-d', strtotime($employee->date_naissance)) : null;
            $employee->date_embauche = $employee->date_embauche
                ? date('Y-m-d', strtotime($employee->date_embauche)) : null;
            return $employee;
        });

        return response()->json($employees);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    // ➕ POST /rh/employees
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'prenom'             => 'required|string|max:255',
                'nom'                => 'required|string|max:255',
                'email'              => 'required|email|unique:users,email',
                'telephone'          => 'nullable|string|max:20',
                'date_naissance'     => 'nullable|date',
                'situation_familiale'=> 'nullable|string',
                'nombre_enfants'     => 'nullable|integer|min:0|max:20',
                'date_embauche'      => 'nullable|date',
                'annee_id'           => 'required|exists:salary_years,id',
                'Post_id'            => 'nullable|exists:Post,id',
                'grade_id'           => 'nullable|exists:grades,id',
                'echelle_id'         => 'nullable|exists:echelles,id',
                'echelon_id'         => 'nullable|exists:echelons,id',
                'grade'              => 'nullable|string',
                'echelle'            => 'nullable|string',
                'echelon'            => 'nullable|string',
                'salaire'            => 'nullable|numeric|min:0',
                'indice'             => 'nullable|numeric|min:0',
                'statut'             => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_id'      => 'nullable|integer',
                'credits'            => 'nullable|array',
            ]);

            // Vérifier année en cours
            $this->assertCurrentYear($validated['annee_id']);

            // 🔥 FORCER le rôle à 'employee' (RH ne peut ajouter que des employés)
            $role = 'employee';
            
            // Générer mot de passe temporaire
            $tempPassword = $this->generateSecurePassword();

            $employee = DB::transaction(function () use ($validated, $tempPassword, $role, $request) {
                // Créer l'utilisateur
                $user = User::create([
                    'full_name'            => $validated['prenom'] . ' ' . $validated['nom'],
                    'email'                => $validated['email'],
                    'password'             => Hash::make($tempPassword),
                    'role'                 => $role,
                    'must_change_password' => true,
                ]);

                if (isset($validated['echelon'])) {
                    $validated['echelon'] = (string) $validated['echelon'];
                }

                $validated['user_id'] = $user->id;
                $validated['temp_password'] = $tempPassword;
                
                $employee = Employee::create($validated);

                // Ajouter les crédits
                if ($request->has('credits') && is_array($request->credits)) {
                    foreach ($request->credits as $creditData) {
                        $clean = $this->buildCreditData($creditData);
                        $clean['employee_id'] = $employee->id;
                        if ($clean['credit_mensualite'] <= 0) {
                            $clean['credit_mensualite'] = $this->calculerMensualite(
                                $clean['montant_credit'],
                                $clean['taux_credit'],
                                $clean['credit_duree']
                            );
                        }
                        if (!$clean['credit_date_fin'] && $clean['credit_date_debut'] && $clean['credit_duree']) {
                            $clean['credit_date_fin'] = $this->addMonths($clean['credit_date_debut'], $clean['credit_duree']);
                        }
                        EmployeeCredit::create($clean);
                    }
                }

                // Recalculer salaire
                $this->delegate->calculateAndStoreSalary($employee->id);

                return $employee;
            });

            // 🔥 ENVOYER L'EMAIL AVEC IDENTIFIANTS
            $this->sendCredentialsEmail($employee, $tempPassword, false);

            $this->logActivity('Ajout employé', 'CREATE', "RH a ajouté : {$employee->prenom} {$employee->nom}");
            
            return response()->json([
                'message' => 'Employé ajouté avec succès. Identifiants envoyés par email.',
                'employee' => $employee
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('RH store employee: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // 👁️ GET /rh/employees/{id}
    public function show($id)
    {
        try {
            $employee = Employee::with(['post', 'gradeRel', 'echelleRel', 'echelonRel', 'credits'])
                ->findOrFail($id);
            return response()->json($employee);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ✏️ PUT /rh/employees/{id}
    public function update(Request $request, $id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $this->assertCurrentYear($employee->annee_id);

            $rules = [
                'prenom'              => 'sometimes|string|max:255',
                'nom'                 => 'sometimes|string|max:255',
                'telephone'           => 'nullable|string|max:20',
                'date_naissance'      => 'nullable|date',
                'situation_familiale' => 'nullable|string|max:50',
                'nombre_enfants'      => 'nullable|integer|min:0|max:20',
                'date_embauche'       => 'nullable|date',
                'Post_id'             => 'nullable|exists:Post,id',
                'grade_id'            => 'nullable|exists:grades,id',
                'echelle_id'          => 'nullable|exists:echelles,id',
                'echelon_id'          => 'nullable|exists:echelons,id',
                'grade'               => 'nullable|string|max:255',
                'echelle'             => 'nullable|string|max:50',
                'echelon'             => 'nullable|string|max:50',
                'salaire'             => 'nullable|numeric|min:0',
                'indice'              => 'nullable|numeric|min:0',
                'statut'              => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_id'       => 'nullable|integer',
            ];

            if ($request->has('email') && $request->email !== $employee->email) {
                $rules['email'] = 'required|email|unique:employees,email';
            }

            $request->validate($rules);

            $data = $request->only([
                'prenom', 'nom', 'email', 'telephone', 'date_naissance',
                'situation_familiale', 'nombre_enfants', 'date_embauche',
                'Post_id', 'grade_id', 'echelle_id', 'echelon_id',
                'grade', 'echelle', 'echelon', 'salaire', 'indice',
                'statut', 'cotisation_id',
            ]);

            $employee->update($data);

            // 🔥 Vérifier si on doit régénérer le mot de passe
            $passwordRegenerated = false;
            $newPassword = null;
            
            if ($request->boolean('regenerate_password')) {
                $newPassword = $this->generateSecurePassword();
                $user = User::find($employee->user_id);
                if ($user) {
                    $user->password = Hash::make($newPassword);
                    $user->must_change_password = true;
                    $user->save();
                }
                $employee->update(['temp_password' => $newPassword]);
                $passwordRegenerated = true;
            }

            // Sync credits
            if ($request->has('credits') && is_array($request->credits)) {
                $this->syncCredits($employee->id, $request->credits);
            }

            // Recalculer salaire
            $this->delegate->calculateAndStoreSalary($employee->id);

            // 🔥 Si mot de passe régénéré, envoyer email
            if ($passwordRegenerated) {
                $this->sendCredentialsEmail($employee, $newPassword, true);
            }

            $this->logActivity('Modification employé', 'UPDATE', "RH a modifié : {$employee->prenom} {$employee->nom}");

            $employee->load('credits');
            $salary = EmployeeSalary::where('employee_id', $employee->id)
                ->orderBy('year', 'desc')
                ->first();

            $responseMessage = $passwordRegenerated 
                ? 'Employé modifié avec succès. Nouveaux identifiants envoyés par email.'
                : 'Employé modifié avec succès.';

            return response()->json([
                'message' => $responseMessage,
                'employee' => $employee,
                'salary_details' => $salary ? $this->formatSalaryResponse($salary) : null,
            ]);

        } catch (\Exception $e) {
            Log::error('RH update employee: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // 🗑️ DELETE /rh/employees/{id}
    public function destroy($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $this->assertCurrentYear($employee->annee_id);

            $name = "{$employee->prenom} {$employee->nom}";
            $userId = $employee->user_id;

            DB::transaction(function () use ($employee, $userId) {
                EmployeeSalary::where('employee_id', $employee->id)->delete();
                EmployeeCredit::where('employee_id', $employee->id)->delete();
                $employee->delete();
                if ($userId) {
                    User::where('id', $userId)->delete();
                }
            });

            $this->logActivity('Suppression employé', 'DELETE', "RH a supprimé : {$name}");
            return response()->json(['message' => 'Employé supprimé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 💰 GET /rh/employees/{id}/salary-dashboard
    public function salaryDashboard($id)
    {
        return $this->delegate->salaryDashboard($id);
    }

    // 💳 GET /rh/employees/{id}/credits
    public function getCredits($employeeId)
    {
        try {
            $credits = EmployeeCredit::where('employee_id', $employeeId)
                ->with('creditType')
                ->get();
            return response()->json($credits);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ➕ POST /rh/employees/{id}/credits
    public function addCredit(Request $request, $employeeId)
    {
        try {
            $employee = Employee::findOrFail($employeeId);
            $this->assertCurrentYear($employee->annee_id);

            $validated = $request->validate([
                'credit_type_id'      => 'nullable|exists:credit_types,id',
                'montant_credit'      => 'required|numeric|min:1',
                'taux_credit'         => 'required|numeric|min:0|max:100',
                'credit_duree'        => 'required|integer|min:1|max:360',
                'credit_date_debut'   => 'nullable|date',
                'credit_date_fin'     => 'nullable|date',
                'credit_mensualite'   => 'nullable|numeric',
                'credit_reste_a_payer'=> 'nullable|numeric',
            ]);

            if (empty($validated['credit_mensualite'])) {
                $validated['credit_mensualite'] = $this->calculerMensualite(
                    $validated['montant_credit'],
                    $validated['taux_credit'],
                    $validated['credit_duree']
                );
            }

            if (empty($validated['credit_date_fin']) && !empty($validated['credit_date_debut'])) {
                $validated['credit_date_fin'] = $this->addMonths(
                    $validated['credit_date_debut'],
                    $validated['credit_duree']
                );
            }

            $validated['credit_reste_a_payer'] = $validated['credit_reste_a_payer'] ?? $validated['montant_credit'];
            $validated['employee_id'] = $employeeId;
            $validated['statut'] = 'ACTIF';

            $credit = EmployeeCredit::create($validated);
            $this->delegate->calculateAndStoreSalary($employeeId);

            $this->logActivity('Ajout crédit', 'CREATE', "Crédit ajouté à l'employé ID: {$employeeId}");
            return response()->json($credit->load('creditType'), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ✏️ PUT /rh/credits/{creditId}
    public function updateCredit(Request $request, $creditId)
    {
        try {
            $credit = EmployeeCredit::findOrFail($creditId);
            $employee = Employee::findOrFail($credit->employee_id);
            $this->assertCurrentYear($employee->annee_id);

            $validated = $request->validate([
                'montant_credit'      => 'sometimes|numeric|min:1',
                'taux_credit'         => 'sometimes|numeric|min:0|max:100',
                'credit_duree'        => 'sometimes|integer|min:1|max:360',
                'credit_date_debut'   => 'nullable|date',
                'credit_date_fin'     => 'nullable|date',
                'credit_mensualite'   => 'nullable|numeric',
                'credit_reste_a_payer'=> 'nullable|numeric',
                'statut'              => 'sometimes|in:ACTIF,REMBOURSE,ANNULE',
            ]);

            $credit->update($validated);
            $this->delegate->calculateAndStoreSalary($credit->employee_id);

            $this->logActivity('Modification crédit', 'UPDATE', "Crédit ID: {$creditId} modifié");
            return response()->json($credit->load('creditType'));

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // 🗑️ DELETE /rh/credits/{creditId}
    public function deleteCredit($creditId)
    {
        try {
            $credit = EmployeeCredit::findOrFail($creditId);
            $employee = Employee::findOrFail($credit->employee_id);
            $employeeId = $credit->employee_id;

            $this->assertCurrentYear($employee->annee_id);

            $credit->delete();
            $this->delegate->calculateAndStoreSalary($employeeId);

            $this->logActivity('Suppression crédit', 'DELETE', "Crédit ID: {$creditId} supprimé");
            return response()->json(['message' => 'Crédit supprimé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // 📄 GET /rh/employees/export-pdf
    public function exportPDF(Request $request)
    {
        try {
            $query = Employee::query();

            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('prenom', 'like', "%{$search}%")
                      ->orWhere('nom', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            if ($request->filled('statut') && $request->statut !== 'Tous') {
                $query->where('statut', $request->statut);
            }

            $employees = $query->orderBy('nom', 'asc')->get();
            $anneeName = $request->annee_id
                ? (SalaryYear::find($request->annee_id)?->year ?? 'Toutes')
                : 'Toutes';

            $pdf = Pdf::loadView('pdf.employees', [
                'employees' => $employees,
                'date' => now()->format('d/m/Y H:i'),
                'annee' => $anneeName,
            ]);
            $pdf->setPaper('a4', 'landscape');

            $this->logActivity('Export PDF', 'EXPORT', 'Export PDF liste employés (RH)');
            return $pdf->download('employes_rh_' . now()->format('Ymd_His') . '.pdf');

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🏷️ GET /rh/gestionEtat/get-by-year/{year}
  public function getClassification(Request $request)
{
    try {
        $year = $request->year ?? $request->annee_id;
        
        \Log::info('getClassification called', ['year' => $year]); // Debug
        
        if (!$year) {
            return response()->json(['Post' => []]);
        }

        // 🔥 Méthode 1: Chercher SalaryYear par year
        $salaryYear = SalaryYear::where('year', $year)->first();
        
        if (!$salaryYear) {
            \Log::warning('SalaryYear not found for year: ' . $year);
            return response()->json(['Post' => []]);
        }

        // 🔥 Méthode 2: Charger avec les relations
        $data = SalaryYear::with(['Post' => function($query) {
            $query->orderBy('name', 'asc');
        }, 'Post.grades', 'Post.grades.echelles', 'Post.grades.echelles.echelons'])
            ->find($salaryYear->id);

        \Log::info('Classification data loaded', [
            'has_data' => !is_null($data),
            'posts_count' => $data?->Post?->count() ?? 0
        ]);

        // 🔥 Si pas de données, retourner structure vide
        if (!$data) {
            return response()->json(['Post' => []]);
        }

        // 🔥 Transformer les données pour le frontend
        $response = [
            'id' => $data->id,
            'year' => $data->year,
            'Post' => $data->Post->map(function($post) {
                return [
                    'id' => $post->id,
                    'name' => $post->name,
                    'is_starred' => $post->is_starred ?? false,
                    'grades' => $post->grades->map(function($grade) {
                        return [
                            'id' => $grade->id,
                            'name' => $grade->name,
                            'echelles' => $grade->echelles->map(function($echelle) {
                                return [
                                    'id' => $echelle->id,
                                    'level' => $echelle->level,
                                    'echelons' => $echelle->echelons->map(function($echelon) {
                                        return [
                                            'id' => $echelon->id,
                                            'order' => $echelon->order,
                                            'salary' => $echelon->salary,
                                            'index_val' => $echelon->index_val,
                                        ];
                                    })
                                ];
                            })
                        ];
                    })
                ];
            })
        ];

        return response()->json($response);
        
    } catch (\Exception $e) {
        \Log::error('getClassification error: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json(['Post' => [], 'error' => $e->getMessage()], 500);
    }
}

    // 🏢 GET /rh/cotisations
    public function getCotisations(Request $request)
    {
        try {
            $year = $request->year ?? date('Y');
            $cotisations = DB::table('organisme')
                ->where('annee', $year)
                ->get();
            return response()->json($cotisations);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 💳 GET /rh/credit-types
    public function getCreditTypes()
    {
        try {
            $types = DB::table('credit_types')->get();
            return response()->json($types);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 👤 GET /rh/my-salary (pour le RH lui-même)
    public function mySalary()
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Non authentifié'], 401);
            }
            
            $employee = Employee::where('user_id', $user->id)->first();
            
            if (!$employee) {
                return response()->json(['error' => 'Profil employé non trouvé'], 404);
            }
            
            return $this->salaryDashboard($employee->id);
            
        } catch (\Exception $e) {
            Log::error("mySalary Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ─────────────────────── PRIVATE HELPERS ───────────────────────

    private function assertCurrentYear($anneeId): void
    {
        $annee = SalaryYear::find($anneeId);
        if (!$annee || (int) $annee->year !== (int) date('Y')) {
            abort(403, "L'année sélectionnée n'est pas modifiable. Seule l'année en cours est éditable.");
        }
    }

    private function buildCreditData(array $creditData): array
    {
        return [
            'credit_type_id'       => $creditData['credit_type_id'] ?? null,
            'montant_credit'       => $creditData['montant_credit'] ?? 0,
            'taux_credit'          => $creditData['taux_credit'] ?? 0,
            'credit_duree'         => $creditData['credit_duree'] ?? 0,
            'credit_date_debut'    => $creditData['credit_date_debut'] ?? null,
            'credit_date_fin'      => $creditData['credit_date_fin'] ?? null,
            'credit_mensualite'    => $creditData['credit_mensualite'] ?? 0,
            'credit_reste_a_payer' => $creditData['credit_reste_a_payer'] ?? ($creditData['montant_credit'] ?? 0),
            'statut' => 'ACTIF',
        ];
    }

    private function calculerMensualite(float $montant, float $tauxAnnuel, int $dureeMois): float
    {
        if ($montant <= 0 || $dureeMois <= 0) return 0.0;
        $tauxMensuel = ($tauxAnnuel / 100) / 12;
        if ($tauxMensuel == 0) return round($montant / $dureeMois, 2);
        $puissance = pow(1 + $tauxMensuel, $dureeMois);
        return round($montant * ($tauxMensuel * $puissance) / ($puissance - 1), 2);
    }

    private function addMonths(string $dateDebut, int $months): string
    {
        $dt = new DateTime($dateDebut);
        $dt->modify("+{$months} months");
        return $dt->format('Y-m-d');
    }

    private function syncCredits(int $employeeId, array $creditsData): void
    {
        $existingIds = EmployeeCredit::where('employee_id', $employeeId)->pluck('id')->toArray();
        $processedIds = [];

        foreach ($creditsData as $creditData) {
            $clean = $this->buildCreditData($creditData);

            if ($clean['credit_mensualite'] <= 0) {
                $clean['credit_mensualite'] = $this->calculerMensualite(
                    $clean['montant_credit'],
                    $clean['taux_credit'],
                    $clean['credit_duree']
                );
            }

            if (!$clean['credit_date_fin'] && $clean['credit_date_debut'] && $clean['credit_duree']) {
                $clean['credit_date_fin'] = $this->addMonths($clean['credit_date_debut'], $clean['credit_duree']);
            }

            if (isset($creditData['id']) && in_array($creditData['id'], $existingIds)) {
                EmployeeCredit::where('id', $creditData['id'])->update($clean);
                $processedIds[] = $creditData['id'];
            } elseif (!isset($creditData['id'])) {
                $clean['employee_id'] = $employeeId;
                $credit = EmployeeCredit::create($clean);
                $processedIds[] = $credit->id;
            }
        }

        $toDelete = array_diff($existingIds, $processedIds);
        if (!empty($toDelete)) {
            EmployeeCredit::whereIn('id', $toDelete)->delete();
        }
    }

    private function formatSalaryResponse(EmployeeSalary $s): array
    {
        return [
            'base_salary' => $s->base_salary ?? 0,
            'indemnites' => ['total' => $s->indemnites_total ?? 0, 'details' => $s->indemnites_details ?? []],
            'brut_salary' => $s->brut_salary ?? 0,
            'cotisations' => ['total' => $s->cotisations_total ?? 0, 'details' => $s->cotisations_details ?? []],
            'rcar' => ['total' => $s->rcar_total ?? 0, 'details' => $s->rcar_details ?? []],
            'ir' => ['total' => $s->ir_total ?? 0, 'taux' => $s->ir_taux ?? 0],
            'sntl' => ['total' => $s->sntl_total ?? 0, 'details' => $s->sntl_details ?? []],
            'assurances' => ['salarie' => $s->assurances_salarie ?? 0, 'details' => $s->assurances_details ?? []],
            'credits' => ['total' => $s->credits_total ?? 0, 'details' => $s->credits_details ?? []],
            'total_deductions' => $s->total_deductions ?? 0,
            'net_salary' => $s->net_salary ?? 0,
        ];
    }
}