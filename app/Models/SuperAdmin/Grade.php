<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = ['Post_id', 'name'];

    public function Post() {
        return $this->belongsTo(Post::class);
    }

    public function echelles() {
        return $this->hasMany(Echelle::class);
    }
}