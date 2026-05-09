<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_credits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('credit_type_id')->nullable();
            $table->decimal('montant_credit', 15, 2)->nullable();
            $table->decimal('taux_credit', 5, 2)->nullable();
            $table->integer('credit_duree')->nullable();
            $table->date('credit_date_debut')->nullable();
            $table->date('credit_date_fin')->nullable();
            $table->decimal('credit_mensualite', 15, 2)->nullable();
            $table->decimal('credit_reste_a_payer', 15, 2)->nullable();
            $table->string('statut')->default('ACTIF');
            $table->timestamps();
            
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('credit_type_id')->references('id')->on('credit_types')->onDelete('set null');
            
            $table->index('employee_id');
            $table->index('statut');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_credits');
    }
};