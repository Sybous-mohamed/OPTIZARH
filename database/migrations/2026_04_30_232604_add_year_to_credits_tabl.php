<?php
// database/migrations/2026_05_01_000001_add_fields_to_credits_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credits', function (Blueprint $table) {
            // Ajouter description d'abord
            $table->text('description')->nullable()->after('max_duration');
            // Puis ajouter year
            $table->integer('year')->nullable()->after('description');
            $table->index('year');
        });
    }

    public function down(): void
    {
        Schema::table('credits', function (Blueprint $table) {
            $table->dropColumn(['description', 'year']);
        });
    }
};