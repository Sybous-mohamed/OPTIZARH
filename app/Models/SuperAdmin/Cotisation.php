<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Cotisation extends Model
{
    protected $table = 'cotisations';
    protected $fillable = ['organisme_id', 'type', 'name', 'taux', 'plafond'];

    // Chaque cotisation appartient à un organisme
    public function organisme()
    {
        return $this->belongsTo(Organisme::class);
    }
}