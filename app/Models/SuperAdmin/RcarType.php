<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Traits\RecalculatesSalaries; 

class RcarType extends Model
{
    use RecalculatesSalaries;
    protected $table = 'rcar_types';

    protected $fillable = ['salary_year_id', 'label', 'is_favorite'];

    protected $casts = [
        'is_favorite' => 'boolean',
    ];
    //
    public function details() {
        return $this->hasMany(RcarDetail::class);
    }
}