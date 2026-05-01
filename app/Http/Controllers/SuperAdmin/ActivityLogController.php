<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\ActivityLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller; 

class ActivityLogController extends Controller
{
    public function index(Request $request){
        $limit = $request->query('limit', 10);
        $logs = ActivityLog::with('user')->orderBy('created_at', 'desc')->paginate($limit);
        return response()->json($logs);
    }

    public function destroy($id)
    {
        try {
            $log = ActivityLog::find($id);
            if (!$log) {
                return response()->json([
                    'message' => 'Activité introuvable.'
                ], 404);
            }
            $log->delete();
            return response()->json([
                'message' => 'Log supprimé avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}