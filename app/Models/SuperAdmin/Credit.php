<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Credit extends Model
{
    use HasFactory;


    protected $fillable = [
        'name',
        'type',
        'category',
        'max_amount',
        'interest_rate',
        'max_duration',
        'status', 
    ];

    public function getFormattedAmountAttribute()
    {
        return number_format($this->max_amount, 2, ',', ' ') . ' DH';
    }
}