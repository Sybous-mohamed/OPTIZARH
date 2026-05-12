<?php
namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
<<<<<<< HEAD
    use HasApiTokens, HasFactory, Notifiable; //
=======
    use HasApiTokens, HasFactory, Notifiable; 
>>>>>>> bouray/main

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
// app/Models/User.php
    protected $fillable = [
        'full_name',
        'email',
        'password',
        'company_name',
        'sector',
        'employee_count',
        'role',
<<<<<<< HEAD
        'profile_image',
        'theme',
        'must_change_password',
=======
        'must_change_password', 
        'profile_image',
        'theme',
>>>>>>> bouray/main
        'language',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function employee(){
    return $this->hasOne(\App\Models\SuperAdmin\Employee::class, 'user_id');
}
}