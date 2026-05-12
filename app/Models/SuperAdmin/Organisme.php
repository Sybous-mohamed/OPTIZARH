<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Traits\RecalculatesSalaries; 
class Organisme extends Model
{
    use RecalculatesSalaries;
    protected $table = 'organisme';
    protected $fillable = ['nom', 'annee', 'is_favorite'];

    // L'organisme possède plusieurs cotisations
    public function cotisations()
    {
        return $this->hasMany(Cotisation::class, 'organisme_id');
    }
}