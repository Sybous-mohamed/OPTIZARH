<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Retraite extends Model{
    protected $table = 'retraites';
    protected $fillable = [
        'age_legal_retraite', 
        'notification_retraite', 
        'duree_prolongation_max', 
        'nb_prolongations_max', 
        'desactiver_rcar', 
        'maintenir_autres_cotisations'
    ];
}