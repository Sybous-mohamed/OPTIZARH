<?php 

namespace App\Http\Controllers\RH;  

use App\Http\Controllers\SuperAdmin\EmployeeController as SuperAdminEmployeeController;
use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Employee; 
use Illuminate\Http\Request;
use Carbon\Carbon;

class AllEmployeSalaire extends Controller
{
    private SuperAdminEmployeeController $delegate;

    public function __construct()
    {
        $this->delegate = app(SuperAdminEmployeeController::class);
    }

    public function allEmployeesSalaries()
    {
        try {
            // 1. Njibo ga3 les employés m3a l-user dyalhom (bach nakhdo profile_image o les infos lokhrin)
            $employees = Employee::with('user')
                ->whereHas('user', function($query) {
                    $query->where('role', 'employee');
                })->get();

            $results = [];

            foreach ($employees as $employee) {
                $response = $this->delegate->salaryDashboard($employee->id);
                $data = $response->getData(); 
                
                $birthDate = $employee->date_naissance;
                $age = $birthDate ? Carbon::parse($birthDate)->age : 'N/A';
                
                if (isset($data->salary_details)) {
                    $results[] = [
                        'id'         => $employee->id,
                        'full_name'  => $employee->nom . ' ' . $employee->prenom,
                        'age'        => $age,
                        'grade'      => $employee->grade_name ?? $employee->grade, // Fallback 3la hsab chno 3ndk
                        'statut'     => $employee->statut,
                        'details'    => $data->salary_details,
                        
                        // Les infos personnelles w dyal l-user
                        'info_perso' => [
                            'email'          => $employee->email ?? ($employee->user ? $employee->user->email : ''),
                            'telephone'      => $employee->telephone,
                            'date_embauche'  => $employee->date_embauche ? Carbon::parse($employee->date_embauche)->format('d/m/Y') : 'Non spécifiée',
                            'situation'      => $employee->situation_familiale,
                            'enfants'        => $employee->nombre_enfants,
                            'profile_image'  => $employee->user ? $employee->user->profile_image : null,
                            'company_name'   => $employee->user ? $employee->user->company_name : null,
                            'sector'         => $employee->user ? $employee->user->sector : null,
                        ],

                        // Les infos Administratives w l-grade
                        'admin_info' => [
                            'echelle'  => $employee->echelle,
                            'echelon'  => $employee->echelon,
                            'indice'   => $employee->indice,
                            'salaire'  => $employee->salaire,
                        ],

                        // Détail dyal les retenues (Cotisation / RCAR)
                        'deductions_info' => [
                            'cotisation_label' => $employee->cotisation_label,
                            'cotisation_taux'  => $employee->cotisation_taux,
                            'rcar_label'       => $employee->rcar_type_label,
                            'rcar_taux'        => $employee->rcar_taux,
                        ],

                        // Détails dyal l-crédit
                        'credit_info' => [
                            'montant_credit'       => $employee->montant_credit,
                            'taux_credit'          => $employee->taux_credit,
                            'credit_mensualite'    => $employee->credit_mensualite,
                            'credit_reste_a_payer' => $employee->credit_reste_a_payer,
                            'credit_duree'         => $employee->credit_duree,
                            'date_fin'             => $employee->credit_date_fin,
                        ]
                    ];
                }
            }

            return response()->json($results);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}