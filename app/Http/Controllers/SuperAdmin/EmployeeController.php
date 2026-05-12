<?php
namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use App\Models\SuperAdmin\Employee;
use App\Models\employee\EmployeeSalary;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Auth\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use DateTime;
use Illuminate\Support\Facades\Log;

class EmployeeController extends Controller
{
            private function generateSecurePassword($length = 10)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, $length);
    }

    // 📧 Envoyer email avec identifiants (ajoute cette méthode)
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

    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            $this->logActivity('Consultation années', 'READ', 'Récupération de la liste des années');
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
            
            $this->logActivity('Consultation classification', 'READ', 'Récupération de la classification pour ' . ($year ?? $anneeId));
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
            $validated = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6',
                'role' => 'required|string|in:employee,rh,admin,superadmin', 
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
                'cotisation_id' => 'nullable|integer',
                'credits' => 'nullable|array',
            ]);

            if (empty($request->cotisation_id)) {
                $defaultOrganisme = DB::table('organisme')->where('is_default', 1)->first();
                if ($defaultOrganisme) {
                    $request->merge(['cotisation_id' => $defaultOrganisme->id]);
                }
            }

            // 🔥 Générer mot de passe si non fourni ou utiliser celui du formulaire
            $plainPassword = $request->filled('password') ? $request->password : $this->generateSecurePassword();

            $employee = DB::transaction(function () use ($validated, $plainPassword, $request) {
                $user = User::create([
                    'full_name' => $validated['prenom'] . ' ' . $validated['nom'],
                    'email' => $validated['email'],
                    'password' => Hash::make($plainPassword),
                    'role' => $request->role,
                    'company_name' => null,
                    'sector' => null,
                    'must_change_password' => true
                ]);

                if (isset($validated['echelon'])) {
                    $validated['echelon'] = (string) $validated['echelon'];
                }

                $validated['user_id'] = $user->id;
                $validated['temp_password'] = $plainPassword;
                $employee = Employee::create($validated);
                
                // Ajouter les crédits si présents
                if ($request->has('credits') && is_array($request->credits)) {
                    foreach ($request->credits as $creditData) {
                        $cleanCreditData = [
                            'credit_type_id' => $creditData['credit_type_id'] ?? null,
                            'montant_credit' => $creditData['montant_credit'] ?? 0,
                            'taux_credit' => $creditData['taux_credit'] ?? 0,
                            'credit_duree' => $creditData['credit_duree'] ?? 0,
                            'credit_date_debut' => $creditData['credit_date_debut'] ?? null,
                            'credit_date_fin' => $creditData['credit_date_fin'] ?? null,
                            'credit_mensualite' => $creditData['credit_mensualite'] ?? 0,
                            'credit_reste_a_payer' => $creditData['credit_reste_a_payer'] ?? ($creditData['montant_credit'] ?? 0),
                            'statut' => 'ACTIF',
                            'employee_id' => $employee->id
                        ];
                        
                        if ($cleanCreditData['credit_mensualite'] <= 0 && 
                            $cleanCreditData['montant_credit'] > 0 && 
                            $cleanCreditData['credit_duree'] > 0) {
                            $cleanCreditData['credit_mensualite'] = $this->calculerMensualiteCredit(
                                $cleanCreditData['montant_credit'],
                                $cleanCreditData['taux_credit'],
                                $cleanCreditData['credit_duree']
                            );
                        }
                        
                        if (!$cleanCreditData['credit_date_fin'] && $cleanCreditData['credit_date_debut'] && $cleanCreditData['credit_duree']) {
                            $dateDebut = new \DateTime($cleanCreditData['credit_date_debut']);
                            $dateFin = clone $dateDebut;
                            $dateFin->modify('+' . $cleanCreditData['credit_duree'] . ' months');
                            $cleanCreditData['credit_date_fin'] = $dateFin->format('Y-m-d');
                        }
                        
                        EmployeeCredit::create($cleanCreditData);
                    }
                }
                
                $this->calculateAndStoreSalary($employee->id);
                
                return $employee;
            });

            // 🔥 ENVOYER L'EMAIL SI L'UTILISATEUR LE DEMANDE ou par défaut pour les employés
            $sendEmail = $request->boolean('send_credentials_email', true);
            if ($sendEmail && ($employee->role === 'employee' || $employee->role === 'rh')) {
                $this->sendCredentialsEmail($employee, $plainPassword, false);
            }

            $this->logActivity('Ajout employé', 'CREATE', "Ajout de l'employé : {$employee->prenom} {$employee->nom}");
            
            $message = $sendEmail ? 'Employé ajouté avec succès. Identifiants envoyés par email.' : 'Employé ajouté avec succès.';
            return response()->json(['message' => $message, 'employee' => $employee], 201);

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
            
            $this->logActivity('Consultation employé', 'READ', "Consultation de l'employé : {$employee->prenom} {$employee->nom}");
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
                'date_embauche' => 'nullable|date',
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
                'cotisation_id' => 'nullable|integer',
                'role' => 'required|string|in:employee,rh,admin,superadmin', 
            ];
            
            if (empty($request->cotisation_id)) {
                $defaultOrganisme = DB::table('organisme')->where('is_default', 1)->first();
                if ($defaultOrganisme) {
                    $request->merge(['cotisation_id' => $defaultOrganisme->id]);
                }
            }
            
            if ($request->has('email') && $request->email !== $employee->email) {
                $rules['email'] = 'required|email|unique:employees,email';
            }
            
            $request->validate($rules);
            
            // Mettre à jour les informations de l'employé
            $data = $request->only([
                'prenom', 'nom', 'email', 'telephone', 'date_naissance', 'adresse',
                'situation_familiale', 'nombre_enfants', 'date_embauche', 'annee_id',
                'Post_id', 'grade_id', 'echelle_id', 'echelon_id', 'grade', 'echelle',
                'echelon', 'salaire', 'indice', 'statut', 'cotisation_id', 'role'
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
            } elseif ($request->filled('password')) {
                // Mettre à jour le mot de passe si fourni manuellement
                $user = User::find($employee->user_id);
                if ($user) {
                    $user->password = Hash::make($request->password);
                    $user->save();
                }
                $employee->update(['temp_password' => $request->password]);
            }
            
            // Gestion des crédits (sans doublons)
            if ($request->has('credits') && is_array($request->credits)) {
                $this->syncEmployeeCredits($employee->id, $request->credits);
            }
            
            // Recalculer le salaire
            $this->calculateAndStoreSalary($employee->id);
            
            // 🔥 Si mot de passe régénéré, envoyer email
            if ($passwordRegenerated && $request->boolean('send_email', true)) {
                $this->sendCredentialsEmail($employee, $newPassword, true);
            }
            
            $this->logActivity('Modification employé', 'UPDATE', "Modification de l'employé : {$oldData} → {$employee->prenom} {$employee->nom}");
            
            // Retourner l'employé avec ses crédits et salaire
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
                'salary_details' => $salary ? [
                    'base_salary' => $salary->base_salary,
                    'indemnites' => [
                        'total' => $salary->indemnites_total,
                        'details' => $salary->indemnites_details ?? []
                    ],
                    'brut_salary' => $salary->brut_salary,
                    'cotisations' => [
                        'total' => $salary->cotisations_total,
                        'details' => $salary->cotisations_details ?? []
                    ],
                    'rcar' => [
                        'total' => $salary->rcar_total,
                        'details' => $salary->rcar_details ?? []
                    ],
                    'ir' => [
                        'total' => $salary->ir_total,
                        'taux' => $salary->ir_taux ?? 0
                    ],
                    'sntl' => [
                        'total' => $salary->sntl_total,
                        'details' => $salary->sntl_details ?? []
                    ],
                    'assurances' => [
                        'salarie' => $salary->assurances_salarie,
                        'details' => $salary->assurances_details ?? []
                    ],
                    'credits' => [
                        'total' => $salary->credits_total,
                        'details' => $salary->credits_details ?? []
                    ],
                    'total_deductions' => $salary->total_deductions,
                    'net_salary' => $salary->net_salary
                ] : null,
                'year' => $salary->year ?? date('Y')
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error("Update employee error: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la modification: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Synchroniser les crédits d'un employé (évite les doublons)
     */
    private function syncEmployeeCredits($employeeId, array $creditsData)
    {
        $existingCreditIds = EmployeeCredit::where('employee_id', $employeeId)
            ->pluck('id')
            ->toArray();
        
        $processedCreditIds = [];
        
        foreach ($creditsData as $creditData) {
            // Nettoyer les données du crédit (SANS description)
            $cleanCreditData = [
                'credit_type_id' => $creditData['credit_type_id'] ?? null,
                'montant_credit' => $creditData['montant_credit'] ?? 0,
                'taux_credit' => $creditData['taux_credit'] ?? 0,
                'credit_duree' => $creditData['credit_duree'] ?? 0,
                'credit_date_debut' => $creditData['credit_date_debut'] ?? null,
                'credit_date_fin' => $creditData['credit_date_fin'] ?? null,
                'credit_mensualite' => $creditData['credit_mensualite'] ?? 0,
                'credit_reste_a_payer' => $creditData['credit_reste_a_payer'] ?? ($creditData['montant_credit'] ?? 0),
                'statut' => 'ACTIF'
            ];
            
            // Calculer la mensualité si non fournie
            if ($cleanCreditData['credit_mensualite'] <= 0 && 
                $cleanCreditData['montant_credit'] > 0 && 
                $cleanCreditData['credit_duree'] > 0) {
                $cleanCreditData['credit_mensualite'] = $this->calculerMensualiteCredit(
                    $cleanCreditData['montant_credit'],
                    $cleanCreditData['taux_credit'],
                    $cleanCreditData['credit_duree']
                );
            }
            
            // Calculer la date de fin si non fournie
            if (!$cleanCreditData['credit_date_fin'] && $cleanCreditData['credit_date_debut'] && $cleanCreditData['credit_duree']) {
                $dateDebut = new \DateTime($cleanCreditData['credit_date_debut']);
                $dateFin = clone $dateDebut;
                $dateFin->modify('+' . $cleanCreditData['credit_duree'] . ' months');
                $cleanCreditData['credit_date_fin'] = $dateFin->format('Y-m-d');
            }
            
            // Vérifier si c'est un crédit existant ou nouveau
            if (isset($creditData['id']) && in_array($creditData['id'], $existingCreditIds)) {
                EmployeeCredit::where('id', $creditData['id'])->update($cleanCreditData);
                $processedCreditIds[] = $creditData['id'];
            } elseif (!isset($creditData['id']) && !isset($creditData['temp_id'])) {
                $cleanCreditData['employee_id'] = $employeeId;
                $credit = EmployeeCredit::create($cleanCreditData);
                $processedCreditIds[] = $credit->id;
            }
        }
        
        // Supprimer les crédits qui ne sont plus dans la liste
        $creditsToDelete = array_diff($existingCreditIds, $processedCreditIds);
        if (!empty($creditsToDelete)) {
            EmployeeCredit::whereIn('id', $creditsToDelete)->delete();
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
            $userId = $employee->user_id;

            DB::transaction(function () use ($employee, $userId) {
                EmployeeSalary::where('employee_id', $employee->id)->delete();
                EmployeeCredit::where('employee_id', $employee->id)->delete();
                $employee->delete();
                if ($userId) {
                    User::where('id', $userId)->delete();
                }
            });

            $this->logActivity('Suppression employé', 'DELETE', "Suppression de: {$employeeName}");
            return response()->json(['message' => 'Supprimé avec succès']);
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
            
            $this->logActivity('Statistiques employés', 'READ', 'Consultation des statistiques employés');
            return response()->json(['total' => $total, 'actifs' => $actifs, 'conge' => $conge, 'departs' => $departs]);
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
            
            $pdf = Pdf::loadView('pdf.employees', ['employees' => $employees, 'date' => now()->format('d/m/Y H:i'), 'annee' => $anneeName]);
            $pdf->setPaper('a4', 'landscape');
            
            $this->logActivity('Export PDF employés', 'EXPORT', "Export PDF de la liste des employés");
            return $pdf->download('employes_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            $this->logActivity('Export PDF employés', 'ERROR', "Erreur lors de l'export PDF: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function checkEmail(Request $request)
    {
        try {
            $email = $request->email;
            $id = $request->id;
            $exists = Employee::where('email', $email)->when($id, function($q) use ($id) {
                $q->where('id', '!=', $id);
            })->exists();
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
            ]);
            
            if (!isset($validated['credit_mensualite']) || $validated['credit_mensualite'] == 0) {
                $validated['credit_mensualite'] = $this->calculerMensualiteCredit(
                    $validated['montant_credit'], $validated['taux_credit'], $validated['credit_duree']
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
            $this->calculateAndStoreSalary($employeeId);
            
            $this->logActivity('Ajout crédit employé', 'CREATE', "Ajout d'un crédit à l'employé ID: {$employeeId}");
            return response()->json($credit->load('creditType'), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

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
                'statut' => 'sometimes|in:ACTIF,REMBOURSE,ANNULE'
            ]);
            
            $credit->update($validated);
            $this->calculateAndStoreSalary($credit->employee_id);
            
            $this->logActivity('Modification crédit employé', 'UPDATE', "Modification du crédit ID: {$creditId}");
            return response()->json($credit->load('creditType'));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function deleteCredit($creditId)
    {
        try {
            $credit = EmployeeCredit::findOrFail($creditId);
            $employeeId = $credit->employee_id;
            $credit->delete();
            $this->calculateAndStoreSalary($employeeId);
            
            $this->logActivity('Suppression crédit employé', 'DELETE', "Suppression du crédit ID: {$creditId}");
            return response()->json(['message' => 'Crédit supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function calculerMensualiteCredit($montant, $tauxAnnuel, $dureeMois)
    {
        $montant = (float) $montant;
        $tauxAnnuel = (float) $tauxAnnuel;
        $dureeMois = (int) $dureeMois;
        
        if ($montant <= 0 || $dureeMois <= 0) return 0.00;
        
        $tauxMensuel = ($tauxAnnuel / 100) / 12;
        
        if ($tauxMensuel == 0) {
            return round($montant / $dureeMois, 2);
        }
        
        $mensualite = $montant * ($tauxMensuel * pow(1 + $tauxMensuel, $dureeMois)) / (pow(1 + $tauxMensuel, $dureeMois) - 1);
        return round($mensualite, 2);
    }

    /**
     * calculateAndStoreSalary - Version avec précision à 2 décimales
     */
    public function calculateAndStoreSalary($employeeId, $year = null)
    {
        try {
            $employee = Employee::with(['credits' => function($q) {
                $q->where('statut', 'ACTIF');
            }])->findOrFail($employeeId);
            
            if (!$year) {
                $annee = SalaryYear::find($employee->annee_id);
                $year = $annee ? $annee->year : date('Y');
            }
            
            // Récupérer les configurations
            $indemnitesList = $this->safeFetch('indemnites', $employee->annee_id);
            $cotisationsList = $this->safeFetch('cotisations', $year);
            $rcarTypesList = $this->safeFetch('rcar', $year);
            $sntlConfig = $this->safeFetch('sntl', $year);
            $assurancesConfig = $this->safeFetch('assurances', $year);
            $irSettings = $this->safeFetch('ir', $year);
            $retraiteSettings = $this->safeFetch('retraite', $year);
            
            // Calculer
            $salaryDetails = $this->calculateFullSalaryDetails(
                $employee, $indemnitesList, $cotisationsList, $rcarTypesList, 
                $sntlConfig, $assurancesConfig, $irSettings, $retraiteSettings
            );
            
            // 🔥 Supprimer l'ancien enregistrement s'il existe
            EmployeeSalary::where('employee_id', $employeeId)
                ->where('year', $year)
                ->whereNull('month')
                ->delete();
            
            // 🔥 Créer un nouvel enregistrement
            $employeeSalary = EmployeeSalary::create([
                'employee_id' => $employeeId,
                'year' => $year,
                'month' => null,
                'annee_id' => $employee->annee_id,
                'base_salary' => $salaryDetails['base_salary'],
                'indemnites_total' => $salaryDetails['indemnites']['total'],
                'brut_salary' => $salaryDetails['brut_salary'],
                'net_salary' => $salaryDetails['net_salary'],
                'cotisations_total' => $salaryDetails['cotisations']['total'],
                'rcar_total' => $salaryDetails['rcar']['total'],
                'ir_total' => $salaryDetails['ir']['total'],
                'ir_taux' => $salaryDetails['ir']['taux'],
                'sntl_total' => $salaryDetails['sntl']['total'],
                'assurances_salarie' => $salaryDetails['assurances']['salarie'],
                'credits_total' => $salaryDetails['credits']['total'],
                'total_deductions' => $salaryDetails['total_deductions'],
                'indemnites_details' => $salaryDetails['indemnites']['details'],
                'cotisations_details' => $salaryDetails['cotisations']['details'],
                'rcar_details' => $salaryDetails['rcar']['details'],
                'sntl_details' => $salaryDetails['sntl']['details'],
                'assurances_details' => $salaryDetails['assurances']['details'],
                'credits_details' => $salaryDetails['credits']['details']
            ]);
            
            \Log::info('Saving salary', [
                'ir_total' => $salaryDetails['ir']['total'],
                'ir_taux' => $salaryDetails['ir']['taux']
            ]);
            
            return $employeeSalary;
            
        } catch (\Exception $e) {
            Log::error("calculateAndStoreSalary failed for employee {$employeeId}: " . $e->getMessage());
            
            // Fallback : créer un enregistrement minimal
            $employee = Employee::find($employeeId);
            
            // Supprimer l'ancien avant de créer le fallback
            EmployeeSalary::where('employee_id', $employeeId)
                ->where('year', $year ?? date('Y'))
                ->whereNull('month')
                ->delete();
            
            return EmployeeSalary::create([
                'employee_id' => $employeeId,
                'year' => $year ?? date('Y'),
                'month' => null,
                'annee_id' => $employee->annee_id ?? null,
                'base_salary' => $employee->salaire ?? 0,
                'brut_salary' => $employee->salaire ?? 0,
                'net_salary' => $employee->salaire ?? 0,
                'cotisations_total' => 0,
                'rcar_total' => 0,
                'ir_total' => 0,
                'ir_taux' => 0,
                'sntl_total' => 0,
                'assurances_salarie' => 0,
                'credits_total' => 0,
                'total_deductions' => 0,
                'indemnites_details' => [],
                'cotisations_details' => [],
                'rcar_details' => [],
                'sntl_details' => [],
                'assurances_details' => [],
                'credits_details' => []
            ]);
        }
    }

    private function safeFetch($type, $param)
    {
        try {
            switch ($type) {
                case 'indemnites':
                    return $this->fetchIndemnites($param);
                case 'cotisations':
                    return $this->fetchCotisations($param);
                case 'rcar':
                    return $this->fetchRcarTypes($param);
                case 'sntl':
                    return $this->fetchSntlConfig($param);
                case 'assurances':
                    return $this->fetchAssurancesConfig($param);
                case 'ir':
                    $ir = $this->fetchIrSettings($param);
                    return $ir ?: null;
                case 'retraite':
                    $retraite = $this->fetchRetraiteSettings($param);
                    return $retraite ?: null;
                default:
                    return collect([]);
            }
        } catch (\Exception $e) {
            Log::warning("fetch {$type} failed: " . $e->getMessage());
            return $type === 'ir' || $type === 'retraite' ? null : collect([]);
        }
    }

    public function salaryDashboard($id)
    {
        try {
            $employee = Employee::find($id);
            
            if (!$employee) {
                $employee = Employee::where('user_id', $id)->first();
            }
            
            if (!$employee) {
                \Log::error("Employee not found for id/user_id: {$id}");
                return response()->json([
                    'error' => 'Employé non trouvé',
                    'message' => "Aucun employé trouvé pour l'identifiant {$id}"
                ], 404);
            }
            
            if (auth()->user()->role === 'employee' && auth()->id() != $employee->user_id) {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }
            
            $employeeSalary = EmployeeSalary::where('employee_id', $employee->id)
                ->orderBy('year', 'desc')
                ->first();
            
            if (!$employeeSalary) {
                $employeeSalary = $this->calculateAndStoreSalary($employee->id);
            }
            
            // ✅ Récupérer les crédits en temps réel depuis la table employee_credits
            $credits = $employee->credits()->where('statut', 'ACTIF')->get();
            $creditsTotal = 0;
            $creditsDetails = [];
            
            foreach ($credits as $credit) {
                $mensualite = (float) $credit->credit_mensualite;
                if ($mensualite <= 0 && $credit->taux_credit > 0 && $credit->credit_duree > 0) {
                    $tauxMensuel = ($credit->taux_credit / 100) / 12;
                    $mensualite = $credit->montant_credit * ($tauxMensuel * pow(1 + $tauxMensuel, $credit->credit_duree)) / 
                                (pow(1 + $tauxMensuel, $credit->credit_duree) - 1);
                } elseif ($mensualite <= 0) {
                    $mensualite = $credit->montant_credit / $credit->credit_duree;
                }
                
                $creditsTotal += $mensualite;
                $creditsDetails[] = [
                    'name' => $credit->creditType->name ?? 'Crédit',
                    'montant' => round($credit->montant_credit, 2),
                    'mensualite' => round($mensualite, 2),
                    'reste' => round($credit->credit_reste_a_payer, 2),
                    'duree' => $credit->credit_duree,
                    'taux' => $credit->taux_credit
                ];
            }
            
            // ✅ Recalculer le total des déductions avec les crédits en temps réel
            $totalDeductions = ($employeeSalary->cotisations_total ?? 0) + 
                            ($employeeSalary->ir_total ?? 0) + 
                            ($employeeSalary->rcar_total ?? 0) + 
                            ($employeeSalary->sntl_total ?? 0) + 
                            ($employeeSalary->assurances_salarie ?? 0) + 
                            $creditsTotal;
            
            $netSalary = ($employeeSalary->brut_salary ?? 0) - $totalDeductions;
            
            return response()->json([
                'employee' => $employee,
                'salary_details' => [
                    'base_salary' => $employeeSalary->base_salary ?? 0,
                    'indemnites' => [
                        'total' => $employeeSalary->indemnites_total ?? 0,
                        'details' => $employeeSalary->indemnites_details ?? []
                    ],
                    'brut_salary' => $employeeSalary->brut_salary ?? 0,
                    'cotisations' => [
                        'total' => $employeeSalary->cotisations_total ?? 0,
                        'details' => $employeeSalary->cotisations_details ?? []
                    ],
                    'rcar' => [
                        'total' => $employeeSalary->rcar_total ?? 0,
                        'details' => $employeeSalary->rcar_details ?? []
                    ],
                    'ir' => [
                        'total' => $employeeSalary->ir_total ?? 0,
                        'taux' => $employeeSalary->ir_taux ?? 0
                    ],
                    'sntl' => [
                        'total' => $employeeSalary->sntl_total ?? 0,
                        'details' => $employeeSalary->sntl_details ?? []
                    ],
                    'assurances' => [
                        'salarie' => $employeeSalary->assurances_salarie ?? 0,
                        'details' => $employeeSalary->assurances_details ?? []
                    ],
                    'credits' => [
                        'total' => round($creditsTotal, 2),
                        'details' => $creditsDetails
                    ],
                    'total_deductions' => round($totalDeductions, 2),
                    'net_salary' => round($netSalary, 2)
                ],
                'year' => $employeeSalary->year ?? date('Y')
            ]);
            
        } catch (\Exception $e) {
            \Log::error("SalaryDashboard Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

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
            
            $employeeSalary = EmployeeSalary::where('employee_id', $employee->id)
                ->orderBy('year', 'desc')
                ->first();
            
            if (!$employeeSalary) {
                $employeeSalary = $this->calculateAndStoreSalary($employee->id);
            }
            
            // ✅ Récupérer les crédits en temps réel depuis la table employee_credits
            $credits = $employee->credits()->where('statut', 'ACTIF')->get();
            $creditsTotal = 0;
            $creditsDetails = [];
            
            foreach ($credits as $credit) {
                $mensualite = (float) $credit->credit_mensualite;
                if ($mensualite <= 0 && $credit->taux_credit > 0 && $credit->credit_duree > 0) {
                    $tauxMensuel = ($credit->taux_credit / 100) / 12;
                    $mensualite = $credit->montant_credit * ($tauxMensuel * pow(1 + $tauxMensuel, $credit->credit_duree)) / 
                                (pow(1 + $tauxMensuel, $credit->credit_duree) - 1);
                } elseif ($mensualite <= 0) {
                    $mensualite = $credit->montant_credit / $credit->credit_duree;
                }
                
                $creditsTotal += $mensualite;
                $creditsDetails[] = [
                    'name' => $credit->creditType->name ?? 'Crédit',
                    'montant' => round($credit->montant_credit, 2),
                    'mensualite' => round($mensualite, 2),
                    'reste' => round($credit->credit_reste_a_payer, 2),
                    'duree' => $credit->credit_duree,
                    'taux' => $credit->taux_credit
                ];
            }
            
            // ✅ Recalculer le total des déductions avec les crédits en temps réel
            $totalDeductions = ($employeeSalary->cotisations_total ?? 0) + 
                            ($employeeSalary->ir_total ?? 0) + 
                            ($employeeSalary->rcar_total ?? 0) + 
                            ($employeeSalary->sntl_total ?? 0) + 
                            ($employeeSalary->assurances_salarie ?? 0) + 
                            $creditsTotal;
            
            $netSalary = ($employeeSalary->brut_salary ?? 0) - $totalDeductions;
            
            return response()->json([
                'employee' => $employee,
                'salary_details' => [
                    'base_salary' => $employeeSalary->base_salary ?? 0,
                    'indemnites' => [
                        'total' => $employeeSalary->indemnites_total ?? 0,
                        'details' => $employeeSalary->indemnites_details ?? []
                    ],
                    'brut_salary' => $employeeSalary->brut_salary ?? 0,
                    'cotisations' => [
                        'total' => $employeeSalary->cotisations_total ?? 0,
                        'details' => $employeeSalary->cotisations_details ?? []
                    ],
                    'rcar' => [
                        'total' => $employeeSalary->rcar_total ?? 0,
                        'details' => $employeeSalary->rcar_details ?? []
                    ],
                    'ir' => [
                        'total' => $employeeSalary->ir_total ?? 0,
                        'taux' => $employeeSalary->ir_taux ?? 0
                    ],
                    'sntl' => [
                        'total' => $employeeSalary->sntl_total ?? 0,
                        'details' => $employeeSalary->sntl_details ?? []
                    ],
                    'assurances' => [
                        'salarie' => $employeeSalary->assurances_salarie ?? 0,
                        'details' => $employeeSalary->assurances_details ?? []
                    ],
                    'credits' => [
                        'total' => round($creditsTotal, 2),
                        'details' => $creditsDetails
                    ],
                    'total_deductions' => round($totalDeductions, 2),
                    'net_salary' => round($netSalary, 2)
                ],
                'year' => $employeeSalary->year ?? date('Y')
            ]);
            
        } catch (\Exception $e) {
            \Log::error("MySalary Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ============================================================
    // METHODES DE CALCUL PRIVEES AVEC PRECISION
    // ============================================================

    private function calculateIndemnitesForEmployee($salaireBase, $gradeId, $indemnitesList)
    {
        $total = 0.00;
        $appliedIndemnites = [];
        
        foreach ($indemnitesList as $ind) {
            $applicable = $ind->is_for_all;
            if (!$applicable && $ind->grade_id && $ind->grade_id == $gradeId) {
                $applicable = true;
            }
            
            if ($applicable) {
                $montant = 0.00;
                if ($ind->type === 'Fixe') {
                    $montant = floatval($ind->valeur);
                } elseif ($ind->type === 'Pourcentage') {
                    $montant = ($salaireBase * floatval($ind->valeur)) / 100;
                }
                $total += $montant;
                $appliedIndemnites[] = [
                    'libelle' => $ind->libelle,
                    'type' => $ind->type,
                    'valeur' => $ind->valeur,
                    'montant' => round($montant, 2)
                ];
            }
        }
        
        return ['total' => round($total, 2), 'appliedIndemnites' => $appliedIndemnites];
    }

    private function calculateAllCotisations($brutSalary, $cotisationId, $cotisationsList)
    {
         \Log::info('calculateAllCotisations - DEBUG', [
        'brutSalary' => $brutSalary,
        'cotisationId' => $cotisationId,
        'cotisationsList_count' => $cotisationsList->count()
    ]);
        $totalCotisations = 0.00;
        $appliedCotisations = [];
        
        if ($cotisationsList->isEmpty() || !$cotisationId) {
            return ['total' => 0.00, 'details' => []];
        }
        
        $selectedOrganisme = $cotisationsList->firstWhere('organisme_id', $cotisationId);
            \Log::info('calculateAllCotisations - Selected organisme', [
        'organisme_id' => $cotisationId,
        'found' => !is_null($selectedOrganisme),
        'selected' => $selectedOrganisme
    ]);
        if (!$selectedOrganisme) {
            return ['total' => 0.00, 'details' => []];
        }
        
        $cotisationsDeLEstablishment = $cotisationsList->filter(function($cot) use ($cotisationId) {
            return $cot->organisme_id == $cotisationId;
        });
        
        foreach ($cotisationsDeLEstablishment as $cotisation) {
            $taux = floatval($cotisation->taux);
            $plafondMontant = floatval($cotisation->plafond);
            $montantCalcule = ($brutSalary * $taux) / 100;
            
            $montantFinal = $montantCalcule;
            if ($plafondMontant > 0) {
                $montantFinal = min($montantCalcule, $plafondMontant);
            }
            
            $totalCotisations += $montantFinal;
            $appliedCotisations[] = [
                'name' => $cotisation->name,
                'taux' => $taux,
                'montant' => round($montantFinal, 2),
                'organisme' => $selectedOrganisme->organisme_name ?? ''
            ];
        }
        
        return ['total' => round($totalCotisations, 2), 'details' => $appliedCotisations];
    }

    private function calculateIR($salaireBrut, $situationFamiliale, $nombreEnfants, $irSettings)
    {
            \Log::info('calculateIR - START', [
        'salaireBrut' => $salaireBrut,
        'situationFamiliale' => $situationFamiliale,
        'nombreEnfants' => $nombreEnfants,
        'hasIrSettings' => !is_null($irSettings)
    ]);
        if (!$irSettings) {
            return ['ir' => 0.00, 'taux' => 0.00, 'tranche' => null];
        }
        
        $dataRows = $irSettings->data_rows;
        
        if (is_string($dataRows)) {
            $dataRows = json_decode($dataRows, true);
        }
        if (is_object($dataRows)) {
            $dataRows = (array) $dataRows;
        }
        
        if (!$dataRows || !is_array($dataRows) || count($dataRows) == 0) {
            return ['ir' => 0.00, 'taux' => 0.00, 'tranche' => null];
        }
        
        // Déterminer la tranche
        $selectedTranche = null;
        foreach ($dataRows as $row) {
            if (is_object($row)) {
                $row = (array) $row;
            }
            
            $min = floatval($row['min'] ?? 0);
            $max = isset($row['max']) && $row['max'] > 0 ? floatval($row['max']) : PHP_FLOAT_MAX;
            
            if ($salaireBrut >= $min && $salaireBrut <= $max) {
                $selectedTranche = $row;
                break;
            }
        }
        
        if (!$selectedTranche) {
            return ['ir' => 0.00, 'taux' => 0.00, 'tranche' => null];
        }
        
        // Calculer IR brut
        $tauxImpot = floatval($selectedTranche['taux'] ?? 0);
        $irBrut = ($salaireBrut * $tauxImpot) / 100;
        
        // Appliquer les déductions
        $deductions = 0.00;
        
        if ($situationFamiliale === 'Marie(e)') {
            $deductionMarie = floatval($selectedTranche['marie'] ?? 0);
            $deductions += $deductionMarie;
        }
        
        $enfantsACharge = min($nombreEnfants, 2);
        if ($enfantsACharge >= 1) {
            $deductions += floatval($selectedTranche['enfant1'] ?? 0);
        }
        if ($enfantsACharge >= 2) {
            $deductions += floatval($selectedTranche['enfant2'] ?? 0);
        }
        
        // IR net
        $irNet = $irBrut - $deductions;
        $irNet = max(0, $irNet);
    \Log::info('calculateIR - RESULT', [
        'taux_trouve' => $tauxImpot,
        'ir_calcule' => $irNet
    ]);
        return [
            'ir' => round($irNet, 2),
            'taux' => round($tauxImpot, 2),
            'ir_brut' => round($irBrut, 2),
            'deductions' => round($deductions, 2),
            'tranche' => [
                'min' => $selectedTranche['min'] ?? 0,
                'max' => $selectedTranche['max'] ?? 'Illimité',
                'taux' => $tauxImpot
            ]
        ];

    }

    private function calculateSNTL($salaireBrut, $sntlConfigList, $gradeId)
    {
        $totalSNTL = 0.00;
        $appliedSNTL = [];
        
        if ($sntlConfigList->isEmpty()) {
            return ['total' => 0.00, 'details' => []];
        }
        
        foreach ($sntlConfigList as $sntl) {
            $applicable = false;
            if ($sntl->categorie_cible === 'tous') {
                $applicable = true;
            } elseif ($sntl->categorie_cible === 'cadres' && $sntl->grade_id && $sntl->grade_id == $gradeId) {
                $applicable = true;
            }
            
            if ($applicable) {
                $montant = 0.00;
                if ($sntl->type_montant === 'fixe') {
                    $montant = floatval($sntl->valeur);
                } else {
                    $montant = ($salaireBrut * floatval($sntl->valeur)) / 100;
                }
                $totalSNTL += $montant;
                $appliedSNTL[] = [
                    'label' => $sntl->label,
                    'type' => $sntl->type_montant,
                    'valeur' => $sntl->valeur,
                    'montant' => round($montant, 2)
                ];
            }
        }
        
        return ['total' => round($totalSNTL, 2), 'details' => $appliedSNTL];
    }

    private function calculateRCAR($salaireBrut, $rcarTypesList)
    {
        if ($rcarTypesList->isEmpty()) {
            return [
                'totalSalariale' => 0.00, 'totalPatronale' => 0.00, 'totalAutres' => 0.00,
                'totalGeneral' => 0.00, 'types' => [], 'details' => []
            ];
        }
        
        $totalSalariale = 0.00;
        $totalPatronale = 0.00;
        $totalAutres = 0.00;
        $typesWithDetails = [];
        $allDetails = [];
        
        foreach ($rcarTypesList as $type) {
            if (!$type->details || $type->details->isEmpty()) continue;
            
            $typeTotal = 0.00;
            $typeDetails = [];
            
            foreach ($type->details as $detail) {
                $taux = floatval($detail->percentage);
                $plafond = floatval($detail->plafond);
                $designation = $detail->designation ?? $type->label ?? 'RCAR';
                $typeDetail = $detail->type ?? strtolower($type->label) ?? 'autre';
                
                $baseCalcul = ($plafond > 0) ? min($salaireBrut, $plafond) : $salaireBrut;
                $montant = ($baseCalcul * $taux) / 100;
                
                $detailObj = [
                    'name' => $designation,
                    'taux' => $taux,
                    'plafond' => $plafond,
                    'baseCalcul' => round($baseCalcul, 2),
                    'montant' => round($montant, 2),
                    'type' => $typeDetail
                ];
                
                $typeDetails[] = $detailObj;
                $typeTotal += $montant;
                $allDetails[] = $detailObj;
                
                if ($typeDetail === 'salariale' || $type->label === 'Salariale' || $type->label === 'Salariare') {
                    $totalSalariale += $montant;
                } elseif ($typeDetail === 'patronale' || $type->label === 'Patronales') {
                    $totalPatronale += $montant;
                } else {
                    $totalAutres += $montant;
                }
            }
            
            $typesWithDetails[] = [
                'id' => $type->id,
                'name' => $type->label,
                'total' => round($typeTotal, 2),
                'details' => $typeDetails,
                'nature' => ($type->label === 'Salariale' || $type->label === 'Salariare') ? 'salariale' 
                    : ($type->label === 'Patronales' ? 'patronale' : 'autre')
            ];
        }
        
        return [
            'totalSalariale' => round($totalSalariale, 2),
            'totalPatronale' => round($totalPatronale, 2),
            'totalAutres' => round($totalAutres, 2),
            'totalGeneral' => round($totalSalariale + $totalPatronale + $totalAutres, 2),
            'types' => $typesWithDetails,
            'details' => $allDetails
        ];
    }

    private function calculateAssurancesSociales($salaireBrut, $assurancesConfigList)
    {
        if ($assurancesConfigList->isEmpty()) {
            return ['totalEmployeur' => 0.00, 'totalSalarie' => 0.00, 'total' => 0.00, 'details' => []];
        }
        
        $totalEmployeur = 0.00;
        $totalSalarie = 0.00;
        $appliedAssurances = [];
        
        foreach ($assurancesConfigList as $assurance) {
            if ($assurance->is_active) {
                $tauxEmployeur = floatval($assurance->taux_employeur);
                $tauxSalarie = floatval($assurance->taux_salarie);
                
                $montantEmployeur = ($salaireBrut * $tauxEmployeur) / 100;
                $montantSalarie = ($salaireBrut * $tauxSalarie) / 100;
                
                $plafondMensuel = $assurance->plafond_mensuel ? floatval($assurance->plafond_mensuel) : null;
                if ($plafondMensuel && $montantEmployeur > $plafondMensuel) {
                    $ratio = $plafondMensuel / $montantEmployeur;
                    $montantEmployeur = $plafondMensuel;
                    $montantSalarie = $montantSalarie * $ratio;
                }
                
                $totalEmployeur += $montantEmployeur;
                $totalSalarie += $montantSalarie;
                
                $appliedAssurances[] = [
                    'id' => $assurance->id,
                    'name' => $assurance->name,
                    'code' => $assurance->code,
                    'taux_employeur' => $tauxEmployeur,
                    'taux_salarie' => $tauxSalarie,
                    'montant_employeur' => round($montantEmployeur, 2),
                    'montant_salarie' => round($montantSalarie, 2),
                    'plafond' => $plafondMensuel
                ];
            }
        }
        
        return [
            'totalEmployeur' => round($totalEmployeur, 2),
            'totalSalarie' => round($totalSalarie, 2),
            'total' => round($totalEmployeur + $totalSalarie, 2),
            'details' => $appliedAssurances
        ];
    }

    private function calculateCredits($credits)
    {
        $totalMensualites = 0.00;
        $appliedCredits = [];
        
        foreach ($credits as $credit) {
            if ($credit->statut === 'ACTIF' && $credit->montant_credit > 0) {
                $mensualite = (float) $credit->credit_mensualite;
                if ($mensualite <= 0 && $credit->taux_credit > 0 && $credit->credit_duree > 0) {
                    $tauxMensuel = ($credit->taux_credit / 100) / 12;
                    $mensualite = $credit->montant_credit * ($tauxMensuel * pow(1 + $tauxMensuel, $credit->credit_duree)) / 
                                (pow(1 + $tauxMensuel, $credit->credit_duree) - 1);
                } elseif ($mensualite <= 0) {
                    $mensualite = $credit->montant_credit / $credit->credit_duree;
                }
                
                $totalMensualites += $mensualite;
                $appliedCredits[] = [
                    'name' => $credit->creditType->name ?? 'Crédit',
                    'montant' => round($credit->montant_credit, 2),
                    'mensualite' => round($mensualite, 2),
                    'reste' => round($credit->credit_reste_a_payer, 2),
                    'duree' => $credit->credit_duree,
                    'taux' => $credit->taux_credit
                ];
            }
        }
        
        return ['total' => round($totalMensualites, 2), 'details' => $appliedCredits, 'nombre_credits' => count($appliedCredits)];
    }

    private function calculateFullSalaryDetails($employee, $indemnitesList, $cotisationsList, $rcarTypes, $sntlConfig, $assurances, $irSettings, $retraiteSettings)
    {
        $baseSalary = floatval($employee->salaire) ?? 0.00;
        
        // 1. Indemnités
        $indemnitesResult = $this->calculateIndemnitesForEmployee(
            $baseSalary,
            $employee->grade_id,
            $indemnitesList
        );
        
        $brutSalary = $baseSalary + $indemnitesResult['total'];
        
        // 2. Cotisations
            \Log::info('Before calculateAllCotisations', [
        'brutSalary' => $brutSalary,
        'cotisation_id' => $employee->cotisation_id
    ]);
        $cotisationsResult = $this->calculateAllCotisations(
            $brutSalary,
            $employee->cotisation_id,
            $cotisationsList
        );
            \Log::info('After calculateAllCotisations', [
        'total' => $cotisationsResult['total'],
        'details_count' => count($cotisationsResult['details'])
    ]);
        
        // 3. RCAR
        $ageEmployee = $this->verifierAgePourRetraite($employee->date_naissance);
        $ageLegal = $retraiteSettings->age_legal ?? 60;
        
        $rcarResult = [
            'totalSalariale' => 0.00,
            'totalPatronale' => 0.00,
            'totalAutres' => 0.00,
            'totalGeneral' => 0.00,
            'types' => [],
            'details' => []
        ];
        
        if ($ageEmployee < $ageLegal) {
            $rcarResult = $this->calculateRCAR($brutSalary, $rcarTypes);
        }
        
        // 4. IR
        $irResult = $this->calculateIR(
            $brutSalary,
            $employee->situation_familiale,
            intval($employee->nombre_enfants ?? 0),
            $irSettings
        );
        
        // 5. SNTL
        $sntlResult = $this->calculateSNTL(
            $brutSalary,
            $sntlConfig,
            $employee->grade_id
        );
        
        // 6. Assurances
        $assurancesResult = $this->calculateAssurancesSociales(
            $brutSalary,
            $assurances
        );
        
        // 7. Credits
        $creditsResult = $this->calculateCredits($employee->credits);
        
        // 8. Total déductions
        $totalDeductions = $cotisationsResult['total'] + $irResult['ir'] + 
                           ($rcarResult['totalSalariale'] + $rcarResult['totalPatronale'] + $rcarResult['totalAutres']) + 
                           $sntlResult['total'] + 
                           $assurancesResult['totalSalarie'] +  
                           $creditsResult['total'];
        
        // 9. Salaire net
        $netSalary = $brutSalary - $totalDeductions;
        
        return [
            'base_salary' => round($baseSalary, 2),
            'indemnites' => [
                'total' => round($indemnitesResult['total'], 2),
                'details' => $indemnitesResult['appliedIndemnites']
            ],
            'brut_salary' => round($brutSalary, 2),
            'cotisations' => [
                'total' => round($cotisationsResult['total'], 2),
                'details' => $cotisationsResult['details']
            ],
            'rcar' => [
                'total' => round($rcarResult['totalSalariale'] + $rcarResult['totalPatronale'] + $rcarResult['totalAutres'], 2),
                'details' => $rcarResult['details']
            ],
            'ir' => [
                'total' => $irResult['ir'],
                'taux' => $irResult['taux']
            ],
            'sntl' => [
                'total' => round($sntlResult['total'], 2),
                'details' => $sntlResult['details']
            ],
            'assurances' => [
                'salarie' => round($assurancesResult['totalSalarie'], 2),
                'details' => $assurancesResult['details']
            ],
            'credits' => [
                'total' => round($creditsResult['total'], 2),
                'details' => $creditsResult['details']
            ],
            'total_deductions' => round($totalDeductions, 2),
            'net_salary' => round($netSalary, 2)
        ];
    }

    private function verifierAgePourRetraite($dateNaissance)
    {
        if (!$dateNaissance) return 0;
        $aujourdhui = new DateTime();
        $dateNaiss = new DateTime($dateNaissance);
        return $aujourdhui->diff($dateNaiss)->y;
    }

    private function fetchIndemnites($anneeId)
    {
        return \App\Models\SuperAdmin\GestionIndemnite::where('salary_year_id', $anneeId)->get();
    }

    private function fetchCotisations($year)
    {
        try {
            $cotisations = DB::table('cotisations')
                ->select(
                    'cotisations.id',
                    'cotisations.name',
                    'cotisations.taux',
                    'cotisations.plafond',
                    'cotisations.organisme_id',
                    'organisme.nom as organisme_name'
                )
                ->join('organisme', 'organisme.id', '=', 'cotisations.organisme_id')
                ->where('organisme.annee', $year)
                ->get();
            
            // 🔍 LOG
            \Log::info('fetchCotisations result', [
                'year' => $year,
                'count' => $cotisations->count(),
                'cotisations' => $cotisations->toArray()
            ]);
            
            return $cotisations;
        } catch (\Exception $e) {
            \Log::error("fetchCotisations error: " . $e->getMessage());
            return collect([]);
        }
    }
    
    private function fetchRcarTypes($year)
    {
        $salaryYear = \App\Models\SuperAdmin\SalaryYear::where('year', $year)->first();
        if (!$salaryYear) {
            return collect([]);
        }
        return \App\Models\SuperAdmin\RcarType::with('details')
            ->where('salary_year_id', $salaryYear->id)
            ->get();
    }

    private function fetchSntlConfig($year)
    {
        $salaryYear = \App\Models\SuperAdmin\SalaryYear::where('year', $year)->first();
        if (!$salaryYear) {
            return collect([]);
        }
        return \App\Models\SuperAdmin\SntlSetting::where('salary_year_id', $salaryYear->id)->get();
    }

    private function fetchAssurancesConfig($year)
    {
        $salaryYear = \App\Models\SuperAdmin\SalaryYear::where('year', $year)->first();
        if (!$salaryYear) {
            return collect([]);
        }
        return \App\Models\SuperAdmin\Assurance::where('annee_id', $salaryYear->id)->get();
    }

    private function fetchIrSettings($year)
    {
        $irData = \App\Models\SuperAdmin\GestionIR::where('annee', $year)->first();
        
        if (!$irData) {
            return null;
        }
        
        $dataRows = $irData->data_rows;
        if (is_string($dataRows)) {
            $dataRows = json_decode($dataRows, true);
        }
        
        if (is_object($dataRows)) {
            $dataRows = (array) $dataRows;
        }
        
        return (object) [
            'id' => $irData->id,
            'annee' => $irData->annee,
            'data_rows' => $dataRows,
            'created_at' => $irData->created_at,
            'updated_at' => $irData->updated_at,
        ];
    }

    private function fetchRetraiteSettings($year)
    {
        return \App\Models\SuperAdmin\RetraiteSetting::where('year', $year)->first();
    }
}