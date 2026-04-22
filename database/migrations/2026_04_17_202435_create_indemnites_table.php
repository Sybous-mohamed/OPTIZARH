<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

  public function up(): void{Schema::create('indemnites', function (Blueprint $table) {
    $table->id();$table->string('nom');
    $table->enum('type', ['FIXE', 'POURCENTAGE', 'VARIABLE']);
    $table->decimal('valeur', 10, 2)
    ;$table->integer('annee')->default(2026);
    $table->boolean('tous_employes')->default(false);
    $table->string('grade')->nullable();
    $table->integer('echelle')->nullable();
    $table->integer('echelon')->nullable();
    $table->boolean('statut')->default(true);
    $table->timestamps(); });
}

  public function down(): void{Schema::dropIfExists('indemnites');}
};