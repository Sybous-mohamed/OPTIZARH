<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void{
            Schema::create('leave_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('salary_year_id')->constrained('salary_years')->onDelete('cascade');
                $table->string('category_name');
                $table->integer('annual_global_max')->default(0);
                $table->timestamps();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_settings');
    }
};
