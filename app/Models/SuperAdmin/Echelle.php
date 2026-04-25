<?php
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Echelle extends Model
{
    protected $fillable = ['grade_id', 'level'];

    public function grade() {
        return $this->belongsTo(Grade::class);
    }

    public function echelons() {
        return $this->hasMany(Echelon::class);
    }
}