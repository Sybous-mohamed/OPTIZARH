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
        Schema::create('retraites', function (Blueprint $table) {
            $table->id();
            $table->integer('age_legal_retraite')->default(60);
            $table->string('notification_retraite')->default('6 mois avant');
            $table->integer('duree_prolongation_max')->default(2);
            $table->string('nb_prolongations_max')->default('2 fois');
            $table->boolean('desactiver_rcar')->default(true);
            $table->boolean('maintenir_autres_cotisations')->default(true);
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retraites');
    }
};
