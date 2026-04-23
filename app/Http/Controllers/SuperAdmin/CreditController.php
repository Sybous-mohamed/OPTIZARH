<?php 

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\Credit;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Validation\ValidationException;

class CreditController extends Controller
{
    /**
     * Afficher la liste des produits de crédit.
     */
    public function index()
    {
        return response()->json(Credit::latest()->get());
    }

    /**
     * Enregistrer un nouveau produit de crédit.
     */
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

            // --- LOGS ACTIVITÉ ---
            $this->logActivity(
                "Crédit", 
                "CREATE", 
                "Ajout du produit de crédit : " . $credit->name . " (Type: " . $credit->type . ")"
            );

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

    /**
     * Mettre à jour un produit de crédit existant.
     */
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

            // --- LOGS ACTIVITÉ ---
            $this->logActivity(
                "Crédit", 
                "UPDATE", 
                "Modification des paramètres du crédit : " . $credit->name
            );

            return response()->json([
                'message' => "Modifications enregistrées !",
                'data' => $credit
            ]);

        } catch (ValidationException $e) {
            return response()->json(['message' => collect($e->errors())->flatten()->first()], 422);
        }
    }

    /**
     * Supprimer un produit de crédit.
     */
    public function destroy($id)
    {
        try {
            $credit = Credit::findOrFail($id);
            $creditName = $credit->name;
            
            $credit->delete();

            // --- LOGS ACTIVITÉ ---
            $this->logActivity(
                "Crédit", 
                "DELETE", 
                "Suppression définitive du produit : " . $creditName
            );

            return response()->json(['message' => 'Le produit a été supprimé']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Activer/Désactiver le statut d'un crédit.
     */
    public function toggleStatus($id)
    {
        try {
            $credit = Credit::findOrFail($id);
            $credit->status = ($credit->status === 'Actif') ? 'Inactif' : 'Actif';
            $credit->save();

            // --- LOGS ACTIVITÉ ---
            $this->logActivity(
                "Crédit", 
                "UPDATE", 
                "Changement de statut vers '" . $credit->status . "' pour le crédit : " . $credit->name
            );

            return response()->json([
                'message' => "Le statut est maintenant: " . $credit->status,
                'data' => $credit
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du changement de statut'], 500);
        }
    }
}