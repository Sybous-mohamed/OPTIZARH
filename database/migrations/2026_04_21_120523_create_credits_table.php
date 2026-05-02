<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('credits', function (Blueprint $table) {
            $table->id(); 
            $table->string('name'); 
            $table->enum('type', ['Crédit Principal', 'Sous Crédit']); 
            $table->enum('category', ['Immobilier', 'Consommation', 'Transport']);
            $table->decimal('max_amount', 15, 2); 
            $table->decimal('interest_rate', 5, 2);
            $table->integer('max_duration'); 
            $table->enum('status', ['Actif', 'En Révision', 'Inactif'])->default('Actif');
            $table->foreignId('type_id')->constrained('credit_types')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('credit_categories')->onDelete('restrict');
            $table->text('description')->nullable()->after('max_duration');
            $table->integer('year')->nullable()->after('description');
            $table->index('year');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credits');
    }
};
