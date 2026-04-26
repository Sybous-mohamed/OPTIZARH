<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\GestionIR;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;

class IrController extends Controller
{
    // ==========================================================
    //                 FONCTIONS POUR L'AFFICHAGE
    // ==========================================================

    // Récupérer toutes les années depuis la table gestion_ir
    public function getAnnees()
    {
        try {
            $annees = GestionIR::orderBy('annee', 'desc')->pluck('annee')->toArray();
            
            if (empty($annees)) {
                return response()->json([]);
            }
            
            return response()->json($annees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Récupérer les paramètres d'une année (pour affichage)
    public function getSettings($annee)
    {
        try {
            $settings = GestionIR::where('annee', $annee)->first();
            
            if (!$settings) {
                return response()->json([
                    'data_rows' => [
                        ['min' => 0, 'max' => 0, 'taux' => 0, 'marie' => 0, 'enfant1' => 0, 'enfant2' => 0]
                    ]
                ]);
            }
            
            return response()->json([
                'data_rows' => $settings->data_rows
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Exporter PDF
    public function exportPdf($annee)
    {
        try {
            $settings = GestionIR::where('annee', $annee)->first();
            
            if (!$settings) {
                return response()->json(['message' => 'Données introuvables pour l\'année ' . $annee], 404);
            }
            
            $pdf = Pdf::loadView('pdf.ir_settings', [
                'annee' => $annee,
                'rows' => $settings->data_rows,
                'date' => now()->format('d/m/Y H:i')
            ]);
            
            $pdf->setPaper('a4', 'portrait');
            
            $this->logActivity(
                'Export IR',
                'EXPORT',
                "Génération PDF de la configuration IR pour l'année " . $annee
            );
            
            return $pdf->download("barème_IR_{$annee}.pdf");
        } catch (\Exception $e) {
            $this->logActivity(
                'Export IR',
                'ERROR',
                "Erreur lors de l'export PDF IR: " . $e->getMessage()
            );
            return response()->json(['message' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    // ==========================================================
    //                 FONCTIONS POUR LE PARAMÉTRAGE
    // ==========================================================

    // Récupérer toutes les années (pour paramétrage)
    public function getAnneesForSettings()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->pluck('year')->toArray();
            return response()->json($annees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Récupérer les paramètres d'une année pour modification
    public function getSettingsForEdit($annee)
    {
        try {
            $settings = GestionIR::where('annee', $annee)->first();
            
            if (!$settings) {
                return response()->json([
                    'data_rows' => [
                        ['min' => 0, 'max' => 0, 'taux' => 0, 'marie' => 0, 'enfant1' => 0, 'enfant2' => 0]
                    ]
                ]);
            }
            
            return response()->json([
                'data_rows' => $settings->data_rows
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Mettre à jour les paramètres
    public function updateSettings(Request $request, $annee)
    {
        $request->validate([
            'data_rows' => 'required|array|min:1',
            'data_rows.*.min' => 'required|numeric|min:0',
            'data_rows.*.max' => 'required|numeric|min:0',
            'data_rows.*.taux' => 'required|numeric|min:0|max:100',
            'data_rows.*.marie' => 'required|numeric|min:0',
            'data_rows.*.enfant1' => 'required|numeric|min:0',
            'data_rows.*.enfant2' => 'required|numeric|min:0',
        ]);

        // Validation: max > min (sauf si max == 0)
        foreach ($request->data_rows as $index => $row) {
            $min = $row['min'];
            $max = $row['max'];
            
            if ($max != 0 && $max <= $min) {
                return response()->json([
                    'message' => "Erreur tranche " . ($index + 1) . " : Le maximum ($max) doit être supérieur au minimum ($min)"
                ], 422);
            }
        }
        
        // Validation: Cohérence entre les tranches
        $dataRows = $request->data_rows;
        for ($i = 0; $i < count($dataRows) - 1; $i++) {
            $currentMax = $dataRows[$i]['max'];
            $nextMin = $dataRows[$i + 1]['min'];
            
            if ($currentMax != 0 && $currentMax != $nextMin) {
                return response()->json([
                    'message' => "Erreur: La tranche " . ($i + 1) . " max ($currentMax) doit être égale à la tranche " . ($i + 2) . " min ($nextMin)"
                ], 422);
            }
        }

        try {
            $setting = GestionIR::updateOrCreate(
                ['annee' => $annee],
                ['data_rows' => $request->data_rows]
            );
            
            $this->logActivity(
                'Paramétrage IR',
                'UPDATE',
                "Mise à jour de la grille IR pour l'année : " . $annee
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Configuration enregistrée avec succès',
                'data' => $setting
            ]);
        } catch (\Exception $e) {
            $this->logActivity(
                'Paramétrage IR',
                'ERROR',
                "Erreur lors de l'enregistrement IR: " . $e->getMessage()
            );
            return response()->json(['message' => 'Erreur serveur : ' . $e->getMessage()], 500);
        }
    }

    // Supprimer la configuration d'une année
    public function destroy($annee)
    {
        try {
            $setting = GestionIR::where('annee', $annee)->first();

            if (!$setting) {
                return response()->json(['message' => 'Aucune configuration trouvée pour l\'année ' . $annee], 404);
            }
            
            $setting->delete();
            
            $this->logActivity(
                'Paramétrage IR',
                'DELETE',
                "Suppression de la configuration IR de l'année : " . $annee
            );
            
            return response()->json(['success' => true, 'message' => 'Configuration IR supprimée avec succès']);
        } catch (\Exception $e) {
            $this->logActivity(
                'Paramétrage IR',
                'ERROR',
                "Erreur lors de la suppression IR: " . $e->getMessage()
            );
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }
}