<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Assurance extends Model
{
    protected $fillable = [
        'annee_id', 'name', 'code', 'type', 'is_active', 'is_obligatoire',
        'taux_salarie', 'taux_employeur', 'plafond_mensuel', 'plafond_annuel',
        'description', 'bareme'
    ];

    protected $casts = [
        'bareme' => 'array',
        'is_active' => 'boolean',
        'is_obligatoire' => 'boolean',
        'taux_salarie' => 'decimal:2',
        'taux_employeur' => 'decimal:2',
        'plafond_mensuel' => 'decimal:2',
        'plafond_annuel' => 'decimal:2'
    ];

    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }

    public function tranches()
    {
        return $this->hasMany(AssuranceTranche::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}