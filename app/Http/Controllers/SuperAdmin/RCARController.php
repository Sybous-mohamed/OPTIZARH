<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\ParametrageRCAR;
use App\Models\SuperAdmin\ActivityLog; 
use Illuminate\Http\Request;
use App\Http\Controllers\Controller; 

class RCARController extends Controller {
    
    private function rules($id = null) {
        return [
            'annee' => 'required|integer|min:1900|max:2200|unique:parametrage_rcars,annee,' . $id,
            'salariale_active' => 'required|boolean',
            'patronale_active' => 'required|boolean',
            'salariale_rg_taux' => 'nullable|numeric|min:0|max:100',
            'salariale_rc_taux' => 'nullable|numeric|min:0|max:100',
            'patronale_rg_taux' => 'nullable|numeric|min:0|max:100',
            'patronale_rc_taux' => 'nullable|numeric|min:0|max:100',
            'salariale_rg_plafond' => 'nullable|numeric|min:0',
            'salariale_rc_plafond' => 'nullable|numeric|min:0',
            'patronale_rg_plafond' => 'nullable|numeric|min:0',
            'patronale_rc_plafond' => 'nullable|numeric|min:0',
        ];
    }

    // Helper bach n-ssajlo l-log bla ma n-ktbo l-code bzzaf d l-merrat
    private function logRCAR($action, $type, $desc) {
        try {
            ActivityLog::create([
                'user_id'     => auth()->id(),
                'titre'       => $action,
                'action_type' => $type,
                'description' => $desc,
                'annee'       => date('Y'),
            ]);
        } catch (\Exception $e) {
            \Log::error("Erreur Log RCAR: " . $e->getMessage());
        }
    }

    public function index() {
        return response()->json(ParametrageRCAR::orderBy('annee', 'desc')->get());
    }

    public function store(Request $request) {
        $validated = $request->validate($this->rules());
        $rcar = ParametrageRCAR::create($validated); 

        if ($rcar) {
            $this->logRCAR(
                "Paramétrage RCAR", 
                "CREATE", 
                "Ajout d'un nouveau paramétrage RCAR pour l'année : " . $rcar->annee
            );
        }

        return response()->json($rcar, 201);
    }

    public function update(Request $request, $id) {
        $rcar = ParametrageRCAR::findOrFail($id);
        $validated = $request->validate($this->rules($id));
        
        $rcar->update($validated);

        $this->logRCAR(
            "Paramétrage RCAR", 
            "UPDATE", 
            "Mise à jour du paramétrage RCAR de l'année : " . $rcar->annee
        );

        return response()->json($rcar);
    }

    public function destroy($id) {
        try {
            $rcar = ParametrageRCAR::findOrFail($id);
            $anneeDeleted = $rcar->annee; 
            
            $rcar->delete();

            $this->logRCAR(
                "Paramétrage RCAR", 
                "DELETE", 
                "Suppression du paramétrage RCAR pour l'année : " . $anneeDeleted
            );

            return response()->json(['message' => 'Année supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}