<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class CreditType extends Model
{
    protected $fillable = ['name', 'code', 'is_active', 'sort_order'];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function credits()
    {
        return $this->hasMany(EmployeeCredit::class, 'credit_type_id');
    }
}