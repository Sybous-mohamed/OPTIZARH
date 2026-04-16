<?php

use App\Models\User;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\IndemniteController;
use App\Http\Controllers\ActivityLogController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/CreateRandomUser', UserController::class . '@createRandomUser');

Route::prefix('employees')->group(function () {
    Route::get('/stats', [EmployeeController::class, 'stats']);
    Route::get('/export-pdf', [EmployeeController::class, 'exportPDF']);

    Route::get('/', [EmployeeController::class, 'index']);          
    Route::post('/', [EmployeeController::class, 'store']);         
    Route::get('/{id}', [EmployeeController::class, 'show']);      
    Route::put('/{id}', [EmployeeController::class, 'update']);    
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);
});

Route::apiResource('indemnites', IndemniteController::class);
Route::patch('/indemnites/{id}/toggle-statut', [App\Http\Controllers\IndemniteController::class, 'toggleStatut']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
});;