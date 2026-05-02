<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Credit extends Model
{
    protected $fillable = [
        'name', 'type_id', 'category_id', 'max_amount', 
        'interest_rate', 'max_duration', 'status', 'description', 'year'
    ];

    protected $casts = [
        'max_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'max_duration' => 'integer',
        'year' => 'integer'
    ];

    public function type()
    {
        return $this->belongsTo(CreditType::class, 'type_id');
    }

    public function category()
    {
        return $this->belongsTo(CreditCategory::class, 'category_id');
    }

    // Scope pour filtrer par année
    public function scopeForYear($query, $year)
    {
        return $query->where('year', $year);
    }
}