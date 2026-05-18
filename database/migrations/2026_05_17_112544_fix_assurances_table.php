<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assurances', function (Blueprint $table) {
            // Rendre code nullable (SQLite ne supporte pas dropColumn facilement)
            $table->string('code')->nullable()->change();

            // Supprimer taux_employeur si elle existe
            if (Schema::hasColumn('assurances', 'taux_employeur')) {
                $table->dropColumn('taux_employeur');
            }
        });
    }

    public function down(): void
    {
        Schema::table('assurances', function (Blueprint $table) {
            $table->string('code')->nullable(false)->default('')->change();

            if (!Schema::hasColumn('assurances', 'taux_employeur')) {
                $table->decimal('taux_employeur', 5, 2)->default(0);
            }
        });
    }
};