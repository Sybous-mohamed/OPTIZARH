<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class SalaryYear extends Model
{
    protected $fillable = ['year', 'is_active'];

    public function roles() {
       return $this->hasMany(\App\Models\SuperAdmin\Role::class, 'salary_year_id');
    }
}