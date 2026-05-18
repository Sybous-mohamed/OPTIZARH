<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Traits\RecalculatesSalaries; 
class GestionIR extends Model
{
    use RecalculatesSalaries;
    protected $table = 'gestion_ir';
    
    protected $fillable = ['annee', 'data_rows'];
    
    protected $casts = [
        'data_rows' => 'array',
    ];
}