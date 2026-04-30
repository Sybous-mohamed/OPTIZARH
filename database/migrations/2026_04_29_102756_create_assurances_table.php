<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('assurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('annee_id')->constrained('salary_years')->onDelete('cascade');
            $table->string('name'); // CNSS, ONFAM, CIMR, etc.
            $table->string('code')->unique(); // Code assurance
            $table->string('type')->default('sociale'); // sociale, sante, retraite
            $table->boolean('is_active')->default(true);
            $table->boolean('is_obligatoire')->default(true);
            $table->decimal('taux_salarie', 5, 2)->default(0); // % employé
            $table->decimal('taux_employeur', 5, 2)->default(0); // % employeur
            $table->decimal('plafond_mensuel', 15, 2)->nullable(); // Plafond
            $table->decimal('plafond_annuel', 15, 2)->nullable(); // Plafond annuel
            $table->text('description')->nullable();
            $table->json('bareme')->nullable(); // Barème progressif
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('assurances');
    }
};