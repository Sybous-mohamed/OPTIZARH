<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credits', function (Blueprint $table) {
            $table->id(); 
            $table->string('name'); 
            $table->foreignId('type_id')->constrained('credit_types')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('credit_categories')->onDelete('restrict');
            $table->decimal('max_amount', 15, 2); 
            $table->decimal('interest_rate', 5, 2);
            $table->integer('max_duration'); 
            $table->text('description')->nullable();
            $table->integer('year')->nullable();
            $table->enum('status', ['Actif', 'En Révision', 'Inactif'])->default('Actif');
            $table->timestamps();
            $table->index('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credits');
    }
};