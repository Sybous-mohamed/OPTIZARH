<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Indemnite extends Model
{
    protected $fillable = [
    'nom', 'type', 'valeur', 'annee', 'tous_employes', 'grade', 'echelle', 'echelon', 'statut'
    ];
}