<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Echelon extends Model
{
    protected $fillable = ['echelle_id', 'order', 'index_val', 'salary'];

    public function echelle() {
        return $this->belongsTo(Echelle::class);
    }

    public function getFormattedSalaryAttribute() {
        return number_format($this->salary, 0, ',', ' ') . ' MAD';
    }
}