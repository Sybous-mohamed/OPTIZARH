<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class GestionIR extends Model
{
    protected $table = 'gestion_ir';
    
    protected $fillable = ['annee', 'data_rows'];
    
    protected $casts = [
        'data_rows' => 'array',
    ];
}