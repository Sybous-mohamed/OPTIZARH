<?php

use App\Models\User;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\EmployeeController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/CreateRandomUser', UserController::class . '@createRandomUser');

Route::prefix('employees')->group(function () {
    Route::get('/stats', [EmployeeController::class, 'stats']);

    Route::get('/', [EmployeeController::class, 'index']);          
    Route::post('/', [EmployeeController::class, 'store']);         
    Route::get('/{id}', [EmployeeController::class, 'show']);      
    Route::put('/{id}', [EmployeeController::class, 'update']);    
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);
});