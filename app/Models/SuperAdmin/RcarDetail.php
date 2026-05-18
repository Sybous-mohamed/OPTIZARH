<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Traits\RecalculatesSalaries; 

class RcarDetail extends Model
{
    use RecalculatesSalaries;
    protected $table = 'rcar_details';

    protected $fillable = ['rcar_type_id', 'designation', 'type', 'plafond', 'percentage'];
    
}