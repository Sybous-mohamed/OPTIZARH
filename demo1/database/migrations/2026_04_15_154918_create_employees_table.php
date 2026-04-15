<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up() {
    Schema::create('employees', function (Blueprint $table) {
        $table->id();
        $table->string('prenom');
        $table->string('nom');
        $table->string('email')->unique();
        $table->string('telephone');
        $table->date('date_naissance');
        $table->string('adresse');
        $table->string('situation_familiale');
        $table->string('departement');
        $table->date('date_embauche');
        $table->string('poste');
        $table->string('type_contrat');
        $table->string('grade');
        $table->string('echelle');
        $table->string('echelon');
        $table->string('statut')->default('ACTIF');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
