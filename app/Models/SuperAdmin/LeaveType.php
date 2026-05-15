<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\Employe\LeaveRequest;

class LeaveType extends Model
{
    protected $fillable = [
        'salary_year_id',
        'leave_category_id',
        'name',
        'max_days_per_request',
    ];

    public function salaryYear(){
        return $this->belongsTo(SalaryYear::class);
    }

    public function leaveRequests(){
        return $this->hasMany(LeaveRequest::class, 'leave_type_id');
    }

    public function leaveCategory(){
        return $this->belongsTo(LeaveSetting::class, 'leave_category_id');
    }
}