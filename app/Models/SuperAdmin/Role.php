<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['salary_year_id', 'name', 'is_starred']; // 7it "is_starred" mzyan

    public function salaryYear() {
        return $this->belongsTo(SalaryYear::class);
    }

    public function grades() {
        return $this->hasMany(Grade::class);
    }

    // Zid scope bach tjib les rôles étoilés facilement
    public function scopeStarred($query) {
        return $query->where('is_starred', true);
    }

    // Zid accessor bach t-checki ila kan étoilé
    public function getIsStarredAttribute($value) {
        return (bool) $value;
    }
}