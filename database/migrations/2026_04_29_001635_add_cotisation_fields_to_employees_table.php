<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('employees', function (Blueprint $table) {
        $table->string('cotisation_type')->nullable();
        $table->unsignedBigInteger('cotisation_id')->nullable();
        $table->unsignedBigInteger('cotisation_rubrique_id')->nullable();
        $table->string('cotisation_label')->nullable();
        $table->decimal('cotisation_taux', 5, 2)->nullable();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            //
        });
    }
};
