<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('credit_type_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_type_id')->constrained('credit_types')->onDelete('cascade');
            $table->foreignId('credit_category_id')->constrained('credit_categories')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['credit_type_id', 'credit_category_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('credit_type_category');
    }
};