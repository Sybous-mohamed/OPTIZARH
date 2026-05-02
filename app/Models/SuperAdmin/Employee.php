<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'prenom', 'nom', 'email', 'telephone', 'date_naissance', 'adresse',
        'situation_familiale', 'nombre_enfants', 'departement', 'date_embauche', 'poste', 'type_contrat',
        'annee_id', 'role_id', 'grade_id', 'echelle_id', 'echelon_id',
        'grade', 'echelle', 'echelon', 'salaire', 'indice', 'statut',
        'cotisation_type', 'cotisation_id', 'cotisation_rubrique_id', 'cotisation_label', 'cotisation_taux',
        'rcar_type_id', 'rcar_type_label', 'rcar_taux'
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_embauche' => 'date',
        'salaire' => 'decimal:2',
        'indice' => 'decimal:2',
        'cotisation_taux' => 'decimal:2',
        'rcar_taux' => 'decimal:2',
        'nombre_enfants' => 'integer'
    ];

    public function getFullNameAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function echelle()
    {
        return $this->belongsTo(Echelle::class, 'echelle_id');
    }

    public function echelon()
    {
        return $this->belongsTo(Echelon::class, 'echelon_id');
    }
    
    public function rcarType()
    {
        return $this->belongsTo(RcarType::class, 'rcar_type_id');
    }

    public function scopeActif($query)
    {
        return $query->where('statut', 'ACTIF');
    }
    
    public function scopeByAnnee($query, $anneeId)
    {
        return $query->where('annee_id', $anneeId);
    }
}