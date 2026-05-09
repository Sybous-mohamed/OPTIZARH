<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AssuranceController extends Controller
{
    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            return response()->json($annees);
        } catch (\Exception $e) {
            Log::error('getAnnees: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getByYear($year)
    {
        try {
            $annee = SalaryYear::where('year', $year)->first();
            
            if (!$annee) {
                return response()->json([
                    'annee' => $year,
                    'annee_id' => null,
                    'assurances' => []
                ]);
            }

            $assurances = Assurance::where('annee_id', $annee->id)
                ->orderBy('name')
                ->get();

            return response()->json([
                'annee' => $year,
                'annee_id' => $annee->id,
                'assurances' => $assurances
            ]);
        } catch (\Exception $e) {
            Log::error('getByYear: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'annee' => 'required|integer',
                'assurances' => 'required|array',
                'assurances.*.name' => 'required|string',
                'assurances.*.code' => 'required|string',
                'assurances.*.taux_employeur' => 'nullable|numeric',
                'assurances.*.taux_salarie' => 'nullable|numeric',
                'assurances.*.plafond_mensuel' => 'nullable|numeric',
                'assurances.*.is_active' => 'boolean'
            ]);

            return DB::transaction(function () use ($request) {
                $annee = SalaryYear::firstOrCreate(
                    ['year' => $request->annee],
                    ['is_active' => true]
                );

                Assurance::where('annee_id', $annee->id)->delete();

                foreach ($request->assurances as $assData) {
                    Assurance::create([
                        'annee_id' => $annee->id,
                        'name' => $assData['name'],
                        'code' => $assData['code'],
                        'is_active' => $assData['is_active'] ?? true,
                        'taux_salarie' => $assData['taux_salarie'] ?? 0,
                        'taux_employeur' => $assData['taux_employeur'] ?? 0,
                        'plafond_mensuel' => $assData['plafond_mensuel'] ?? null
                    ]);
                }

                Cache::forget('assurances_' . $annee->id);

                return response()->json(['message' => 'Configuration enregistrée'], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Store error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroyAssurance($id)
    {
        try {
            $assurance = Assurance::findOrFail($id);
            $assurance->delete();
            return response()->json(['message' => 'Assurance supprimée']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}