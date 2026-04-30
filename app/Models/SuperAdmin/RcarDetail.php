<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class RcarDetail extends Model
{
    protected $table = 'rcar_details';

    protected $fillable = ['rcar_type_id', 'designation', 'plafond', 'percentage'];
    //
}

