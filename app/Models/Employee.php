<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    //
    protected $fillable = [
        'prenom',
        'nom',
        'email' => 'required|email|unique:employees',
        'telephone',
        'date_naissance',
        'adresse',
        'situation_familiale',
        'departement',
        'date_embauche',
        'poste',
        'type_contrat',
        'grade',
        'echelle',
        'echelon',
        'statut'
    ];

}