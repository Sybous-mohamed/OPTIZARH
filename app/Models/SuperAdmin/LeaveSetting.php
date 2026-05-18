<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Models\SuperAdmin\SalaryYear;

class LeaveSetting extends Model
{
    protected $table = 'leave_settings';
    protected $fillable = [
        'salary_year_id',
        'category_name',
        'annual_global_max',
    ];

    public function salaryYear(){
        return $this->belongsTo(SalaryYear::class);
    }

    public function types(){
        return $this->hasMany(LeaveType::class, 'leave_category_id');
    }
}