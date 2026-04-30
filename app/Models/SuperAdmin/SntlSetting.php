<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class SntlSetting extends Model
{
    
    protected $fillable = [
        'label', 'salary_year_id', 'valeur', 'type_montant', 
        'categorie_cible', 'grade_id', 'echelle_id', 'echelon_id', 'is_active'
    ];
}