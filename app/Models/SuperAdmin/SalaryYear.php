<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SalaryYear extends Model
{
    protected $table = 'salary_years';
    protected $fillable = ['year', 'is_active'];

    public function Post() {
        return $this->hasMany(Post::class, 'salary_year_id');
    }

    public function starredPost() {
        return $this->hasMany(Post::class, 'salary_year_id')->where('is_starred', true);
    }
    
    public function getPostOrderedAttribute() {
        return $this->Post()->orderBy('name')->get();
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

    public function categories() {
        return $this->hasMany(LeaveSetting::class, 'salary_year_id');
    }
}