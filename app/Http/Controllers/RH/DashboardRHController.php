<?php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\Employe\LeaveRequest;
use App\Models\Employe\EmployeeSalary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardRHController extends Controller
{
public function getStats(Request $request)
{
    try {
        $year = $request->query('year', date('Y'));
        
        $salaryYear = SalaryYear::where('year', $year)->first();
        
        if (!$salaryYear) {
            return response()->json([
                'success' => true,
                'data' => $this->getEmptyStats($year)
            ]);
        }
        
        $yearId = $salaryYear->id;
        
        // ========== EMPLOYEE STATS ==========
        // 🔥 FILTRE: Seulement les employés (exclure ceux avec user.role = 'rh' ou 'superadmin')
        // Si user_id est null, on les inclut (ce sont des employés)
        $employees = Employee::where('annee_id', $yearId)
            ->where(function($query) {
                $query->whereNull('user_id')  // Employés sans user (créés directement)
                    ->orWhereHas('user', function($q) {
                        $q->where('role', 'employee');  // Ceux avec role employee
                    });
            })
            ->get();
        
        $totalEmployees = $employees->count();
        $activeEmployees = $employees->where('statut', 'ACTIF')->count();
        $onLeave = $employees->where('statut', 'CONGE')->count();
        $departed = $employees->where('statut', 'DEPART')->count();
        
        $employeeIds = $employees->pluck('id')->toArray();
        
        // ========== SALARY STATS ==========
        $salaries = EmployeeSalary::whereIn('employee_id', $employeeIds)
            ->where('year', $year)
            ->get();
        
        $totalBrutMensuel = $salaries->sum('brut_salary');
        $employeesWithSalary = $salaries->count();
        $avgSalary = $employeesWithSalary > 0 ? $totalBrutMensuel / $employeesWithSalary : 0;
        
        // ========== LEAVE STATS ==========
        $pendingLeaves = LeaveRequest::whereIn('employee_id', $employeeIds)
            ->where('status', 'PENDING')
            ->count();
            
        $approvedLeaves = LeaveRequest::whereIn('employee_id', $employeeIds)
            ->where('status', 'APPROVED')
            ->count();
            
        $rejectedLeaves = LeaveRequest::whereIn('employee_id', $employeeIds)
            ->where('status', 'REJECTED')
            ->count();
        
        $pendingLeaveRequests = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $employeeIds)
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get()
            ->map(fn($req) => [
                'id' => $req->id,
                'employee_name' => $req->employee?->prenom . ' ' . $req->employee?->nom,
                'leave_type' => $req->leaveType?->name ?? '-',
                'duration' => $req->duration,
                'start_date' => $req->start_date ? Carbon::parse($req->start_date)->format('d/m/Y') : '-',
            ]);
        
        // ========== RECENT EMPLOYEES ==========
        $recentEmployees = Employee::where(function($query) {
                $query->whereNull('user_id')
                    ->orWhereHas('user', function($q) {
                        $q->where('role', 'employee');
                    });
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($emp) => [
                'id' => $emp->id,
                'name' => $emp->prenom . ' ' . $emp->nom,
                'poste' => $emp->post?->name ?? $emp->grade ?? '-',
                'email' => $emp->email,
                'date_embauche' => $emp->date_embauche ? Carbon::parse($emp->date_embauche)->format('d/m/Y') : '-',
            ]);
        
        // ========== TOP SALARIES ==========
        $topSalaries = [];
        foreach ($salaries as $salary) {
            $emp = $employees->firstWhere('id', $salary->employee_id);
            if ($emp && $salary->net_salary > 0) {
                $topSalaries[] = [
                    'id' => $emp->id,
                    'name' => $emp->prenom . ' ' . $emp->nom,
                    'poste' => $emp->post?->name ?? $emp->grade ?? '-',
                    'net_salary' => round($salary->net_salary, 2),
                    'grade' => $emp->grade,
                ];
            }
        }
        usort($topSalaries, fn($a, $b) => $b['net_salary'] <=> $a['net_salary']);
        $topSalaries = array_slice($topSalaries, 0, 5);
        
        // ========== GRADE DISTRIBUTION ==========
        $gradeCounts = [];
        foreach ($employees as $emp) {
            $grade = $emp->grade ?: 'Non spécifié';
            $gradeCounts[$grade] = ($gradeCounts[$grade] ?? 0) + 1;
        }
        $gradeDistribution = [];
        foreach ($gradeCounts as $name => $count) {
            $gradeDistribution[] = ['name' => $name, 'count' => $count];
        }
        
        // ========== STATUS DISTRIBUTION ==========
        $statusDistribution = [
            ['name' => 'Actifs', 'value' => $activeEmployees, 'color' => '#10B981'],
            ['name' => 'En Congé', 'value' => $onLeave, 'color' => '#F59E0B'],
            ['name' => 'Départs', 'value' => $departed, 'color' => '#EF4444'],
        ];
        
        return response()->json([
            'success' => true,
            'data' => [
                'employees' => [
                    'total' => $totalEmployees,
                    'active' => $activeEmployees,
                    'on_leave' => $onLeave,
                    'departed' => $departed,
                    'activity_rate' => $totalEmployees > 0 ? round(($activeEmployees / $totalEmployees) * 100, 1) : 0,
                ],
                'salary' => [
                    'total_brut' => round($totalBrutMensuel, 2),
                    'average_brut' => round($avgSalary, 2),
                    'mass_salariale' => round($totalBrutMensuel, 2),
                ],
                'leaves' => [
                    'pending' => $pendingLeaves,
                    'approved' => $approvedLeaves,
                    'rejected' => $rejectedLeaves,
                    'pending_requests' => $pendingLeaveRequests,
                ],
                'recent_employees' => $recentEmployees,
                'top_salaries' => $topSalaries,
                'grade_distribution' => $gradeDistribution,
                'status_distribution' => $statusDistribution,
                'year' => $year,
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('Dashboard stats error: ' . $e->getMessage());
        return response()->json([
            'success' => false, 
            'error' => $e->getMessage()
        ], 500);
    }
}

  public function getChartData(Request $request)
{
    try {
        $year = $request->query('year', date('Y'));
        $type = $request->query('type', 'salary');
        
        $salaryYear = SalaryYear::where('year', $year)->first();
        $yearId = $salaryYear ? $salaryYear->id : null;
        
        // 🔥 Récupérer les IDs des employés (exclure RH et SuperAdmin)
        $employeeIds = Employee::where('annee_id', $yearId)
            ->where(function($query) {
                $query->whereNull('user_id')
                    ->orWhereHas('user', function($q) {
                        $q->where('role', 'employee');
                    });
            })
            ->pluck('id')
            ->toArray();
        
        if ($type === 'leaves') {
            $monthlyData = [];
            for ($i = 0; $i < 12; $i++) {
                $month = Carbon::create($year, $i + 1, 1);
                $monthlyData[] = [
                    'month' => $month->format('M'),
                    'pending' => LeaveRequest::whereIn('employee_id', $employeeIds)
                        ->whereYear('created_at', $year)
                        ->whereMonth('created_at', $i + 1)
                        ->where('status', 'PENDING')
                        ->count(),
                    'approved' => LeaveRequest::whereIn('employee_id', $employeeIds)
                        ->whereYear('created_at', $year)
                        ->whereMonth('created_at', $i + 1)
                        ->where('status', 'APPROVED')
                        ->count(),
                ];
            }
            return response()->json(['success' => true, 'data' => $monthlyData]);
        }
        
        if ($type === 'hires') {
            $monthlyHires = [];
            for ($i = 0; $i < 12; $i++) {
                $month = Carbon::create($year, $i + 1, 1);
                $monthlyHires[] = [
                    'month' => $month->format('M'),
                    'count' => Employee::whereIn('id', $employeeIds)
                        ->whereYear('created_at', $year)
                        ->whereMonth('created_at', $i + 1)
                        ->count(),
                ];
            }
            return response()->json(['success' => true, 'data' => $monthlyHires]);
        }
        
        // Salary by grade
        $employees = Employee::whereIn('id', $employeeIds)->get();
        $gradeSalaries = [];
        foreach ($employees as $emp) {
            $grade = $emp->grade ?: 'Non spécifié';
            $salary = EmployeeSalary::where('employee_id', $emp->id)->where('year', $year)->first();
            if (!isset($gradeSalaries[$grade])) $gradeSalaries[$grade] = ['count' => 0, 'total' => 0];
            $gradeSalaries[$grade]['count']++;
            $gradeSalaries[$grade]['total'] += $salary ? $salary->brut_salary : 0;
        }
        
        $chartData = [];
        foreach ($gradeSalaries as $grade => $data) {
            $chartData[] = [
                'grade' => $grade,
                'average' => $data['count'] > 0 ? round($data['total'] / $data['count'], 2) : 0,
            ];
        }
        
        return response()->json(['success' => true, 'data' => $chartData]);
        
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
    private function getEmptyStats($year)
    {
        return [
            'employees' => ['total' => 0, 'active' => 0, 'on_leave' => 0, 'departed' => 0, 'activity_rate' => 0],
            'salary' => ['total_brut' => 0, 'average_brut' => 0, 'mass_salariale' => 0],
            'leaves' => ['pending' => 0, 'approved' => 0, 'rejected' => 0, 'pending_requests' => []],
            'recent_employees' => [],
            'top_salaries' => [],
            'grade_distribution' => [],
            'status_distribution' => [
                ['name' => 'Actifs', 'value' => 0, 'color' => '#10B981'],
                ['name' => 'En Congé', 'value' => 0, 'color' => '#F59E0B'],
                ['name' => 'Départs', 'value' => 0, 'color' => '#EF4444'],
            ],
            'year' => $year,
        ];
    }
}