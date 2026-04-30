<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class AssuranceTranche extends Model
{
    protected $fillable = [
        'assurance_id', 'tranche_name', 'min_salaire', 'max_salaire',
        'taux_salarie', 'taux_employeur', 'plafond'
    ];

    protected $casts = [
        'min_salaire' => 'decimal:2',
        'max_salaire' => 'decimal:2',
        'taux_salarie' => 'decimal:2',
        'taux_employeur' => 'decimal:2',
        'plafond' => 'decimal:2'
    ];

    public function assurance()
    {
        return $this->belongsTo(Assurance::class);
    }
}