<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\SuperAdmin\RCARController;
use App\Http\Controllers\SuperAdmin\EmployeeController;
use App\Http\Controllers\SuperAdmin\IndemniteController;
use App\Http\Controllers\SuperAdmin\ActivityLogController;
use App\Http\Controllers\SuperAdmin\RetraiteController;
use App\Http\Controllers\SuperAdmin\CotisationController;
use App\Http\Controllers\SuperAdmin\IrController;

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\VerifyEmailController;

/*
|--------------------------------------------------------------------------
| Public Routes (Guest)
|--------------------------------------------------------------------------
*/
Route::get('/check-setup', [SuperAdminController::class, 'checkStatus']);
Route::post('/setup-superadmin', [SuperAdminController::class, 'setup']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');

Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

/*
|--------------------------------------------------------------------------
| Protected Routes (Auth:Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Account & Status
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/auth/user-status', [AuthController::class, 'userStatus']);

    // Verification Notification
    Route::post('/email/verification-notification', [AuthController::class, 'sendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');

    Route::middleware(['verified'])->group(function () {
        Route::middleware('role:superadmin')->group(function () {
        
            Route::prefix('employees')->group(function () {
                Route::get('/stats', [EmployeeController::class, 'stats']);
                Route::get('/export-pdf', [EmployeeController::class, 'exportPDF']);
                Route::get('/', [EmployeeController::class, 'index']);          
                Route::post('/', [EmployeeController::class, 'store']);         
                Route::get('/{id}', [EmployeeController::class, 'show']);      
                Route::put('/{id}', [EmployeeController::class, 'update']);    
                Route::delete('/{id}', [EmployeeController::class, 'destroy']);
            });

            Route::prefix('rcar')->group(function () {
                Route::get('/', [RCARController::class, 'index']);
                Route::post('/', [RCARController::class, 'store']);
                Route::put('/{id}', [RCARController::class, 'update']);
                Route::delete('/{id}/{user_id?}', [RCARController::class, 'destroy']);
            });

            Route::apiResource('indemnites', IndemniteController::class);
            Route::patch('/indemnites/{id}/toggle-statut', [App\Http\Controllers\SuperAdmin\IndemniteController::class, 'toggleStatut']);

            Route::get('/retraite', [RetraiteController::class, 'index']);
            Route::post('/retraite/update', [RetraiteController::class, 'update']);

            Route::apiResource('cotisations', CotisationController::class);

            Route::prefix('ir')->group(function () {
                Route::get('/annees', [IrController::class, 'getAnnees']);
                Route::get('/settings/{annee}', [IrController::class, 'getSettings']);
                Route::post('/settings/{annee}', [IrController::class, 'updateSettings']);
                Route::delete('/settings/{annee}', [IrController::class, 'destroy']);
                Route::get('/export/{annee}', [IrController::class, 'exportPdf']);
            });




        });
        
        // Role: Admin
        Route::middleware('role:admin')->group(function () {
        });

        // Role: RH
        Route::middleware('role:rh')->group(function () {

        });
    });
});