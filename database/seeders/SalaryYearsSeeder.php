<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\SuperAdmin\SalaryYear;

class SalaryYearsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Création des années 2015 à 2035...');
        
        $created = 0;
        $existing = 0;
        
        for ($year = 2015; $year <= 2035; $year++) {
            $result = SalaryYear::firstOrCreate(
                ['year' => $year],
                ['is_active' => true]
            );
            
            if ($result->wasRecentlyCreated) {
                $created++;
            } else {
                $existing++;
            }
        }
        
        $this->command->info("✅ $created années créées, $existing années existantes");
    }
}