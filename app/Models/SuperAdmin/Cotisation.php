<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Traits\RecalculatesSalaries; 
class Cotisation extends Model
{
    use RecalculatesSalaries;
    protected $table = 'cotisations';
    protected $fillable = ['organisme_id', 'type', 'name', 'taux', 'plafond'];

    public function organisme()
    {
        return $this->belongsTo(Organisme::class);
    }
}