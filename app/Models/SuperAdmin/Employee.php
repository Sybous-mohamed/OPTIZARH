<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $table = 'employees';
    
    protected $fillable = [
        'prenom', 'nom', 'email', 'telephone', 'date_naissance','user_id',
        'situation_familiale', 'nombre_enfants', 'date_embauche',
        'annee_id', 'Post_id', 'grade_id', 'echelle_id', 'echelon_id',
        'grade', 'echelle', 'echelon', 'salaire', 'indice', 'statut',
        'cotisation_type', 'cotisation_id', 'cotisation_rubrique_id', 
        'cotisation_label', 'cotisation_taux',
        'rcar_type_id', 'rcar_type_label', 'rcar_taux', 
        'credit_type_id', 'montant_credit', 'taux_credit',
        'credit_duree', 'credit_date_debut', 'credit_date_fin', 
        'credit_mensualite', 'credit_reste_a_payer'
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

    protected $appends = ['poste_name', 'grade_name', 'echelle_name', 'echelon_name', 'statut_display', 'full_name'];

    public function getPosteNameAttribute()
    {
        return $this->post ? $this->post->name : null;
    }

    public function getGradeNameAttribute()
    {
        return $this->gradeRel ? $this->gradeRel->name : $this->grade;
    }

    public function getEchelleNameAttribute()
    {
        return $this->echelleRel ? 'Echelle ' . $this->echelleRel->level : $this->echelle;
    }

    public function getEchelonNameAttribute()
    {
        return $this->echelonRel ? 'Ech. ' . $this->echelonRel->order : $this->echelon;
    }

    public function getStatutDisplayAttribute()
    {
        switch ($this->statut) {
            case 'CONGE': return 'CONGÉ';
            case 'DEPART': return 'DÉPART';
            default: return $this->statut;
        }
    }

    public function getFullNameAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    //  Relations
    public function annee()
    {
        return $this->belongsTo(SalaryYear::class, 'annee_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class, 'Post_id');
    }

    public function gradeRel()
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function echelleRel()
    {
        return $this->belongsTo(Echelle::class, 'echelle_id');
    }

    public function echelonRel()
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

    public function creditsActifs()
    {
        return $this->hasMany(EmployeeCredit::class, 'employee_id')->where('statut', 'ACTIF');
    }

    public function getTotalMensualitesCreditsAttribute()
    {
        return $this->creditsActifs->sum('credit_mensualite');
    }

    public function creditType()
    {
        return $this->belongsTo(CreditType::class, 'credit_type_id');
    }

    //  Scopes
    public function scopeActif($query)
    {
        return $query->where('statut', 'ACTIF');
    }
    
    public function scopeByAnnee($query, $anneeId)
    {
        return $query->where('annee_id', $anneeId);
    }
}