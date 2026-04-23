<?php
namespace App\Http\Controllers;
abstract class Controller
{
    // f Controller.php
public function logActivity($titre, $type, $desc) {
    try {
        \App\Models\SuperAdmin\ActivityLog::create([
            'user_id'     => auth()->id() ?? 1, 
            'titre'       => $titre,
            'action_type' => $type, 
            'description' => $desc,
            'annee'       => date('Y'),
        ]);
    } catch (\Exception $e) {
        \Log::error("Log failed: " . $e->getMessage());
    }
}

}