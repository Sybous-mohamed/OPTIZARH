<?php
<<<<<<< HEAD

=======
>>>>>>> bouray/main
namespace App\Http\Controllers\SuperAdmin;

use App\Models\SuperAdmin\ActivityLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller; 

<<<<<<< HEAD
class ActivityLogController extends Controller
{
=======
class ActivityLogController extends Controller{
>>>>>>> bouray/main
    public function index(Request $request){
        $limit = $request->query('limit', 10);
        $logs = ActivityLog::with('user')->orderBy('created_at', 'desc')->paginate($limit);
        return response()->json($logs);
    }

<<<<<<< HEAD
    public function destroy($id)
    {
=======
    public function destroy($id){
>>>>>>> bouray/main
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