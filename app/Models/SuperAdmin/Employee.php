<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'prenom', 'nom', 'email', 'telephone', 'date_naissance', 'adresse','user_id',
        'situation_familiale', 'nombre_enfants', 'departement', 'date_embauche', 'poste', 'type_contrat',
        'annee_id', 'role_id', 'grade_id', 'echelle_id', 'echelon_id',
        'grade', 'echelle', 'echelon', 'salaire', 'indice', 'statut',
        'cotisation_type', 'cotisation_id', 'cotisation_rubrique_id', 'cotisation_label', 'cotisation_taux',
        'rcar_type_id', 'rcar_type_label', 'rcar_taux', 
        'credit_type_id', 'montant_credit', 'taux_credit',
        'credit_duree', 'credit_date_debut', 'credit_date_fin', 'credit_mensualite', 'credit_reste_a_payer'
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_embauche' => 'date',
        'salaire' => 'decimal:2',
        'indice' => 'decimal:2',
        'cotisation_taux' => 'decimal:2',
        'rcar_taux' => 'decimal:2',
        'nombre_enfants' => 'integer',
        'montant_credit' => 'decimal:2',
        'taux_credit' => 'decimal:2',
        'credit_duree' => 'integer',
        'credit_date_debut' => 'date',
        'credit_date_fin' => 'date',
        'credit_mensualite' => 'decimal:2',
        'credit_reste_a_payer' => 'decimal:2',
    ];

    public function getFullNameAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class, 'Post_id');
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


public function credits()
{
    return $this->hasMany(EmployeeCredit::class, 'employee_id');
}

// ⭐ Les crédits actifs seulement
public function creditsActifs()
{
    return $this->hasMany(EmployeeCredit::class, 'employee_id')->where('statut', 'ACTIF');
}

// ⭐ Calculer le total des mensualités
public function getTotalMensualitesCreditsAttribute()
{
    return $this->creditsActifs->sum('credit_mensualite');
}


    public function creditType()
    {
        return $this->belongsTo(CreditType::class, 'credit_type_id');
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