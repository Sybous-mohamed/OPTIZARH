<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('assurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('annee_id')->constrained('salary_years')->onDelete('cascade');
            $table->string('name');
             $table->string('code')->nullable()->change();
            $table->boolean('is_active')->default(true);
            $table->decimal('taux_salarie', 5, 2)->default(0);
            $table->decimal('plafond_mensuel', 15, 2)->nullable();
            $table->timestamps();
            
            $table->index(['annee_id', 'code']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('assurances');
    }
};