<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\Credit;
use App\Models\SuperAdmin\CreditType;
use App\Models\SuperAdmin\CreditCategory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class CreditController extends Controller
{
    // ==================== CREDIT TYPES ====================
    public function getTypes()
    {
        $types = CreditType::with('categories')->orderBy('sort_order')->get();
        
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

        if ($request->has('category_ids')) {
            $type->categories()->sync($request->category_ids);
        }

        $this->logActivity(
            'Ajout type crédit',
            'CREATE',
            "Ajout du type de crédit: {$request->name} (Code: {$request->code})"
        );

        return response()->json($type->load('categories'), 201);
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
        
        if ($request->has('category_ids')) {
            $type->categories()->sync($request->category_ids);
        }

        $this->logActivity(
            'Modification type crédit',
            'UPDATE',
            "Modification du type de crédit: {$oldName} → {$type->name}"
        );

        return response()->json($type->load('categories'));
    }

    public function destroyType($id)
    {
        $type = CreditType::findOrFail($id);
        $typeName = $type->name;
        
        if ($type->credits()->count() > 0) {
            return response()->json(['error' => 'Ce type est utilisé par des crédits'], 422);
        }
        
        $type->categories()->detach();
        $type->delete();
        
        $this->logActivity(
            'Suppression type crédit',
            'DELETE',
            "Suppression du type de crédit: {$typeName}"
        );
        
        return response()->json(['message' => 'Type supprimé']);
    }

    // ==================== CREDIT CATEGORIES ====================
    public function getCategories()
    {
        $categories = CreditCategory::with('types')->orderBy('sort_order')->get();
        
        $this->logActivity(
            'Consultation catégories crédit',
            'READ',
            'Récupération de la liste des catégories de crédit'
        );
        
        return response()->json($categories);
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:credit_categories,code',
        ]);

        $category = CreditCategory::create([
            'name' => $request->name,
            'code' => $request->code,
            'sort_order' => CreditCategory::count() + 1
        ]);

        $this->logActivity(
            'Ajout catégorie crédit',
            'CREATE',
            "Ajout de la catégorie de crédit: {$request->name} (Code: {$request->code})"
        );

        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = CreditCategory::findOrFail($id);
        $oldName = $category->name;
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:credit_categories,code,' . $id,
            'is_active' => 'sometimes|boolean'
        ]);

        $category->update($request->all());
        
        $this->logActivity(
            'Modification catégorie crédit',
            'UPDATE',
            "Modification de la catégorie: {$oldName} → {$category->name}"
        );
        
        return response()->json($category);
    }

    public function destroyCategory($id)
    {
        $category = CreditCategory::findOrFail($id);
        $categoryName = $category->name;
        
        if ($category->credits()->count() > 0) {
            return response()->json(['error' => 'Cette catégorie est utilisée par des crédits'], 422);
        }
        
        DB::table('credit_type_category')->where('credit_category_id', $id)->delete();
        $category->delete();
        
        $this->logActivity(
            'Suppression catégorie crédit',
            'DELETE',
            "Suppression de la catégorie: {$categoryName}"
        );
        
        return response()->json(['message' => 'Catégorie supprimée']);
    }

    // ==================== CREDITS ====================
    
    public function getYears()
    {
        $years = Credit::select('year')
            ->distinct()
            ->whereNotNull('year')
            ->orderBy('year', 'desc')
            ->pluck('year');
        
        $this->logActivity(
            'Consultation années crédits',
            'READ',
            'Récupération des années avec crédits'
        );
        
        return response()->json($years);
    }

    public function getAvailableCategories($typeId)
    {
        $type = CreditType::with('categories')->findOrFail($typeId);
        return response()->json($type->categories);
    }

    public function index(Request $request)
    {
        $query = Credit::with(['type', 'category']);
        
        if ($request->has('year') && $request->year) {
            $query->where('year', $request->year);
        }
        
        $credits = $query->latest()->get();
        
        $this->logActivity(
            'Consultation crédits',
            'READ',
            'Récupération de la liste des crédits' . ($request->year ? " (année {$request->year})" : '')
        );
        
        return response()->json($credits);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_id' => 'required|exists:credit_types,id',
            'category_id' => 'required|exists:credit_categories,id',
            'max_amount' => 'required|numeric|min:1',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'max_duration' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'year' => 'required|integer|min:2000|max:2100'
        ]);

        $credit = Credit::create($validated);
        
        $this->logActivity(
            'Ajout crédit',
            'CREATE',
            "Ajout du crédit: {$validated['name']} (Année: {$validated['year']}, Montant: {$validated['max_amount']})"
        );
        
        return response()->json($credit->load(['type', 'category']), 201);
    }

    public function update(Request $request, $id)
    {
        $credit = Credit::findOrFail($id);
        $oldName = $credit->name;
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type_id' => 'sometimes|exists:credit_types,id',
            'category_id' => 'sometimes|exists:credit_categories,id',
            'max_amount' => 'sometimes|numeric|min:1',
            'interest_rate' => 'sometimes|numeric|min:0|max:100',
            'max_duration' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:Actif,En Révision,Inactif',
            'description' => 'nullable|string',
            'year' => 'sometimes|integer|min:2000|max:2100'
        ]);

        $credit->update($validated);
        
        $this->logActivity(
            'Modification crédit',
            'UPDATE',
            "Modification du crédit: {$oldName} → {$credit->name}"
        );
        
        return response()->json($credit->load(['type', 'category']));
    }

    public function destroy($id)
    {
        $credit = Credit::findOrFail($id);
        $creditName = $credit->name;
        $credit->delete();
        
        $this->logActivity(
            'Suppression crédit',
            'DELETE',
            "Suppression du crédit: {$creditName}"
        );
        
        return response()->json(['message' => 'Crédit supprimé']);
    }

    public function toggleStatus($id)
    {
        $credit = Credit::findOrFail($id);
        $oldStatus = $credit->status;
        $credit->status = $credit->status === 'Actif' ? 'Inactif' : 'Actif';
        $credit->save();
        
        $this->logActivity(
            'Changement statut crédit',
            'UPDATE',
            "Changement de statut du crédit '{$credit->name}': {$oldStatus} → {$credit->status}"
        );
        
        return response()->json($credit);
    }

    public function getActiveCreditsByYear($year)
    {
        try {
            $credits = Credit::where('year', $year)
                ->where('status', 'Actif')
                ->with(['type', 'category'])
                ->get();
            
            return response()->json($credits);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }
}