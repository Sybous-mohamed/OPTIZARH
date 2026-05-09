<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\SuperAdmin\UserProfileController;

use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\EmployeeController;
use App\Http\Controllers\SuperAdmin\GestionEtatController;
use App\Http\Controllers\SuperAdmin\GestionIndemniteController;
use App\Http\Controllers\SuperAdmin\CotisationController;
use App\Http\Controllers\SuperAdmin\RCARController;
use App\Http\Controllers\SuperAdmin\IrController;
use App\Http\Controllers\SuperAdmin\CreditController;
use App\Http\Controllers\SuperAdmin\SntlSettingController;
use App\Http\Controllers\SuperAdmin\RetraiteController;
use App\Http\Controllers\SuperAdmin\AssuranceController;
use App\Http\Controllers\SuperAdmin\ActivityLogController;
use App\Http\Controllers\SuperAdmin\SettingsController;





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

Route::get('/Settings/registration-status', function () {
    $setting = \App\Models\SuperAdmin\Setting::where('key', 'registration_enabled')->first();
    return response()->json([
        'registration_enabled' => $setting ? (bool)$setting->value : true
    ]);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::delete('/activity-logs/{id}', [ActivityLogController::class, 'destroy']);
    // Account & Status
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/update-password-first', [AuthController::class, 'updatePasswordFirst']);
    Route::post('/user/skip-password-change', [AuthController::class, 'skipPasswordChange']);
    Route::get('/auth/user-status', [AuthController::class, 'userStatus']);

    // Verification Notification
    Route::post('/email/verification-notification', [AuthController::class, 'sendVerificationEmail'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');

    Route::middleware(['verified'])->group(function () {
        Route::middleware('role:superadmin')->group(function () {

            Route::get('/salary-years', function () {
                return \App\Models\SuperAdmin\SalaryYear::orderBy('year', 'asc')->get();
            });

            Route::get('/superadmin/dashboard-stats', [DashboardController::class, 'getStats']);

            Route::prefix('employees')->group(function () {
                Route::get('/annees', [EmployeeController::class, 'getAnnees'])->name('employees.annees');
                Route::get('/stats', [EmployeeController::class, 'stats'])->name('employees.stats');
                Route::get('/export-pdf', [EmployeeController::class, 'exportPDF'])->name('employees.export-pdf');
                Route::get('/classification', [EmployeeController::class, 'getClassification'])->name('employees.classification');
                Route::post('/check-email', [EmployeeController::class, 'checkEmail'])->name('employees.check-email');
                Route::get('/', [EmployeeController::class, 'index'])->name('employees.index');
                Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
                Route::get('/{id}', [EmployeeController::class, 'show'])->name('employees.show');
                Route::put('/{id}', [EmployeeController::class, 'update'])->name('employees.update');
                Route::delete('/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
                
                Route::get('/{employeeId}/credits', [EmployeeController::class, 'getCredits']);
                Route::post('/{employeeId}/credits', [EmployeeController::class, 'addCredit']);
                Route::put('/credits/{creditId}', [EmployeeController::class, 'updateCredit']);
                Route::delete('/credits/{creditId}', [EmployeeController::class, 'deleteCredit']);
            });

            Route::prefix('gestionEtat')->group(function () {
                Route::get('/years', [GestionEtatController::class, 'getYears']);
                Route::post('/store', [GestionEtatController::class, 'store']);
                Route::get('/get-by-year/{year}', [GestionEtatController::class, 'getByYear']);
                Route::get('/posts/{yearId}', [GestionEtatController::class, 'getPosts']);
                Route::get('/grades/{postId}', [GestionEtatController::class, 'getGrades']);
                Route::get('/post-details/{postId}', [GestionEtatController::class, 'getPostDetails']);
                Route::get('/starred-posts', [GestionEtatController::class, 'getStarredPosts']);
                Route::put('/post/{id}/toggle-star', [GestionEtatController::class, 'toggleStarredPost']);
                Route::delete('/post/{id}', [GestionEtatController::class, 'destroyPost']);
                Route::get('/echelles/{gradeId}', [GestionEtatController::class, 'getEchelles']);
                Route::get('/echelons/{echelleId}', [GestionEtatController::class, 'getEchelons']);
                Route::get('/grade-details/{gradeId}', [GestionEtatController::class, 'getGradeDetails']);
                Route::get('/echelon-details/{id}', [GestionEtatController::class, 'getEchelonDetails']);
                Route::delete('/grade/{id}', [GestionEtatController::class, 'destroyGrade']);
                Route::delete('/echelle/{id}', [GestionEtatController::class, 'destroyEchelle']);
                Route::delete('/echelon/{id}', [GestionEtatController::class, 'destroyEchelon']);
                Route::get('/export-pdf/{year}', [GestionEtatController::class, 'exportPDF']);
                Route::post('/add-year', [GestionEtatController::class, 'addYear']);
                Route::get('/check-year/{year}', [GestionEtatController::class, 'checkYearExists']);
                Route::get('/all-years', [GestionEtatController::class, 'getAllYears']);
                Route::get('/stats/{year}', [GestionEtatController::class, 'getStats']);
                Route::post('/copy-year/{fromYear}/{toYear}', [GestionEtatController::class, 'copyYear']);

                // Indemnités
                Route::get('/gestionindemnites/{yearId}', [GestionIndemniteController::class, 'index']);
                Route::get('/gestionindemnites/detail/{id}', [GestionIndemniteController::class, 'show']);
                Route::post('/gestionindemnites', [GestionIndemniteController::class, 'store']);
                Route::put('/gestionindemnites/{id}', [GestionIndemniteController::class, 'update']);
                Route::delete('/gestionindemnites/{id}', [GestionIndemniteController::class, 'destroy']);
                Route::get('/years-with-indemnites', [GestionIndemniteController::class, 'getYearsWithIndemnites']);
            });

            Route::prefix('cotisations')->group(function () {
                Route::get('/', [CotisationController::class, 'index']);
                Route::post('/save', [CotisationController::class, 'store']);
                Route::delete('/organisme/{id}', [CotisationController::class, 'destroyOrganisme']);
                Route::delete('/rubrique/{id}', [CotisationController::class, 'destroyRubrique']);
                Route::post('/favorite/{id}', [CotisationController::class, 'toggleFavorite']);
                Route::get('/years-with-data', [CotisationController::class, 'getYearsWithData']);
            });



            Route::prefix('rcar')->group(function () {
                Route::get('/years-with-data', [RCARController::class, 'getYearsWithData']);
                Route::get('/config/{year}', [RCARController::class, 'getConfiguration']);
                Route::post('/config/save', [RCARController::class, 'saveConfiguration']);
                Route::delete('/type/{id}', [RCARController::class, 'deleteType']);
                Route::delete('/detail/{id}', [RCARController::class, 'deleteDetail']);
                Route::get('/', [RCARController::class, 'index']);
                Route::post('/', [RCARController::class, 'store']);
                Route::put('/{id}', [RCARController::class, 'update']);
                Route::delete('/{id}/{user_id?}', [RCARController::class, 'destroy']);
                Route::patch('/type/{id}/toggle-favorite', [RCARController::class, 'toggleFavorite']);
            });

            Route::prefix('ir')->group(function () {
                Route::get('/annees', [IrController::class, 'getAnnees']);
                Route::get('/settings/{annee}', [IrController::class, 'getSettings']);
                Route::get('/export/{annee}', [IrController::class, 'exportPdf']);
                Route::get('/annees-for-settings', [IrController::class, 'getAnneesForSettings']);
                Route::get('/settings-for-edit/{annee}', [IrController::class, 'getSettingsForEdit']);
                Route::post('/settings/{annee}', [IrController::class, 'updateSettings']);
                Route::delete('/settings/{annee}', [IrController::class, 'destroy']);
                Route::get('/check-year/{annee}', [IrController::class, 'checkYear']);
                Route::post('/copy-year', [IrController::class, 'copyYear']);
                Route::get('/cached-settings/{annee}', [IrController::class, 'getCachedSettings']);
            });


            Route::prefix('retraite')->group(function () {
                Route::get('/settings/{year}', [RetraiteController::class, 'getSettings']);
                Route::post('/settings', [RetraiteController::class, 'storeOrUpdate']);
                Route::get('/configs', [RetraiteController::class, 'index']);
            });
            Route::get('/retraite-settings/{year}', [RetraiteController::class, 'getSettings']);
            Route::post('/retraite-settings', [RetraiteController::class, 'storeOrUpdate']);

            // ==================== CREDIT TYPES ====================
            Route::prefix('credit-types')->group(function () {
                Route::get('/', [CreditController::class, 'getTypes']);
                Route::post('/', [CreditController::class, 'storeType']);
                Route::put('/{id}', [CreditController::class, 'updateType']);
                Route::delete('/{id}', [CreditController::class, 'destroyType']);
            });



            Route::prefix('assurances')->group(function () {
                Route::get('/annees', [AssuranceController::class, 'getAnnees']);
                Route::get('/get-by-year/{year}', [AssuranceController::class, 'getByYear']);
                Route::post('/store', [AssuranceController::class, 'store']);
                Route::delete('/assurance/{id}', [AssuranceController::class, 'destroyAssurance']);
            });

            Route::prefix('sntl')->group(function () {
                Route::get('/years-with-data', [SntlSettingController::class, 'getYearsWithData']);
                Route::get('/configs', [SntlSettingController::class, 'index']);
                Route::post('/save', [SntlSettingController::class, 'store']);
                Route::delete('/configs/{id}', [SntlSettingController::class, 'destroy']);
                Route::get('/configs/{year}', [SntlSettingController::class, 'getByYear']);
            });
            Route::prefix('Settings')->group(function () {
                Route::get('/profile', [UserProfileController::class, 'show']);
                Route::post('/profile', [UserProfileController::class, 'updateProfile']);
                Route::post('/password', [UserProfileController::class, 'updatePassword']);
                Route::get('/admin/platform-data', [SettingsController::class, 'index']); // Badel hada f React f fetchPlatformData
                Route::post('/admin/settings', [SettingsController::class, 'updateRegistration']);
                Route::patch('/admin/users/{id}/toggle-block', [SettingsController::class, 'toggleBlock']);
            });

        });
        // Role: Admin
        Route::middleware('role:admin')->group(function () { });
        // Role: RH
        Route::middleware('role:rh')->group(function () { });
    });
});