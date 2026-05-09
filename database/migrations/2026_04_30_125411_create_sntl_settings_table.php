<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void{
        Schema::create('sntl_settings', function (Blueprint $table) {
            $table->id();
            $table->string('label'); 
            $table->decimal('valeur', 10, 2);
            $table->enum('type_montant', ['fixe', 'pourcentage']);
            $table->enum('categorie_cible', ['tous', 'cadres']);

            // Foreign Keys dyal la structure li derti
            $table->foreignId('salary_year_id')->constrained('salary_years')->onDelete('cascade');
            
            // Nullable hit t9der tkon categorie "tous"
            $table->foreignId('Post_id')->nullable()->constrained('Post')->onDelete('set null');
            $table->foreignId('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignId('echelle_id')->nullable()->constrained('echelles')->onDelete('set null');
            $table->foreignId('echelon_id')->nullable()->constrained('echelons')->onDelete('set null');

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sntl_settings');
    }
};