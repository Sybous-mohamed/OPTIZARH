<?php
namespace App\Http\Controllers\RH;
use Illuminate\Http\Request;

use App\Http\Controllers\Controller;
use App\Models\employee\EmployeeSalary;
use App\Models\SuperAdmin\Employee;

use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\EmployeeCredit;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Auth\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use DateTime;

class salaryController extends Controller {
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
}