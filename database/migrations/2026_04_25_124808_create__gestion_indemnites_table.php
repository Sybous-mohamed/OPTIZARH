<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gestion_indemnites', function (Blueprint $table) {
            $table->id();
            $table->string('libelle'); 
            $table->enum('type', ['Fixe', 'Pourcentage'])->default('Fixe');
            $table->decimal('valeur', 15, 2);
        
            $table->foreignId('salary_year_id')
                  ->constrained('salary_years')
                  ->onDelete('cascade');

            $table->foreignId('role_id')
                  ->nullable() 
                  ->constrained('roles')
                  ->onDelete('cascade');

            $table->foreignId('grade_id')
                  ->nullable()
                  ->constrained('grades')
                  ->onDelete('cascade');

            $table->foreignId('echelle_id')
                  ->nullable()
                  ->constrained('echelles')
                  ->onDelete('cascade');

            $table->foreignId('echelon_id')
                  ->nullable()
                  ->constrained('echelons')
                  ->onDelete('cascade');

            $table->boolean('is_for_all')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gestion_indemnites');
    }
};