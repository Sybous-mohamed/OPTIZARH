<?php
namespace App\Models\SuperAdmin;
use Illuminate\Database\Eloquent\Model;

class ParametrageRCAR extends Model {
    protected $table = 'parametrage_rcars';
    
    protected $fillable = [
        'annee', 'salariale_active', 'salariale_rg_taux', 'salariale_rc_taux',
        'salariale_rg_plafond', 'salariale_rc_plafond', 'patronale_active',
        'patronale_rg_taux', 'patronale_rc_taux', 'patronale_rg_plafond',
        'patronale_rc_plafond'
    ];
    protected $casts = [
        'salariale_active' => 'boolean',
        'patronale_active' => 'boolean',
        'salariale_rg_taux' => 'float',
        'salariale_rc_taux' => 'float',
        'patronale_rg_taux' => 'float',
        'patronale_rc_taux' => 'float',
        'salariale_rg_plafond' => 'float',
        'salariale_rc_plafond' => 'float',
        'patronale_rg_plafond' => 'float',
        'patronale_rc_plafond' => 'float',
    ];
}