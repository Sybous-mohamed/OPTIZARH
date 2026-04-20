<?php

namespace App\Models\SuperAdmin;
use Illuminate\Database\Eloquent\Model;

class Gestion_IR extends Model {
    protected $table = 'gestion_IR';
    protected $fillable = ['annee', 'data_rows'];
    protected $casts = [
        'data_rows' => 'array', 
    ];
}

