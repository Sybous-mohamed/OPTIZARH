<?php 

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\Credit;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Validation\ValidationException;

class CreditController extends Controller
{
    public function index()
    {
        return response()->json(Credit::latest()->get());
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'          => 'required|string|max:255',
                'type'          => 'required|string',
                'category'      => 'required|string',
                'max_amount'    => 'required|numeric|min:1|max:90999999999', 
                'interest_rate' => 'required|numeric|min:0|max:100',
                'max_duration'  => 'required|integer|min:1',
            ]);

            $credit = Credit::create($validated);

            return response()->json([
                'message' => "Le produit de crédit a été créé avec succès !",
                'data' => $credit
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => "Données invalides: " . collect($e->errors())->flatten()->first()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => "Erreur lors de l'enregistrement"
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $credit = Credit::findOrFail($id);
            
            $validated = $request->validate([
                'name'           => 'sometimes|string|max:255',
                'type'           => 'sometimes|string',
                'category'       => 'sometimes|string',
                'max_amount'     => 'sometimes|numeric|min:1',
                'interest_rate'  => 'sometimes|numeric|min:0|max:100',
                'max_duration'   => 'sometimes|integer|min:1',
                'status'         => 'sometimes|in:Actif,En Révision,Inactif',
            ]);

            $credit->update($validated);
            return response()->json([
                'message' => "Modifications enregistrées !",
                'data' => $credit
            ]);

        } catch (ValidationException $e) {
            return response()->json(['message' => collect($e->errors())->flatten()->first()], 422);
        }
    }

    public function destroy($id)
    {
        $credit = Credit::findOrFail($id);
        $credit->delete();
        return response()->json(['message' => 'Le produit a été supprimé']);
    }

    public function toggleStatus($id)
    {
        $credit = Credit::findOrFail($id);
        $credit->status = ($credit->status === 'Actif') ? 'Inactif' : 'Actif';
        $credit->save();
        return response()->json([
            'message' => "Le statut est maintenant: " . $credit->status,
            'data' => $credit
        ]);
    }
}