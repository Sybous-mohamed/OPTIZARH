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
        Schema::create('organisme', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); 
            $table->integer('annee'); 
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
            $table->boolean('is_default')->default(0)->after('is_favorite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organisme');
    }
};