<?php
namespace App\Observers;

use App\Models\Employe\LeaveRequest;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\LeaveBalance;

class LeaveRequestObserver
{
    public function updated(LeaveRequest $leaveRequest)
{
    if ($leaveRequest->isDirty('status') && $leaveRequest->status === 'APPROVED') {
        
        // 1. Statut Employé
        $leaveRequest->employee->update(['statut' => 'CONGE']);

        // 2. Mise à jour du Solde (Balance)
        $balance = LeaveBalance::firstOrCreate(
            [
                'employee_id' => $leaveRequest->employee_id,
                'salary_year_id' => $leaveRequest->salary_year_id,
            ],
            ['days_used' => 0]
        );

        $balance->increment('days_used', $leaveRequest->duration);
    }
}

    
}