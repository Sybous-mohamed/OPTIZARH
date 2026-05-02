<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class CreditType extends Model
{
    protected $fillable = ['name', 'code', 'icon', 'color', 'is_active', 'sort_order'];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function categories()
    {
        return $this->belongsToMany(CreditCategory::class, 'credit_type_category', 'credit_type_id', 'credit_category_id');
    }

    public function credits()
    {
        return $this->hasMany(Credit::class, 'type_id');
    }
}