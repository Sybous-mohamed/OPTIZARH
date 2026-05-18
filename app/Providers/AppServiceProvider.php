<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use App\Models\Employe\LeaveRequest;
use App\Observers\LeaveRequestObserver;
use Illuminate\Support\Facades\URL;


class AppServiceProvider extends ServiceProvider
{
    public function register(): void{}
    public function boot(): void{
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return 'http://localhost:3000/auth/reset-password/'.$token.'?email='.$notifiable->getEmailForPasswordReset();
        });

        VerifyEmail::createUrlUsing(function (object $notifiable) {
            $verifyUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForPasswordReset())]
            );
            return 'http://localhost:3000/auth/verify-email?url='.urlencode($verifyUrl);
        });

        LeaveRequest::observe(LeaveRequestObserver::class);
    }

}
