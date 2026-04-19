<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up(){
        Schema::create('cotisation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisme_id')->constrained()->onDelete('cascade');
            
            $table->integer('year');            
            $table->decimal('taux', 5, 2);      
            $table->decimal('plafond', 10, 2)->nullable(); 
            $table->boolean('mgpap')->default(false);
            $table->boolean('omfam')->default(false);
            $table->date('derniere_maj')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cotisation_rules');
    }
};
