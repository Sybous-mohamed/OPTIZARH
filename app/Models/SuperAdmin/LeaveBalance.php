<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Models\Employee;
use App\Models\SuperAdmin\SalaryYear;

class LeaveBalance extends Model
{
    protected $fillable = [
        'employee_id',
        'salary_year_id',
        'days_used',
    ];

    public function employee(){
        return $this->belongsTo(Employee::class);
    }

    public function salaryYear(){
        return $this->belongsTo(SalaryYear::class);
    }
}