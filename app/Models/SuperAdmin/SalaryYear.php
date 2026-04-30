<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SalaryYear extends Model
{
    
    protected $fillable = ['year', 'is_active'];

    public function roles() {
        return $this->hasMany(Role::class, 'salary_year_id');
    }

    public function starredRoles() {
        return $this->hasMany(Role::class, 'salary_year_id')->where('is_starred', true);
    }
    
    public function getRolesOrderedAttribute() {
        return $this->roles()->orderBy('name')->get();
    }
    public function indemnites() {
        return $this->hasMany(GestionIndemnite::class, 'salary_year_id');
    }
     public function rcarTypes() {
        return $this->hasMany(RcarType::class, 'salary_year_id');
    }

    protected static function booted(){
        static::saved(function () {
            Cache::forget('salary_years');
        });
        
        static::deleted(function () {
            Cache::forget('salary_years');
        });
    }
}