<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\Gestion_IR;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;

class IrController extends Controller{
    
    public function getAnnees() {
        $annees = Gestion_IR::pluck('annee')->toArray();
        return response()->json($annees);
    }

    public function getSettings($annee) {
        $settings = Gestion_IR::where('annee', $annee)->first();
        return response()->json($settings ?: ['data_rows' => []]);
    }

    public function updateSettings(Request $request, $annee) {
        $request->validate([
            'data_rows' => 'required|array|min:1',
            'data_rows.*.min' => 'required|numeric|min:0',
            'data_rows.*.max' => [
            'required',
            'numeric',
                function ($attribute, $value, $fail) use ($request) {
                    preg_match('/data_rows\.(\d+)\.max/', $attribute, $matches);
                    $index = $matches[1];
                    $min = $request->data_rows[$index]['min'];
                    if ($value <= $min && !($value == 0 && $min == 0)) {
                        $fail("Le montant maximum doit être supérieur au minimum.");
                    }
                },
            ], 
            'data_rows.*.taux' => 'required|numeric|min:0|max:100',
            'data_rows.*.marie' => 'required|numeric|min:0',
            'data_rows.*.enfant1' => 'required|numeric|min:0',
            'data_rows.*.enfant2' => 'required|numeric|min:0',
        ], [
            'data_rows.*.min.min' => 'Le montant minimum ne peut pas être négatif.',
            'data_rows.*.max.gt' => 'Le montant maximum doit être supérieur au minimum.',
            'data_rows.*.taux.max' => 'Le taux ne peut pas dépasser 100%.',
        ]);

        try {
            $setting = Gestion_IR::updateOrCreate(
                ['annee' => $annee],
                ['data_rows' => $request->data_rows] 
            );
            $this->logActivity("Paramétrage IR", "UPDATE", "Mise à jour de la grille IR pour l'exercice : " . $annee);
            return response()->json([
                'status' => 'success',
                'message' => 'Configuration mise à jour',
                'data' => $setting
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }
    
   public function destroy($annee) {
        try {
            $setting = Gestion_IR::where('annee', $annee)->first();

            if (!$setting) {
                return response()->json(['message' => 'Année introuvable'], 404);
            }
            $setting->delete();
            $this->logActivity("Paramétrage IR", "DELETE", "Suppression de la configuration IR de l'année : " . $annee);
            return response()->json(['message' => 'L’exercice ' . $annee . ' a été supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
    public function exportPdf($annee) {
        $settings = Gestion_IR::where('annee', $annee)->first();
        if (!$settings) {
            return response()->json(['message' => 'Données introuvables'], 404);
        }
        $pdf = Pdf::loadView('pdf.ir_settings', [
            'annee' => $annee,
            'rows' => $settings->data_rows
        ]);
        $this->logActivity("Export", "EXPORT", "Génération PDF de la configuration IR " . $annee);
        return $pdf->setPaper('a4')->stream("Configuration_IR_$annee.pdf");
    }
}