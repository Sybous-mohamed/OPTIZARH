<?php

namespace App\Traits;

use App\Models\SuperAdmin\Employee;
use App\Http\Controllers\SuperAdmin\EmployeeController;
use Illuminate\Support\Facades\Log;

trait RecalculatesSalaries
{
    /**
     * Boot the trait
     */
    public static function bootRecalculatesSalaries()
    {
        static::saved(function ($model) {
            static::triggerRecalculation($model);
        });
        
        static::deleted(function ($model) {
            static::triggerRecalculation($model);
        });
    }

    /**
     * Trigger recalculation after response
     */
    protected static function triggerRecalculation($model)
    {
        Log::info('Configuration modifiée: ' . class_basename($model) . ' ID: ' . $model->id);
        
        // Utiliser dispatch si disponible, sinon exécuter directement
        if (function_exists('dispatch')) {
            dispatch(function() {
                static::recalculateAllSalaries();
            })->afterResponse();
        } else {
            static::recalculateAllSalaries();
        }
    }

    /**
     * Recalculate all salaries (optimized)
     */
    protected static function recalculateAllSalaries()
    {
        try {
            $controller = app(EmployeeController::class);
            
            Employee::chunk(50, function($employees) use ($controller) {
                foreach ($employees as $employee) {
                    try {
                        $controller->calculateAndStoreSalary($employee->id);
                    } catch (\Exception $e) {
                        Log::error("Erreur salaire employé {$employee->id}: " . $e->getMessage());
                    }
                }
                // Pause between chunks
                usleep(10000);
            });
            
            Log::info('Recalcul des salaires terminé');
            
        } catch (\Exception $e) {
            Log::error('Erreur recalcul global: ' . $e->getMessage());
        }
    }
}