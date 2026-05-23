<?php

namespace App\Http\Controllers\Employe;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employe\LeaveRequest;
use App\Models\SuperAdmin\LeaveSetting;
use App\Models\SuperAdmin\LeaveType;
use App\Models\SuperAdmin\LeaveBalance;
use App\Models\SuperAdmin\SalaryYear;
use Carbon\Carbon;
use SebastianBergmann\Environment\Console;
use Illuminate\Support\Facades\Log;
class LeaveRequestController extends Controller
{
    // ==========================================
    // PARTIE 1: EMPLOYEE (Submit & History)
    // ==========================================
    public function myRequests(Request $request){
        $user = auth()->user();

        if (!$user->employee) {
            return response()->json([
                'error' => 'Had l-compte ma-m-rtabetch b-ay employee. Khass t-creer profil employee l had l-user f l-lowel.'
            ], 404);
        }

        $employeeId = $user->employee->id; 
        
        $requests = LeaveRequest::with('leaveType')
                        ->where('employee_id', $employeeId)
                        ->orderBy('created_at', 'desc')
                        ->get();

        return response()->json($requests);
    }

    public function store(Request $request){
        $leaveType = LeaveType::findOrFail($request->leave_type_id);
        $isCertificate = ($leaveType->max_days_per_request == 0);
        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'salary_year_id' => 'required|exists:salary_years,id',
            'start_date' => $isCertificate ? 'nullable|date' : 'required|date',
            'end_date' => $isCertificate ? 'nullable|date' : 'required|date|after_or_equal:start_date',
            // duration t-9der t-kon 0 f l-certificate
            'duration' => $isCertificate ? 'required|integer|min:0' : 'required|integer|min:1',
            'comments' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $employeeId = auth()->user()->employee->id;
        $setting = LeaveSetting::where('salary_year_id', $request->salary_year_id)->first();

        if (!$setting) {
            return response()->json(['error' => 'Super Admin mazal ma-configurach had l-3am.'], 400);
        }

        // 3. Check l-quota ghir ila kan congé (duration > 0)
        if (!$isCertificate) {
            if ($request->duration > $leaveType->max_days_per_request) {
                return response()->json([
                    'error' => "Had l-nou3 dyal l-congé ma-i9derch ifout {$leaveType->max_days_per_request} jours."
                ], 422);
            }

            $balance = LeaveBalance::firstOrCreate(
                ['employee_id' => $employeeId, 'salary_year_id' => $request->salary_year_id]
            );

            if (($balance->days_used + $request->duration) > $setting->annual_global_max) {
                $left = $setting->annual_global_max - $balance->days_used;
                return response()->json([
                    'error' => "Quota dépassé! Bqaw lik ghir {$left} jours."
                ], 422);
            }
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employeeId,
            'leave_type_id' => $request->leave_type_id,
            'salary_year_id' => $request->salary_year_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'duration' => $request->duration,
            'comments' => $request->comments,
            'status' => 'PENDING',
            'attachment_path' => $attachmentPath,
        ]);

        return response()->json(['message' => 'Demande envoyée avec succès!', 'data' => $leaveRequest], 201);
    }

    // ==========================================
    // PARTIE 2: RH (Approve & Reject)
    // ==========================================

    public function allRequests()
    {
        $requests = LeaveRequest::with(['employee', 'leaveType'])->orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

public function updateStatus(Request $request, $id){
    $request->validate([
        'status' => 'required|in:APPROVED,REJECTED',
        'hr_note' => 'nullable|string',
    ]);

    $leaveRequest = LeaveRequest::with('leaveType')->findOrFail($id);

    if ($leaveRequest->status !== 'PENDING') {
        return response()->json(['error' => 'Had l-demande deja traitée!'], 400);
    }

    // 1. Update status dyal l-commande
    $leaveRequest->update([
        'status' => $request->status,
        'hr_note' => $request->hr_note,
        'processed_by' => auth()->id(),
        'processed_at' => now(),
    ]);

    // 2. Recalculer l-Balance
    if ($request->status === 'APPROVED') {
        // HNA L-ISLAH: njibou ID dyal l-3am nichan mn l-commande
        $salaryYearId = $leaveRequest->salary_year_id;

        // Njebdo l-majmou3 dyal ga3 l-commandes li APPROVED f had l-3am l-had l-user
        $totalApprovedDays = LeaveRequest::where('employee_id', $leaveRequest->employee_id)
            ->where('salary_year_id', $salaryYearId) // HNA L-ISLAH HTA HWA
            ->where('status', 'APPROVED')
            ->sum('duration');

        // Update-iw l-balance b l-valeur s-hiha
        LeaveBalance::updateOrCreate(
            [
                'employee_id' => $leaveRequest->employee_id,
                'salary_year_id' => $salaryYearId
            ],
            [
                'days_used' => $totalApprovedDays
            ]
        );
    }

    return response()->json(['message' => "Demande {$request->status} avec succès!"]);
}

public function getLeaveStats() {
    $user = auth()->user();
    $employee = $user->employee;
    $today = now()->startOfDay();

    // 1. Njebdo l-annee active
    $currentYear = SalaryYear::where('status', 'ACTIVE')->first() 
                ?? SalaryYear::where('year', now()->year)->first()
                ?? SalaryYear::latest()->first();

    // LOG 1: Check Year
    Log::info("Current Salary Year found: " . ($currentYear ? $currentYear->year : 'NONE'));

    if (!$currentYear) {
        return response()->json(['error' => 'Aucune année de salaire trouvée'], 404);
    }

    // 2. Njebdo Settings (annual_global_max)
    // RED L-BAL: t-akked bli 'ANNUEL' mktouba hakka b-dabt f l-DB
    $globalSettings = LeaveSetting::where('salary_year_id', $currentYear->id)
                        ->where('category_name', 'conge')
                        ->first();

    // LOG 2: Check Setting
    Log::info("Global Leave Setting for Year ID {$currentYear->id}: " . ($globalSettings ? $globalSettings->annual_global_max : 'NOT FOUND'));

    // 3. Njebdo Balance (days_used)
    $balance = LeaveBalance::where('employee_id', $employee->id)
                ->where('salary_year_id', $currentYear->id)
                ->first();

    // LOG 3: Check Balance
    Log::info("Leave Balance for Employee {$employee->id}: " . ($balance ? $balance->days_used : '0 (No balance record)'));

    $max = $globalSettings ? (int)$globalSettings->annual_global_max : 0;
    $used = $balance ? (int)$balance->days_used : 0;

    // Hsab dyalk
    $dureeConsomee = max(0, $max - $used); 
    $dureeTotale = max(0, $max - $dureeConsomee);

    // 4. Active Leave
    $activeLeave = LeaveRequest::where('employee_id', $employee->id)
                    ->where('status', 'APPROVED')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today)
                    ->with('leaveType')
                    ->first();

    $activeData = null;
    if ($activeLeave) {
        $start = Carbon::parse($activeLeave->start_date);
        $daysPassed = $start->diffInDays($today) + 1;
        $activeData = [
            'type' => $activeLeave->leaveType->name ?? 'Congé',
            'duration' => $activeLeave->duration,
            'days_passed' => $daysPassed,
            'start_date' => $start->format('d/m/Y'),
            'end_date' => Carbon::parse($activeLeave->end_date)->format('d/m/Y'),
        ];
    }

    return response()->json([
        'annual' => [
            'duree_consomee' => $dureeConsomee, 
            'duree_totale'   => $dureeTotale,   
            'real_max'       => $max,           
        ],
        'active_leave' => $activeData,
        'next_leave' => !$activeData ? $this->getNextLeave($employee->id, $today) : null
    ]);
}

private function getNextLeave($empId, $today) {
    $next = LeaveRequest::where('employee_id', $empId)
            ->where('status', 'APPROVED')
            ->where('start_date', '>', $today)
            ->with('leaveType')
            ->orderBy('start_date', 'asc')
            ->first();

    if (!$next) return null;

    return [
        'type' => $next->leaveType->name ?? 'Congé',
        'duration' => $next->duration,
        'start_date' => Carbon::parse($next->start_date)->format('d/m/Y'),
        'days_remaining' => now()->startOfDay()->diffInDays(Carbon::parse($next->start_date))
    ];
}
}