<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;
use App\Models\SuperAdmin\Employee;
class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'titre', 'action_type', 'description', 'annee'];
    public function user() {
        return $this->belongsTo(User::class);
    }
}