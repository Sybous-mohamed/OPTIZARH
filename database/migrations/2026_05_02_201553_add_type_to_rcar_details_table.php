<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rcar_details', function (Blueprint $table) {
            $table->enum('type', ['salariale', 'patronale'])->default('salariale')->after('designation');
        });
    }

    public function down(): void
    {
        Schema::table('rcar_details', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};