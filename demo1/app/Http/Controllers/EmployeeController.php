<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;

use Barryvdh\DomPDF\Facade\Pdf;

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

        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('prenom', 'like', "%$search%")
                ->orWhere('nom', 'like', "%$search%")
                ->orWhere('email', 'like', "%$search%");
            });
        }

        
        if ($request->filled('departement') && $request->departement !== 'Tous') {
            $query->where('departement', $request->departement);
        }

        if ($request->filled('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }
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
        
        
        return response()->json([
            'total' => $total,
            'actifs' => $actifs,
            'conge' => $conge,
            'departs' => 0 
        ]);
    }



    public function exportPDF(Request $request){
        $query = Employee::query();

        if ($request->has('departement') && $request->departement !== 'Tous') {
            $query->where('departement', $request->departement);
        }

        if ($request->has('statut') && $request->statut !== 'Tous') {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                ->orWhere('prenom', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $employees = $query->get()->toArray();

        $pdf = Pdf::loadView('pdf.employees', ['employees' => $employees]);

        return $pdf->download('liste-employes-filtree.pdf');
    }


}
