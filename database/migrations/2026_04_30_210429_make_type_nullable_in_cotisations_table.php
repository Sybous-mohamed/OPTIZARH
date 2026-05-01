<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('cotisations', function (Blueprint $table) {
            // Rendre la colonne type nullable
            $table->string('type')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('cotisations', function (Blueprint $table) {
            $table->string('type')->nullable(false)->change();
        });
    }
};