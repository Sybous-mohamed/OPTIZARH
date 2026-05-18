// database/migrations/2026_05_10_create_employee_salaries_table.php

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('annee_id')->nullable();
            $table->integer('year');
            $table->integer('month')->nullable();
            
            // Salaire
            $table->decimal('base_salary', 15, 2)->default(0);
            $table->decimal('indemnites_total', 15, 2)->default(0);
            $table->decimal('brut_salary', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            
            // Déductions
            $table->decimal('cotisations_total', 15, 2)->default(0);
            $table->decimal('rcar_total', 15, 2)->default(0);
            $table->decimal('ir_total', 15, 2)->default(0);
            $table->decimal('sntl_total', 15, 2)->default(0);
            $table->decimal('assurances_salarie', 15, 2)->default(0);
            $table->decimal('credits_total', 15, 2)->default(0);
            $table->decimal('total_deductions', 15, 2)->default(0);
            $table->decimal('ir_taux', 5, 2)->default(0)->after('ir_total');
            
            // Détails en JSON (optionnel)
            $table->json('indemnites_details')->nullable();
            $table->json('cotisations_details')->nullable();
            $table->json('rcar_details')->nullable();
            $table->json('sntl_details')->nullable();
            $table->json('assurances_details')->nullable();
            $table->json('credits_details')->nullable();
            
            $table->timestamps();
            
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('annee_id')->references('id')->on('salary_years')->onDelete('set null');
            
            $table->unique(['employee_id', 'year', 'month']);
        });
    }
    
    public function down()
    {
        Schema::dropIfExists('employee_salaries');
    }
};