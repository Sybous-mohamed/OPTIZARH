<?php

namespace App\Models\Employe;

use Illuminate\Database\Eloquent\Model;
use App\Models\SuperAdmin\Employee;
use App\Models\User;
use App\Models\SuperAdmin\LeaveType;

class LeaveRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'salary_year_id',
        'start_date',
        'end_date',
        'duration',
        'comments',
        'status',
        'attachment_path',
        'processed_by',
        'hr_note',
        'processed_at',
    ];
    protected $casts = [
        'processed_at' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(){
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}