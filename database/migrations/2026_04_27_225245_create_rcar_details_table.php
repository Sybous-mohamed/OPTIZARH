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
        Schema::create('rcar_details', function (Blueprint $table) {
            $table->id();
            // Foreign key pointing to rcar_types
            $table->foreignId('rcar_type_id')->constrained('rcar_types')->onDelete('cascade');
            $table->string('designation'); // Ex: 'RG'
            $table->decimal('plafond', 15, 2)->nullable(); // Ex: 211.00
            $table->decimal('percentage', 5, 2); // Ex: 3.00
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rcar_details');
    }
};