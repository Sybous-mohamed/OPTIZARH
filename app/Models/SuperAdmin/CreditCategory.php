<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class CreditCategory extends Model
{
    protected $fillable = ['name', 'code', 'icon', 'color', 'is_active', 'sort_order'];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function types()
    {
        return $this->belongsToMany(CreditType::class, 'credit_type_category', 'credit_category_id', 'credit_type_id');
    }

    public function credits()
    {
        return $this->hasMany(Credit::class, 'category_id');
    }
}