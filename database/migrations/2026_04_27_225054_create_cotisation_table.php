<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(){
        Schema::create('cotisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisme_id')->constrained('organisme')->onDelete('cascade');
            $table->string('name'); 
            $table->decimal('taux', 5, 2); 
            $table->decimal('plafond', 10, 2)->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('cotisations');
    }
};