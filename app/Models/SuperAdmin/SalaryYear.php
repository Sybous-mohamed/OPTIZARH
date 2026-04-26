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

    // Zid had function jdida
    public function starredRoles() {
        return $this->hasMany(Role::class, 'salary_year_id')->where('is_starred', true);
    }

    // Zid accessor bach tji les roles triés
    public function getRolesOrderedAttribute() {
        return $this->roles()->orderBy('name')->get();
    }

    // Zid function bach tinvalider cache mli tbeddel
    protected static function booted()
    {
        static::saved(function () {
            Cache::forget('salary_years');
        });
        
        static::deleted(function () {
            Cache::forget('salary_years');
        });
    }
}