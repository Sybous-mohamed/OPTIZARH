<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request){
        $limit = $request->query('limit', 10);

        $logs = ActivityLog::orderBy('created_at', 'desc')->paginate($limit);

        return response()->json($logs);
    }
}

