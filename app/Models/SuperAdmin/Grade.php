<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = ['role_id', 'name'];

    public function role() {
        return $this->belongsTo(Role::class);
    }

    public function echelles() {
        return $this->hasMany(Echelle::class);
    }
}