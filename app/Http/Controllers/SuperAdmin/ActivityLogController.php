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
}