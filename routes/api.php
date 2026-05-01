<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\VerifyEmailController;




use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\EmployeeController;
use App\Http\Controllers\SuperAdmin\GestionEtatController;
use App\Http\Controllers\SuperAdmin\GestionIndemniteController;
use App\Http\Controllers\SuperAdmin\CotisationController;

use App\Http\Controllers\SuperAdmin\IrController;

use App\Http\Controllers\SuperAdmin\RCARController;
use App\Http\Controllers\SuperAdmin\SntlSettingController;
use App\Http\Controllers\SuperAdmin\AssuranceController;



use App\Http\Controllers\SuperAdmin\ActivityLogController;
use App\Http\Controllers\SuperAdmin\RetraiteController;
use App\Http\Controllers\SuperAdmin\CreditController;



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
    Route::delete('/activity-logs/{id}', [ActivityLogController::class, 'destroy']);

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
    Route::middleware('role:superadmin')->group(function () {

            Route::prefix('employees')->group(function () {
                Route::get('/annees', [EmployeeController::class, 'getAnnees'])->name('employees.annees');
                Route::get('/stats', [EmployeeController::class, 'stats'])->name('employees.stats');
                Route::get('/export-pdf', [EmployeeController::class, 'exportPDF'])->name('employees.export-pdf');
                Route::get('/classification', [EmployeeController::class, 'getClassification'])->name('employees.classification');
                Route::post('/check-email', [EmployeeController::class, 'checkEmail'])->name('employees.check-email');
                
                // Routes CRUD - celles avec {id} APRÈS les routes spécifiques
                Route::get('/', [EmployeeController::class, 'index'])->name('employees.index');
                Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
                Route::get('/{id}', [EmployeeController::class, 'show'])->name('employees.show');
                Route::put('/{id}', [EmployeeController::class, 'update'])->name('employees.update');
                Route::delete('/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
            });
            Route::prefix('gestionEtat')->group(function () {
                Route::get('/years', [GestionEtatController::class, 'getYears']);
                Route::post('/store', [GestionEtatController::class, 'store']);
                Route::get('/get-by-year/{year}', [GestionEtatController::class, 'getByYear']);
                
                Route::get('/roles/{yearId}', [GestionEtatController::class, 'getRoles']);
                Route::get('/grades/{roleId}', [GestionEtatController::class, 'getGrades']);
                Route::get('/echelles/{gradeId}', [GestionEtatController::class, 'getEchelles']);
                Route::get('/echelons/{echelleId}', [GestionEtatController::class, 'getEchelons']);
                Route::get('/role-details/{roleId}', [GestionEtatController::class, 'getRoleDetails']);
                Route::get('/grade-details/{gradeId}', [GestionEtatController::class, 'getGradeDetails']);
                Route::get('/echelon-details/{id}', [GestionEtatController::class, 'getEchelonDetails']);
                Route::get('/starred-roles', [GestionEtatController::class, 'getStarredRoles']);
                Route::put('/role/{id}/toggle-star', [GestionEtatController::class, 'toggleStarredRole']);
                Route::delete('/role/{id}', [GestionEtatController::class, 'destroyRole']);
                Route::delete('/grade/{id}', [GestionEtatController::class, 'destroyGrade']);
                Route::delete('/echelle/{id}', [GestionEtatController::class, 'destroyEchelle']);
                Route::delete('/echelon/{id}', [GestionEtatController::class, 'destroyEchelon']);
                Route::get('/export-pdf/{year}', [GestionEtatController::class, 'exportPDF']);


                Route::get('/gestionindemnites/{yearId}', [GestionIndemniteController::class, 'index']);
                Route::post('/gestionindemnites', [GestionIndemniteController::class, 'store']);
                Route::delete('/gestionindemnites/{id}', [GestionIndemniteController::class, 'destroy']);
                Route::get('/years-with-indemnites', [GestionEtatController::class, 'getYearsWithIndemnites']);
            });

            Route::get('/salary-years', function() {
                return \App\Models\SuperAdmin\SalaryYear::orderBy('year', 'asc')->get();
            });

            Route::post('/save-cotisations', [CotisationController::class, 'store']);
            Route::get('/get-cotisations', [CotisationController::class, 'index']);
            Route::delete('/organismes/{id}', [CotisationController::class, 'destroyOrganisme']);
            Route::post('/favorite/{id}', [CotisationController::class, 'toggleFavorite']);
            Route::delete('/rubriques/{id}', [CotisationController::class, 'destroyRubrique']);

            Route::prefix('rcar')->group(function () {
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
            });


            // Assurance Sociale - Paramétrage
            Route::prefix('assurances')->group(function () {
                Route::get('/annees', [AssuranceController::class, 'getAnnees']);
                Route::get('/get-by-year/{year}', [AssuranceController::class, 'getByYear']);
                Route::post('/store', [AssuranceController::class, 'store']);
                Route::delete('/assurance/{id}', [AssuranceController::class, 'destroyAssurance']);
                Route::delete('/tranche/{id}', [AssuranceController::class, 'destroyTranche']);
            });

            Route::prefix('sntl')->group(function () {
                Route::get('/configs', [SntlSettingController::class, 'index']);
                Route::post('/save', [SntlSettingController::class, 'store']);
                Route::delete('/configs/{id}', [SntlSettingController::class, 'destroy']);
            });















            
            Route::prefix('retraite')->group(function () {
                // GET - récupérer les paramètres d'une année spécifique
                Route::get('/settings/{year}', [RetraiteController::class, 'getSettings']);
                
                // POST - créer ou mettre à jour les paramètres
                Route::post('/settings', [RetraiteController::class, 'storeOrUpdate']);
                
                // GET - récupérer toutes les configurations (optionnel)
                Route::get('/configs', [RetraiteController::class, 'index']);
            });
            Route::get('/retraite-settings/{year}', [RetraiteController::class, 'getSettings']);
            Route::post('/retraite-settings', [RetraiteController::class, 'storeOrUpdate']);

            Route::get('/superadmin/dashboard-stats', [DashboardController::class, 'getStats']);
            Route::prefix('credits')->group(function () {
                Route::get('/', [CreditController::class, 'index']);
                Route::post('/', [CreditController::class, 'store']);
                Route::put('/{id}', [CreditController::class, 'update']);
                Route::delete('/{id}', [CreditController::class, 'destroy']);
                Route::patch('/{id}/toggle', [CreditController::class, 'toggleStatus']);
            });



    });

    Route::middleware(['verified'])->group(function () {
        
        // Role: Admin
        Route::middleware('role:admin')->group(function () {});
        // Role: RH
        Route::middleware('role:rh')->group(function () {});
    });
});