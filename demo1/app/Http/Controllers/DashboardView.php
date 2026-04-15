<?php 


namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class DashboardView extends Controller
{
    function viewDashboard(Request $request)
    {
        return $request->all();
    }


}
