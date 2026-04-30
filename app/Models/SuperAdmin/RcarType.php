<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class RcarType extends Model
{
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