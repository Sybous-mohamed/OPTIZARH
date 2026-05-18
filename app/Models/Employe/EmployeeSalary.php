<?php

namespace App\Models\Employe;

use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Database\Eloquent\Model;

class EmployeeSalary extends Model
{
    protected $table = 'employee_salaries';
    
    protected $fillable = [
        'employee_id', 'annee_id', 'year', 'month',
        'base_salary', 'indemnites_total', 'brut_salary', 'net_salary',
        'cotisations_total', 'rcar_total', 'ir_total', 'sntl_total',
        'assurances_salarie', 'credits_total', 'total_deductions',
        'indemnites_details', 'cotisations_details', 'rcar_details',
        'sntl_details', 'assurances_details', 'credits_details','ir_taux', 
    ];
    
    protected $casts = [
        'indemnites_details' => 'array',
        'cotisations_details' => 'array',
        'rcar_details' => 'array',
        'sntl_details' => 'array',
        'assurances_details' => 'array',
        'credits_details' => 'array',
        'ir_taux' => 'decimal:2',
    ];
    
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
    
    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }
}