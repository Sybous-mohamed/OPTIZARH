<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;

class EmployeeController extends Controller{
    //
    public function store(Request $request) {
    $validated = $request->validate([
        'prenom' => 'required|string',
        'nom' => 'required|string',
        'email' => 'required|email|unique:employees',
        'statut' => 'nullable|string', 
        'departement' => 'nullable|string',
        'poste' => 'nullable|string'
    ]);

    $employee = Employee::create($request->all());
    return response()->json($employee, 201);
    }

    public function index(Request $request) {
        $query = Employee::query();

        // 1. Search b smya wla email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('prenom', 'like', "%$search%")
                ->orWhere('nom', 'like', "%$search%")
                ->orWhere('email', 'like', "%$search%");
            });
        }

        // 2. Filter b Département
        if ($request->filled('departement') && $request->departement !== 'Tous') {
            $query->where('departement', $request->departement);
        }

        // 3. Filter b Statut
        if ($request->filled('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }

        // 4. Sort o Pagination (ila bghiti)
        return response()->json($query->orderBy('created_at', 'desc')->paginate(5));
    }

    public function show($id) {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        return response()->json($employee);
    }

    public function update(Request $request, $id) {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        $employee->update($request->all());
        return response()->json($employee);
    }

    public function destroy($id) {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        $employee->delete();
        return response()->json(['message' => 'Employee deleted']);
    }

    public function stats() {
        $total = Employee::count();
        $actifs = Employee::where('statut', 'ACTIF')->count();
        $conge = Employee::where('statut', 'CONGÉ')->count();
        
        // Ghadi n-rj3ou l-format li ghadi i-ji s-hel f React
        return response()->json([
            'total' => $total,
            'actifs' => $actifs,
            'conge' => $conge,
            'departs' => 0 // Hna logic dyal départs (ila kanti kat-khzenha)
        ]);
    }


}
