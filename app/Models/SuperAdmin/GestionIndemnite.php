<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class GestionIndemnite extends Model
{
    protected $table = 'gestion_indemnites';

    protected $fillable = [
        'libelle', 
        'type', 
        'valeur', 
        'salary_year_id', 
        'role_id', 
        'grade_id', 
        'echelle_id', 
        'echelon_id',
        'is_for_all'
    ];

    public function salaryYear() {
        return $this->belongsTo(SalaryYear::class, 'salary_year_id');
    }

    public function role() {
        return $this->belongsTo(Role::class);
    }

    public function grade() {
        return $this->belongsTo(Grade::class);
    }

    public function echelle() {
        return $this->belongsTo(Echelle::class);
    }

    public function echelon() {
        return $this->belongsTo(Echelon::class);
    }
}