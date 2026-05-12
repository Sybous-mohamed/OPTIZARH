<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use App\Traits\RecalculatesSalaries; 

class EmployeeCredit extends Model
{
    use RecalculatesSalaries;
    protected $table = 'employee_credits';
    
    protected $fillable = [
        'employee_id', 'credit_type_id', 'montant_credit', 'taux_credit',
        'credit_duree', 'credit_date_debut', 'credit_date_fin',
        'credit_mensualite', 'credit_reste_a_payer', 'statut',
    ];
    
    protected $casts = [
        'montant_credit' => 'decimal:2',
        'taux_credit' => 'decimal:2',
        'credit_duree' => 'integer',
        'credit_mensualite' => 'decimal:2',
        'credit_reste_a_payer' => 'decimal:2',
        'credit_date_debut' => 'date',
        'credit_date_fin' => 'date',
    ];
    
    public function getIsActifAttribute()
    {
        if (!$this->credit_date_debut || !$this->credit_date_fin) {
            return $this->statut === 'ACTIF';
        }
        
        $today = Carbon::today();
        return $this->statut === 'ACTIF' && $today->between($this->credit_date_debut, $this->credit_date_fin);
    }
    
    public function getPourcentageRembourseAttribute()
    {
        if (!$this->montant_credit || !$this->credit_reste_a_payer || $this->montant_credit <= 0) {
            return 0;
        }
        
        $rembourse = $this->montant_credit - $this->credit_reste_a_payer;
        return round(($rembourse / $this->montant_credit) * 100, 2);
    }
    
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
    
    public function creditType()
    {
        return $this->belongsTo(CreditType::class, 'credit_type_id');
    }
}