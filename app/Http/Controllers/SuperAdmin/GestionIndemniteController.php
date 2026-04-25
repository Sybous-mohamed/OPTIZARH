<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\GestionIndemnite;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Role;
use App\Models\SuperAdmin\Grade;
use App\Models\SuperAdmin\Echelle;
use App\Models\SuperAdmin\Echelon;

class GestionIndemniteController extends Controller
{
    public function index($yearId)
    {
        $indemnites = GestionIndemnite::where('salary_year_id', $yearId)
            ->with(['role', 'grade', 'echelle', 'echelon'])
            ->latest()
            ->get();
        
        return response()->json($indemnites);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle' => 'required|string',
            'type' => 'required|in:Fixe,Pourcentage',
            'valeur' => 'required|numeric',
            'salary_year_id' => 'required|exists:salary_years,id',
            'role_id' => 'nullable|exists:roles,id',
            'grade_id' => 'nullable|exists:grades,id',
            'echelle_id' => 'nullable|exists:echelles,id',
            'echelon_id' => 'nullable|exists:echelons,id',
            'is_for_all' => 'boolean' 
        ]);

        $indemnite = GestionIndemnite::create($validated);

        return response()->json([
            'message' => 'Indemnité ajoutée',
            'data' => $indemnite->load(['role', 'grade', 'echelle', 'echelon'])
        ], 201);
    }

    public function destroy($id)
    {
        GestionIndemnite::findOrFail($id)->delete();
        return response()->json(['message' => 'Supprimé avec succès']);
    }
}