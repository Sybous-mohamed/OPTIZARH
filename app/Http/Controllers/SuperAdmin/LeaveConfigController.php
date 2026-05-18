<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\LeaveSetting;
use App\Models\SuperAdmin\LeaveType;
use App\Models\SuperAdmin\SalaryYear;

class LeaveConfigController extends Controller
{
    // 1. Jib ga3 l-Categories b-les Types dyalhom f-marra
    public function getFullConfig($yearId)
    {
        $categories = LeaveSetting::with('types')
            ->where('salary_year_id', $yearId)
            ->get();
        return response()->json($categories);
    }

    // 2. Save Category (LeaveSetting)
    public function saveCategory(Request $request){
        $request->validate([
            'salary_year_id' => 'required',
            'category_name' => 'required|string', // Check hna
            'annual_global_max' => 'required|integer',
        ]);

        $category = LeaveSetting::updateOrCreate(
            [
                'salary_year_id' => $request->salary_year_id, 
                'category_name' => $request->category_name // Check hna
            ],
            ['annual_global_max' => $request->annual_global_max]
        );

        return response()->json($category);
    }

    // 3. Store Type (LeaveType) linked to Category
    public function storeType(Request $request)
    {
        $request->validate([
            'salary_year_id' => 'required|exists:salary_years,id',
            'leave_category_id' => 'required|exists:leave_settings,id', // Darouri l-rbet
            'name' => 'required|string',
            'max_days_per_request' => 'required|integer|min:0',
        ]);

        $type = LeaveType::create([
            'salary_year_id' => $request->salary_year_id,
            'leave_category_id' => $request->leave_category_id,
            'name' => $request->name,
            'max_days_per_request' => $request->max_days_per_request
        ]);

        return response()->json(['message' => 'Type ajouté!', 'data' => $type], 201);
    }

    public function destroyCategory($id) {
        LeaveSetting::findOrFail($id)->delete();
        return response()->json(['message' => 'Catégorie supprimée!']);
    }

    public function destroyType($id) {
        LeaveType::findOrFail($id)->delete();
        return response()->json(['message' => 'Type supprimé!']);
    }
}