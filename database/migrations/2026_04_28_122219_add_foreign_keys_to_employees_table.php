<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Vérifier si les tables existent avant d'ajouter les foreign keys
            if (Schema::hasTable('salary_years')) {
                $table->foreign('annee_id')->references('id')->on('salary_years')->onDelete('set null');
            }
            if (Schema::hasTable('roles')) {
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
            }
            if (Schema::hasTable('grades')) {
                $table->foreign('grade_id')->references('id')->on('grades')->onDelete('set null');
            }
            if (Schema::hasTable('echelles')) {
                $table->foreign('echelle_id')->references('id')->on('echelles')->onDelete('set null');
            }
            if (Schema::hasTable('echelons')) {
                $table->foreign('echelon_id')->references('id')->on('echelons')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['annee_id']);
            $table->dropForeign(['role_id']);
            $table->dropForeign(['grade_id']);
            $table->dropForeign(['echelle_id']);
            $table->dropForeign(['echelon_id']);
        });
    }
};