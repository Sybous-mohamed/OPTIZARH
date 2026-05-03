<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\Credit;
use App\Models\SuperAdmin\CreditCategory;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\RcarType;
use App\Models\SuperAdmin\RcarDetail;
use App\Models\SuperAdmin\Organisme;
use App\Models\SuperAdmin\Cotisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller{
    public function getStats(Request $request){
        try {
            $annee = $request->query('year', date('Y'));
            
            // Récupérer l'ID de l'année
            $yearObj = SalaryYear::where('year', $annee)->first();
            $yearId = $yearObj ? $yearObj->id : null;
            
            // ==================== EMPLOYÉS ====================
            $totalEmployees = Employee::count();
            $activeEmployees = Employee::where('statut', 'ACTIF')->count();
            $congeEmployees = Employee::where('statut', 'CONGÉ')->count();
            $departEmployees = Employee::where('statut', 'DÉPART')->count();
            
            // ==================== SALAIRES ====================
            $totalSalaireBrut = Employee::sum('salaire') ?: 0;
            
            // ==================== CRÉDITS ====================
            $totalCredits = Credit::count();
            $activeCredits = Credit::where('status', 'Actif')->count();
            $totalCreditAmount = Credit::sum('max_amount') ?: 0;
            
            // Crédits par catégorie
            $creditsByCategory = Credit::select('category_id', DB::raw('count(*) as total'))
                ->whereNotNull('category_id')
                ->where('year', $annee)
                ->groupBy('category_id')
                ->get()
                ->map(function($item) {
                    $category = CreditCategory::find($item->category_id);
                    return [
                        'name' => $category ? $category->name : 'N/A',
                        'total' => $item->total
                    ];
                });
            
            // Crédits par année
            $creditsByYear = Credit::select('year', DB::raw('count(*) as total'))
                ->whereNotNull('year')
                ->groupBy('year')
                ->orderBy('year', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'year' => (string)$item->year,
                        'total' => $item->total
                    ];
                });
            
            // ==================== COTISATIONS ====================
            $cotisationsDetails = [];
            $totalCotisations = 0;
            
            $organismes = Organisme::where('annee', $annee)->get();
            
            if ($organismes->isNotEmpty()) {
                foreach ($organismes as $org) {
                    $cotisations = Cotisation::where('organisme_id', $org->id)->get();
                    $orgTotal = 0;
                    $orgTaux = 0;
                    
                    foreach ($cotisations as $cot) {
                        $montant = ($totalSalaireBrut * ($cot->taux / 100));
                        $orgTotal += $montant;
                        $orgTaux += $cot->taux;
                    }
                    
                    $totalCotisations += $orgTotal;
                    $cotisationsDetails[] = [
                        'name' => $org->nom,
                        'total' => round($orgTotal, 2),
                        'taux' => round($orgTaux, 2)
                    ];
                }
            }
            
            // ==================== RCAR ====================
            $totalRCAR = 0;
            $rcarDetails = [];
            
            if ($yearId) {
                $rcarTypes = RcarType::where('salary_year_id', $yearId)->get();
                
                foreach ($rcarTypes as $rcarType) {
                    $details = RcarDetail::where('rcar_type_id', $rcarType->id)->get();
                    foreach ($details as $detail) {
                        $montant = ($totalSalaireBrut * ($detail->percentage / 100));
                        if ($detail->type === 'salariale') {
                            $totalRCAR += $montant;
                        }
                        $rcarDetails[] = [
                            'designation' => $detail->designation,
                            'type' => $detail->type ?? 'salariale',
                            'taux' => $detail->percentage,
                            'plafond' => $detail->plafond,
                            'montant' => round($montant, 2)
                        ];
                    }
                }
            }
            
            // ==================== ASSURANCES ====================
            $totalAssurances = 0;
            
            if ($yearId) {
                $assurances = Assurance::where('annee_id', $yearId)->get();
                foreach ($assurances as $assurance) {
                    if ($assurance->taux_employeur > 0) {
                        $totalAssurances += ($totalSalaireBrut * ($assurance->taux_employeur / 100));
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
            
            // ==================== ÉVOLUTION MENSUELLE ====================
            $monthlyEvolution = [];
            $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            $baseSalary = $totalSalaireBrut / 12;
            $baseCotisation = $totalCotisations / 12;
            
            for ($i = 0; $i < 12; $i++) {
                $growth = 1 + (($i - 5) * 0.02);
                $monthlyEvolution[] = [
                    'name' => $months[$i],
                    'salaires' => round($baseSalary * $growth, 2),
                    'cotisations' => round($baseCotisation * $growth, 2)
                ];
            }
            
            // ==================== STATUTS EMPLOYÉS ====================
            $employeeStatus = [
                ['name' => 'Actifs', 'value' => $activeEmployees, 'color' => '#10b981'],
                ['name' => 'Congé', 'value' => $congeEmployees, 'color' => '#f59e0b'],
                ['name' => 'Départ', 'value' => $departEmployees, 'color' => '#ef4444']
            ];
            
            // ==================== SALAIRE PAR GRADE ====================
            $salaryByGrade = [];
            
            if ($yearId) {
                $salaryByGrade = DB::table('employees as e')
                    ->join('grades as g', 'e.grade_id', '=', 'g.id')
                    ->select('g.name as name', DB::raw('SUM(e.salaire) as total'))
                    ->where('e.annee_id', $yearId)
                    ->where('e.salaire', '>', 0)
                    ->whereNotNull('e.grade_id')
                    ->groupBy('g.id', 'g.name')
                    ->orderBy('total', 'desc')
                    ->get()
                    ->map(function($item) {
                        return [
                            'name' => $item->name,
                            'total' => round($item->total, 2)
                        ];
                    });
                
                if ($salaryByGrade->isEmpty()) {
                    $salaryByGrade = Employee::select('grade', DB::raw('SUM(salaire) as total'))
                        ->whereNotNull('grade')
                        ->where('grade', '!=', '')
                        ->where('salaire', '>', 0)
                        ->where('annee_id', $yearId)
                        ->groupBy('grade')
                        ->orderBy('total', 'desc')
                        ->get()
                        ->map(function($item) {
                            return [
                                'name' => $item->grade ?: 'Non spécifié',
                                'total' => round($item->total, 2)
                            ];
                        });
                }
            }
            
            // ==================== ANNÉES DISPONIBLES (CORRIGÉ) ====================
            // Afficher uniquement les années qui ont des crédits
            $availableYears = Credit::select('year')
                ->whereNotNull('year')
                ->distinct()
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->toArray();
            
            // Si aucune année avec crédits, prendre les années de salary_years
            if (empty($availableYears)) {
                $availableYears = SalaryYear::orderBy('year', 'desc')->pluck('year')->toArray();
            }
            
            // Si toujours vide, mettre des valeurs par défaut
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
                    'total_charges' => round($totalCotisations + $totalRCAR + $totalAssurances + $totalSNTL, 2)
                ],
                'charts' => [
                    'credits_by_category' => $creditsByCategory,
                    'credits_by_year' => $creditsByYear,
                    'salary_by_grade' => $salaryByGrade,
                    'monthly_evolution' => $monthlyEvolution,
                    'employee_status' => $employeeStatus,
                    'cotisations_details' => $cotisationsDetails,
                    'rcar_details' => $rcarDetails
                ],
                'current_year' => (int)$annee,
                'available_years' => $availableYears
            ]);
            
        } catch (\Exception $e) {
            Log::error("Dashboard Error: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'stats' => [
                    'total_employees' => Employee::count(),
                    'active_employees' => Employee::where('statut', 'ACTIF')->count(),
                    'conge_employees' => 0,
                    'depart_employees' => 0,
                    'total_salary' => Employee::sum('salaire') ?: 0,
                    'total_credits' => Credit::count(),
                    'active_credits' => Credit::where('status', 'Actif')->count(),
                    'total_credit_amount' => Credit::sum('max_amount') ?: 0,
                    'total_cotisations' => 0,
                    'total_rcar' => 0,
                    'total_assurances' => 0,
                    'total_sntl' => 0,
                    'total_charges' => 0
                ],
                'charts' => [
                    'credits_by_category' => [],
                    'credits_by_year' => [],
                    'salary_by_grade' => [],
                    'monthly_evolution' => [],
                    'employee_status' => [
                        ['name' => 'Actifs', 'value' => Employee::where('statut', 'ACTIF')->count(), 'color' => '#10b981'],
                        ['name' => 'Congé', 'value' => 0, 'color' => '#f59e0b'],
                        ['name' => 'Départ', 'value' => 0, 'color' => '#ef4444']
                    ],
                    'cotisations_details' => [],
                    'rcar_details' => []
                ],
                'current_year' => (int)$annee,
                'available_years' => [date('Y'), date('Y')-1, date('Y')-2]
            ]);
        }
    }
}