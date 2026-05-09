<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Assurance extends Model
{
    protected $fillable = [
        'annee_id', 'name', 'code', 'is_active',
        'taux_salarie', 'taux_employeur', 'plafond_mensuel'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'taux_salarie' => 'decimal:2',
        'taux_employeur' => 'decimal:2',
        'plafond_mensuel' => 'decimal:2'
    ];

    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }
}