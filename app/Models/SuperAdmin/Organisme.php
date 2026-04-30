<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Organisme extends Model
{
    protected $table = 'organisme';
    protected $fillable = ['nom', 'annee', 'is_favorite'];

    // L'organisme possède plusieurs cotisations
    public function cotisations()
    {
        return $this->hasMany(Cotisation::class, 'organisme_id');
    }
}