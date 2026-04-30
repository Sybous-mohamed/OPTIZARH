<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('assurance_tranches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assurance_id')->constrained('assurances')->onDelete('cascade');
            $table->string('tranche_name'); // Tranche A, B, C
            $table->decimal('min_salaire', 15, 2);
            $table->decimal('max_salaire', 15, 2)->nullable();
            $table->decimal('taux_salarie', 5, 2);
            $table->decimal('taux_employeur', 5, 2);
            $table->decimal('plafond', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('assurance_tranches');
    }
};