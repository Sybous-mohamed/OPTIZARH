<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Http\Controllers\Controller; 
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the employees with filters and pagination.
     */
    public function index(Request $request)
    {
        $query = Employee::query();

        // Recherche par Nom, Prénom ou Email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('prenom', 'like', "%$search%")
                  ->orWhere('nom', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
            });
        }

        // Filtre par Département
        if ($request->filled('departement') && $request->departement !== 'Tous') {
            $query->where('departement', $request->departement);
        }

        // Filtre par Statut
        if ($request->filled('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(5));
    }

    /**
     * Store a newly created employee in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:employees,email',
                'telephone' => 'nullable|string',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string',
                'situation_familiale' => 'nullable|string',
                'departement' => 'nullable|string',
                'date_embauche' => 'nullable|date',
                'poste' => 'nullable|string',
                'type_contrat' => 'nullable|string',
                'grade' => 'nullable|string',
                'echelle' => 'nullable|string',
                'echelon' => 'nullable|string',
                'statut' => 'nullable|string',
            ]);

            $employee = Employee::create($request->all());
            
            return response()->json([
                'message' => 'Employé créé avec succès',
                'data' => $employee
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Erreur Store Employee: " . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la création'], 500);
        }
    }

    /**
     * Display the specified employee.
     */
    public function show($id)
    {
        $employee = Employee::find($id);
        
        if (!$employee) {
            return response()->json(['message' => 'Employé non trouvé'], 404);
        }
        
        return response()->json($employee);
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::find($id);
        
        if (!$employee) {
            return response()->json(['message' => 'Employé non trouvé'], 404);
        }

        try {
            $request->validate([
                'email' => 'sometimes|email|unique:employees,email,' . $id,
                'prenom' => 'sometimes|string',
                'nom' => 'sometimes|string',
            ]);

            $employee->update($request->all());
            return response()->json($employee);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified employee from storage.
     */
    public function destroy($id)
    {
        $employee = Employee::find($id);
        
        if (!$employee) {
            return response()->json(['message' => 'Employé non trouvé'], 404);
        }

        $employee->delete();
        return response()->json(['message' => 'Employé supprimé avec succès']);
    }

    /**
     * Get statistics for the dashboard.
     */
    public function stats()
    {
        return response()->json([
            'total' => Employee::count(),
            'actifs' => Employee::where('statut', 'ACTIF')->count(),
            'conge' => Employee::where('statut', 'CONGÉ')->count(),
            'departs' => 0 // Hna t9der t-calculer les départs dyal had ch-her masalan
        ]);
    }

    /**
     * Export filtered list to PDF.
     */
    public function exportPDF(Request $request)
    {
        $query = Employee::query();

        if ($request->filled('departement') && $request->departement !== 'Tous') {
            $query->where('departement', $request->departement);
        }

        if ($request->filled('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $employees = $query->get();

        $pdf = Pdf::loadView('pdf.employees', compact('employees'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download('liste-employes-filtree.pdf');
    }
}