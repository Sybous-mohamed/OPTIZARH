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
                elseif ($emp->statut === 'CONGE' || $emp->statut === 'CONGÉ') $congeEmployees++;
                elseif ($emp->statut === 'DEPART' || $emp->statut === 'DÉPART') $departEmployees++;
                
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
            
            // Compatible SQLite et MySQL
            $creditsByYear = EmployeeCredit::select(
                DB::raw(DB::connection()->getDriverName() === 'sqlite' 
                    ? "strftime('%Y', created_at) as year" 
                    : "YEAR(created_at) as year"), 
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
            
            $cotisations = Cotisation::all();
            foreach ($cotisations as $cot) {
                $montant = ($totalSalaireBrut * ($cot->taux / 100));
                $totalCotisations += $montant;
                $cotisationsDetails[] = [
                    'name' => $cot->name ?? 'Cotisation',
                    'total' => round($montant, 2)
                ];
            }
            
            // ==================== RCAR ====================
            $totalRCAR = 0;
            $rcarDetails = [];
            
            if ($yearId) {
                $rcarTypes = RcarType::where('salary_year_id', $yearId)->get();
                foreach ($rcarTypes as $rcarType) {
                    $details = RcarDetail::where('rcar_type_id', $rcarType->id)->get();
                    foreach ($details as $detail) {
                        $baseCalcul = $totalSalaireBrut;
                        if ($detail->plafond && $detail->plafond > 0) {
                            $baseCalcul = min($totalSalaireBrut, $detail->plafond);
                        }
                        $montant = ($baseCalcul * ($detail->percentage / 100));
                        $totalRCAR += $montant;
                        $rcarDetails[] = [
                            'name' => $detail->designation ?? $rcarType->label,
                            'total' => round($montant, 2)
                        ];
                    }
                }
            }
            
            // ==================== IR (calcul précis) ====================
            $totalIR = 0;
            
            // Barèmes IR Maroc 2025
            $irBaremes = [
                ['min' => 0, 'max' => 30000, 'taux' => 0, 'deduction' => 0],
                ['min' => 30001, 'max' => 50000, 'taux' => 0.10, 'deduction' => 3000],
                ['min' => 50001, 'max' => 60000, 'taux' => 0.20, 'deduction' => 8000],
                ['min' => 60001, 'max' => 80000, 'taux' => 0.30, 'deduction' => 14000],
                ['min' => 80001, 'max' => 180000, 'taux' => 0.34, 'deduction' => 17200],
                ['min' => 180001, 'max' => PHP_FLOAT_MAX, 'taux' => 0.38, 'deduction' => 24400],
            ];
            
            foreach ($employees as $emp) {
                $salaireBrut = ($emp->salaire ?? 0) + $this->calculerIndemnitesPourEmploye($emp, $yearId);
                $salaireAnnuel = $salaireBrut * 12;
                
                $irAnnuel = 0;
                foreach ($irBaremes as $tranche) {
                    if ($salaireAnnuel > $tranche['min']) {
                        $assiette = min($salaireAnnuel, $tranche['max']) - $tranche['min'];
                        if ($assiette > 0) {
                            $irAnnuel += $assiette * $tranche['taux'];
                        }
                    }
                }
                
                // Déduction pour famille
                $nombreEnfants = $emp->nombre_enfants ?? 0;
                $deductionEnfant = $nombreEnfants > 0 ? 360 * $nombreEnfants : 0;
                $irAnnuel -= $deductionEnfant;
                $irAnnuel = max(0, $irAnnuel);
                
                $totalIR += $irAnnuel / 12;
            }
            
            // ==================== ASSURANCES ====================
            $totalAssurances = 0;
            $assurancesDetails = [];
            
            if ($yearId) {
                $assurances = Assurance::where('annee_id', $yearId)->where('is_active', true)->get();
                foreach ($assurances as $assurance) {
                    if ($assurance->taux_employeur > 0) {
                        $baseCalcul = $totalSalaireBrut;
                        if ($assurance->plafond_mensuel && $assurance->plafond_mensuel > 0) {
                            $nombreEmployes = max(1, $employees->count());
                            $plafondTotal = $assurance->plafond_mensuel * $nombreEmployes;
                            $baseCalcul = min($totalSalaireBrut, $plafondTotal);
                        }
                        $montant = ($baseCalcul * ($assurance->taux_employeur / 100));
                        $totalAssurances += $montant;
                        $assurancesDetails[] = [
                            'name' => $assurance->name,
                            'total' => round($montant, 2)
                        ];
                    }
                }
            }
            
            // ==================== SNTL ====================
            $totalSNTL = 0;
            $sntlDetails = [];
            
            if ($yearId) {
                $sntlConfigs = SntlSetting::where('salary_year_id', $yearId)->get();
                foreach ($sntlConfigs as $sntl) {
                    if ($sntl->type_montant === 'pourcentage') {
                        $montant = ($totalSalaireBrut * ($sntl->valeur / 100));
                    } else {
                        $montant = $sntl->valeur;
                    }
                    $totalSNTL += $montant;
                    $sntlDetails[] = [
                        'name' => $sntl->label ?? 'SNTL',
                        'total' => round($montant, 2)
                    ];
                }
            }
            
            // ==================== TOTAUX ====================
            $totalDeductionsSalarie = $totalCotisations + $totalRCAR + $totalCreditsMensualites + $totalIR;
            $totalChargesPatronales = $totalAssurances + $totalSNTL;
            
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
                    'employee_status' => $employeeStatus,
                    'cotisations_details' => $cotisationsDetails,
                    'assurances_details' => $assurancesDetails,
                    'rcar_details' => $rcarDetails,
                    'sntl_details' => $sntlDetails
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
                    'employee_status' => [],
                    'cotisations_details' => [],
                    'assurances_details' => [],
                    'rcar_details' => [],
                    'sntl_details' => []
                ],
                'current_year' => (int)$annee,
                'available_years' => [date('Y')]
            ]);
        }
    }
}