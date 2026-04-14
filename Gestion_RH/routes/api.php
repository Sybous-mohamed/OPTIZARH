<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\AuthController;

Route::get('/check-setup', [SuperAdminController::class, 'checkStatus']);
Route::post('/setup-superadmin', [SuperAdminController::class, 'setup']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Ghadi t-zid hna l-routes dyal Employees o l-Gestion RH mn ba3d
});