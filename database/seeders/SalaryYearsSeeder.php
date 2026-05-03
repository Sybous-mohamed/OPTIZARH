<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\SuperAdmin\SalaryYear;

class SalaryYearsSeeder extends Seeder
{
    public function run(): void
    {
        $currentYear = date('Y');
        $startYear = $currentYear - 10;
        $endYear = $currentYear + 10;

        $this->command->info("Création des années de {$startYear} à {$endYear}...");
        $this->command->info("Année actuelle: {$currentYear}");

        $created = 0;
        $existing = 0;

        for ($year = $startYear; $year <= $endYear; $year++) {
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

        $this->command->info("$created années créées, $existing années existantes");
        $this->command->info(" Plage d'années: {$startYear} - {$endYear}");
    }
}