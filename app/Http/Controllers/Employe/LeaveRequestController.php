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
        try {
            $leaveType = LeaveType::findOrFail($request->leave_type_id);
            $isCertificate = ($leaveType->max_days_per_request == 0);
            
            $rules = [
                'leave_type_id' => 'required|exists:leave_types,id',
                'salary_year_id' => 'required|exists:salary_years,id',
                'comments' => 'nullable|string',
                'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            ];
            
            if (!$isCertificate) {
                $rules['start_date'] = 'required|date|after_or_equal:today';
                $rules['end_date'] = 'required|date|after_or_equal:start_date';
                $rules['duration'] = 'required|integer|min:1';
            } else {
                $rules['duration'] = 'required|integer|min:0';
                $rules['start_date'] = 'nullable|date';
                $rules['end_date'] = 'nullable|date';
            }
            
            $validated = $request->validate($rules);

            $employeeId = auth()->user()->employee->id;
            
            if (!$employeeId) {
                return response()->json(['error' => 'Profil employé non trouvé'], 400);
            }
            
            $setting = LeaveSetting::where('salary_year_id', $request->salary_year_id)->first();

            if (!$setting) {
                return response()->json(['error' => 'Configuration des congés non trouvée pour cette année'], 400);
            }

            if (!$isCertificate && $request->duration > 0) {
                if ($request->duration > $leaveType->max_days_per_request) {
                    return response()->json([
                        'error' => "Ce type de congé ne peut pas dépasser {$leaveType->max_days_per_request} jours."
                    ], 422);
                }

                $balance = LeaveBalance::firstOrCreate(
                    ['employee_id' => $employeeId, 'salary_year_id' => $request->salary_year_id],
                    ['days_used' => 0]
                );

                $remainingDays = $setting->annual_global_max - $balance->days_used;
                
                if (($balance->days_used + $request->duration) > $setting->annual_global_max) {
                    return response()->json([
                        'error' => "Quota dépassé! Il vous reste {$remainingDays} jours."
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
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // PARTIE 2: RH (Approve & Reject)
    // ==========================================

public function allRequests()
{
    $requests = LeaveRequest::with(['employee', 'leaveType.category'])->orderBy('created_at', 'desc')->get();
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

        $leaveRequest->update([
            'status' => $request->status,
            'hr_note' => $request->hr_note,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        if ($request->status === 'APPROVED') {
            $salaryYearId = $leaveRequest->salary_year_id;

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
                    ['days_used' => $leaveRequest->duration
                ]
            );
        }
        return response()->json(['message' => "Demande {$request->status} avec succès!"]);
    }

    public function getLeaveStats() {
        $user = auth()->user();
        $employee = $user->employee;
        $today = now()->startOfDay();


        $currentYear = SalaryYear::where('year', now()->year)->first() 
                ?? SalaryYear::where('status', 'ACTIVE')->first() 
                ?? SalaryYear::latest()->first();


    // LOG 1: Check Year
        Log::info("Current Salary Year found: " . ($currentYear ? $currentYear->year : 'NONE'));

        if (!$currentYear) {
            return response()->json(['error' => 'Aucune année de salaire trouvée'], 404);
        }


        $globalSettings = LeaveSetting::where('salary_year_id', $currentYear->id)
                            ->where('category_name', 'conge')->first()
                            ->first();

                                // LOG 2: Check Setting
        Log::info("Global Leave Setting for Year ID {$currentYear->id}: " . ($globalSettings ? $globalSettings->annual_global_max : 'NOT FOUND'));

        $balance = LeaveBalance::where('employee_id', $employee->id)
                    ->where('salary_year_id', $currentYear->id)
                    ->first();
        Log::info("Leave Balance for Employee {$employee->id}: " . ($balance ? $balance->days_used : '0 (No balance record)'));
        $max = $globalSettings ? (int)$globalSettings->annual_global_max : 0;
        $used = $balance ? (int)$balance->days_used : 0;

        
        $lastApproved = LeaveRequest::where('employee_id', $employee->id)
                        ->where('status', 'APPROVED')
                        ->with('leaveType.leaveCategory')
                        ->latest()->first();

        return response()->json([
            'global' => [
                'label' => 'Total Annuel ' . $currentYear->year,
                'total' => $totalGlobal,
                'used' => $usedGlobal,
                'remaining' => max(0, $totalGlobal - $usedGlobal),
                'percentage' => $totalGlobal > 0 ? ($usedGlobal / $totalGlobal) * 100 : 0
            ],
            'last_request' => $lastApproved ? [
                'type' => $lastApproved->leaveType->name,
                'duration' => $lastApproved->duration,
                'date' => $lastApproved->start_date
            ] : null
        ]);
    }
}