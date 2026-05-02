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
            $table->integer('nombre_enfants')->default(0);
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
            
            // Cotisations
            $table->string('cotisation_type')->nullable();
            $table->unsignedBigInteger('cotisation_id')->nullable();
            $table->unsignedBigInteger('cotisation_rubrique_id')->nullable();
            $table->string('cotisation_label')->nullable();
            $table->decimal('cotisation_taux', 5, 2)->nullable();
            
            // RCAR
            $table->unsignedBigInteger('rcar_type_id')->nullable();
            $table->string('rcar_type_label')->nullable();
            $table->decimal('rcar_taux', 5, 2)->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('annee_id')->references('id')->on('salary_years')->onDelete('set null');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
            $table->foreign('grade_id')->references('id')->on('grades')->onDelete('set null');
            $table->foreign('echelle_id')->references('id')->on('echelles')->onDelete('set null');
            $table->foreign('echelon_id')->references('id')->on('echelons')->onDelete('set null');
            $table->foreign('rcar_type_id')->references('id')->on('rcar_types')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};