<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organisme extends Model
{
    protected $fillable = ['nom', 'type', 'rattachement'];
    public function rules(): HasMany
    {
        return $this->hasMany(CotisationRule::class);
    }
}