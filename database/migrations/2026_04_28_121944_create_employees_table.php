<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('prenom');
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('adresse')->nullable();
            $table->string('situation_familiale')->nullable();
            $table->string('departement')->nullable();
            $table->date('date_embauche')->nullable();
            $table->string('poste')->nullable();
            $table->string('type_contrat')->nullable();
            
            // IDs pour la classification
            $table->unsignedBigInteger('annee_id')->nullable();
            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('echelle_id')->nullable();
            $table->unsignedBigInteger('echelon_id')->nullable();
            
            // Pour affichage
            $table->string('grade')->nullable();
            $table->string('echelle')->nullable();
            $table->string('echelon')->nullable();
            $table->decimal('salaire', 15, 2)->nullable();
            $table->decimal('indice', 10, 2)->nullable();
            
            $table->string('statut')->default('ACTIF');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};