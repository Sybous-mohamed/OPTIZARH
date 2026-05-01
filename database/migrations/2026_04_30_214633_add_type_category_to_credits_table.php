<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('credits', function (Blueprint $table) {
            $table->foreignId('type_id')->constrained('credit_types')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('credit_categories')->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::table('credits', function (Blueprint $table) {
            $table->dropForeign(['type_id']);
            $table->dropForeign(['category_id']);
            $table->dropColumn(['type_id', 'category_id']);
        });
    }
};