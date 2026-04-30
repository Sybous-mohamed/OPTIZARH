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
        Schema::create('rcar_types', function (Blueprint $table) {
            $table->id();
            // Foreign key pointing to your existing salary_year table
            $table->foreignId('salary_year_id')->constrained('salary_years')->onDelete('cascade');
            $table->string('label'); // Ex: 'Patronale' or 'Salariale'
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rcar_types');
    }
};