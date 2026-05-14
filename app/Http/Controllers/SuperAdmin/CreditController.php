<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\CreditType;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CreditController extends Controller
{
    public function getTypes()
    {
        $types = CreditType::orderBy('sort_order')->get();
        
        $this->logActivity(
            'Consultation types crédit',
            'READ',
            'Récupération de la liste des types de crédit'
        );
        
        return response()->json($types);
    }
    
    public function storeType(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:credit_types,code',
        ]);

        $type = CreditType::create([
            'name' => $request->name,
            'code' => $request->code,
            'sort_order' => CreditType::count() + 1
        ]);

        $this->logActivity(
            'Ajout type crédit',
            'CREATE',
            "Ajout du type de crédit: {$request->name} (Code: {$request->code})"
        );

        return response()->json($type, 201);
    }

    public function updateType(Request $request, $id)
    {
        $type = CreditType::findOrFail($id);
        $oldName = $type->name;
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:credit_types,code,' . $id,
            'is_active' => 'sometimes|boolean'
        ]);

        $type->update($request->all());

        $this->logActivity(
            'Modification type crédit',
            'UPDATE',
            "Modification du type de crédit: {$oldName} → {$type->name}"
        );

        return response()->json($type);
    }

    public function destroyType($id)
    {
        $type = CreditType::findOrFail($id);
        $typeName = $type->name;
        
        if ($type->credits()->count() > 0) {
            return response()->json(['error' => 'Ce type est utilisé par des crédits'], 422);
        }
        
        $type->delete();
        
        $this->logActivity(
            'Suppression type crédit',
            'DELETE',
            "Suppression du type de crédit: {$typeName}"
        );
        
        return response()->json(['message' => 'Type supprimé']);
    }
}