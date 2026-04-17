<?php
namespace App\Http\Controllers\API;

use App\Models\ParametrageRCAR;
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

    public function index() {
        return response()->json(ParametrageRCAR::orderBy('annee', 'desc')->get());
    }

    public function store(Request $request) {
        $validated = $request->validate($this->rules());
        $rcar = ParametrageRCAR::create($validated); 
        return response()->json($rcar, 201);
    }

    public function update(Request $request, $id) {
        $rcar = ParametrageRCAR::findOrFail($id);
        $validated = $request->validate($this->rules($id));
        $rcar->update($validated);
        return response()->json($rcar);
    }

    public function destroy($id) {
        try {
            $rcar = ParametrageRCAR::findOrFail($id);
            $rcar->delete();
            return response()->json(['message' => 'Annes supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}