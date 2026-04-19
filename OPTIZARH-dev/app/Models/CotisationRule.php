<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CotisationRule extends Model
{
    protected $fillable = [
        'organisme_id', 
        'year', 
        'taux', 
        'plafond', 
        'mgpap', 
        'omfam', 
        'derniere_maj'
    ];

    protected $casts = [
        'mgpap' => 'boolean',
        'omfam' => 'boolean',
        'taux' => 'float',
        'plafond' => 'float',
        'derniere_maj' => 'date',
    ];

    public function organisme(): BelongsTo
    {
        return $this->belongsTo(Organisme::class);
    }
}