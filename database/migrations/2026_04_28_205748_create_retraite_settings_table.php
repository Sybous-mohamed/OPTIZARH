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
        Schema::create('retraite_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique(); 
            $table->integer('age_legal')->default(60);
            $table->integer('duree_max')->default(0);
            $table->integer('nb_fois')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retraite_settings');
    }
};
