<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class RetraiteSetting extends Model
{
    
    protected $fillable = ['year', 'age_legal', 'duree_max', 'nb_fois'];
}
