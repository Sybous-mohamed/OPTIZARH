<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\RcarType;
use App\Models\SuperAdmin\RcarDetail;
use App\Models\SuperAdmin\Cotisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Calculer les indemnités pour un employé
     */
    private function calculerIndemnitesPourEmploye($employee, $yearId)
    {
        $totalIndemnites = 0;
        
        try {
            $indemnites = DB::table('gestion_indemnites')
                ->where('salary_year_id', $yearId)
                ->get();
            
            foreach ($indemnites as $ind) {
                $applicable = false;
                
                if ($ind->is_for_all) {
                    $applicable = true;
                } else {
                    if ($ind->Post_id && $ind->Post_id != $employee->Post_id) continue;
                    if ($ind->grade_id && $ind->grade_id != $employee->grade_id) continue;
                    if ($ind->echelle_id && $ind->echelle_id != $employee->echelle_id) continue;
                    if ($ind->echelon_id && $ind->echelon_id != $employee->echelon_id) continue;
                    $applicable = true;
                }
                
                if ($applicable) {
                    if ($ind->type === 'Fixe') {
                        $totalIndemnites += $ind->valeur;
                    } else {
                        $totalIndemnites += ($employee->salaire * $ind->valeur / 100);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Erreur calcul indemnités: ' . $e->getMessage());
        }
        
        return $totalIndemnites;
    }

    public function getStats(Request $request)
    {
        try {
            $annee = $request->query('year', date('Y'));
            
            $yearObj = SalaryYear::where('year', $annee)->first();
            $yearId = $yearObj ? $yearObj->id : null;
            
            // ==================== EMPLOYÉS ====================
            $employees = Employee::all();
            $totalEmployees = $employees->count();
            $activeEmployees = 0;
            $congeEmployees = 0;
            $departEmployees = 0;
            $totalSalaireBrut = 0;
            
            $salaryByGradeTemp = [];
            
            foreach ($employees as $emp) {
                if ($emp->statut === 'ACTIF') $activeEmployees++;
                elseif ($emp->statut === 'CONGE') $congeEmployees++;
                elseif ($emp->statut === 'DEPART') $departEmployees++;
                
                $indemnitesTotal = $this->calculerIndemnitesPourEmploye($emp, $yearId);
                $salaireBrut = ($emp->salaire ?? 0) + $indemnitesTotal;
                $totalSalaireBrut += $salaireBrut;
                
                $gradeName = $emp->grade ?? 'Non spécifié';
                if (!isset($salaryByGradeTemp[$gradeName])) {
                    $salaryByGradeTemp[$gradeName] = 0;
                }
                $salaryByGradeTemp[$gradeName] += $salaireBrut;
            }
            
            $salaryByGrade = [];
            foreach ($salaryByGradeTemp as $name => $total) {
                $salaryByGrade[] = ['name' => $name, 'total' => round($total, 2)];
            }
            usort($salaryByGrade, fn($a, $b) => $b['total'] <=> $a['total']);
            $salaryByGrade = array_slice($salaryByGrade, 0, 8);
            
            // ==================== CRÉDITS ====================
            $totalCredits = EmployeeCredit::count();
            $activeCredits = EmployeeCredit::where('statut', 'ACTIF')->count();
            $totalCreditAmount = EmployeeCredit::sum('montant_credit') ?: 0;
            $totalCreditsMensualites = EmployeeCredit::where('statut', 'ACTIF')->sum('credit_mensualite') ?: 0;
            
            $creditsByYear = EmployeeCredit::select(
                DB::raw('YEAR(created_at) as year'), 
                DB::raw('count(*) as total')
            )
            ->whereNotNull('created_at')
            ->groupBy('year')
            ->orderBy('year', 'desc')
            ->get()
            ->map(fn($item) => ['year' => (string)$item->year, 'total' => $item->total]);
            
            // ==================== COTISATIONS ====================
            $totalCotisations = 0;
            $cotisationsDetails = [];
            
            if ($totalSalaireBrut > 0) {
                $cotisations = Cotisation::all();
                foreach ($cotisations as $cot) {
                    $montant = ($totalSalaireBrut * ($cot->taux / 100));
                    $totalCotisations += $montant;
                    $cotisationsDetails[] = [
                        'name' => $cot->name ?? 'Cotisation',
                        'total' => round($montant, 2)
                    ];
                }
            }
            
            // ==================== RCAR ====================
            $totalRCAR = 0;
            if ($yearId) {
                $rcarTypes = RcarType::where('salary_year_id', $yearId)->get();
                foreach ($rcarTypes as $rcarType) {
                    $details = RcarDetail::where('rcar_type_id', $rcarType->id)->get();
                    foreach ($details as $detail) {
                        $baseCalcul = $totalSalaireBrut;
                        if ($detail->plafond && $detail->plafond > 0) {
                            $baseCalcul = min($totalSalaireBrut, $detail->plafond);
                        }
                        $totalRCAR += ($baseCalcul * ($detail->percentage / 100));
                    }
                }
            }
            
            // ==================== IR (estimé) ====================
            $totalIR = 0;
            foreach ($employees as $emp) {
                $salaireBrut = ($emp->salaire ?? 0) + $this->calculerIndemnitesPourEmploye($emp, $yearId);
                if ($salaireBrut > 10000) {
                    $totalIR += $salaireBrut * 0.35;
                } elseif ($salaireBrut > 6000) {
                    $totalIR += $salaireBrut * 0.25;
                } elseif ($salaireBrut > 3000) {
                    $totalIR += $salaireBrut * 0.15;
                } else {
                    $totalIR += $salaireBrut * 0.05;
                }
            }
            
            // ==================== ASSURANCES ====================
            $totalAssurances = 0;
            if ($yearId) {
                $assurances = Assurance::where('annee_id', $yearId)->get();
                foreach ($assurances as $assurance) {
                    if ($assurance->taux_employeur > 0) {
                        $baseCalcul = $totalSalaireBrut;
                        if ($assurance->plafond_mensuel && $assurance->plafond_mensuel > 0) {
                            $baseCalcul = min($totalSalaireBrut, $assurance->plafond_mensuel);
                        }
                        $totalAssurances += ($baseCalcul * ($assurance->taux_employeur / 100));
                    }
                }
            }
            
            // ==================== SNTL ====================
            $totalSNTL = 0;
            if ($yearId) {
                $sntlConfigs = SntlSetting::where('salary_year_id', $yearId)->get();
                foreach ($sntlConfigs as $sntl) {
                    if ($sntl->type_montant === 'pourcentage') {
                        $totalSNTL += ($totalSalaireBrut * ($sntl->valeur / 100));
                    } else {
                        $totalSNTL += $sntl->valeur * $totalEmployees;
                    }
                }
            }
            
            // ==================== TOTAUX ====================
            $totalDeductionsSalarie = $totalCotisations + $totalRCAR + $totalCreditsMensualites + $totalIR;
            $totalChargesPatronales = $totalAssurances + $totalSNTL;
            
            // ==================== ÉVOLUTION DES CHARGES (POUR OPTION 2 - garder pour les stats) ====================
            $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            $monthlyDummyData = [];
            
            for ($i = 0; $i < 12; $i++) {
                $variation = 0.85 + ($i * 0.03);
                $monthlyDummyData[] = [
                    'name' => $months[$i],
                    'cotisations' => 0,
                    'rcar' => 0
                ];
            }
            
            // ==================== STATUTS ====================
            $employeeStatus = [
                ['name' => 'Actifs', 'value' => $activeEmployees, 'color' => '#10b981'],
                ['name' => 'Congé', 'value' => $congeEmployees, 'color' => '#f59e0b'],
                ['name' => 'Départ', 'value' => $departEmployees, 'color' => '#ef4444']
            ];
            
            // ==================== ANNÉES DISPONIBLES ====================
            $availableYears = SalaryYear::orderBy('year', 'desc')->pluck('year')->toArray();
            if (empty($availableYears)) {
                $availableYears = [date('Y'), date('Y')-1, date('Y')-2];
            }
            
            return response()->json([
                'stats' => [
                    'total_employees' => $totalEmployees,
                    'active_employees' => $activeEmployees,
                    'conge_employees' => $congeEmployees,
                    'depart_employees' => $departEmployees,
                    'total_salary' => round($totalSalaireBrut, 2),
                    'total_credits' => $totalCredits,
                    'active_credits' => $activeCredits,
                    'total_credit_amount' => round($totalCreditAmount, 2),
                    'total_cotisations' => round($totalCotisations, 2),
                    'total_rcar' => round($totalRCAR, 2),
                    'total_assurances' => round($totalAssurances, 2),
                    'total_sntl' => round($totalSNTL, 2),
                    'total_charges_patronales' => round($totalChargesPatronales, 2),
                    'total_deductions_salarie' => round($totalDeductionsSalarie, 2),
                    'total_credits_mensualites' => round($totalCreditsMensualites, 2),
                    'total_ir' => round($totalIR, 2),
                ],
                'charts' => [
                    'credits_by_year' => $creditsByYear,
                    'salary_by_grade' => $salaryByGrade,
                    'monthly_evolution' => $monthlyDummyData,
                    'employee_status' => $employeeStatus,
                    'cotisations_details' => $cotisationsDetails
                ],
                'current_year' => (int)$annee,
                'available_years' => $availableYears
            ]);
            
        } catch (\Exception $e) {
            Log::error('Dashboard Error: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            
            return response()->json([
                'error' => $e->getMessage(),
                'stats' => [
                    'total_employees' => Employee::count(),
                    'active_employees' => Employee::where('statut', 'ACTIF')->count(),
                    'conge_employees' => 0,
                    'depart_employees' => 0,
                    'total_salary' => Employee::sum('salaire') ?: 0,
                    'total_credits' => 0,
                    'active_credits' => 0,
                    'total_credit_amount' => 0,
                    'total_cotisations' => 0,
                    'total_rcar' => 0,
                    'total_assurances' => 0,
                    'total_sntl' => 0,
                    'total_charges_patronales' => 0,
                    'total_deductions_salarie' => 0,
                    'total_credits_mensualites' => 0,
                    'total_ir' => 0,
                ],
                'charts' => [
                    'credits_by_year' => [],
                    'salary_by_grade' => [],
                    'monthly_evolution' => [],
                    'employee_status' => [],
                    'cotisations_details' => []
                ],
                'current_year' => (int)$annee,
                'available_years' => [date('Y')]
            ]);
        }
    }
}