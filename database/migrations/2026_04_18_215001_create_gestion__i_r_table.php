<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('gestion_IR', function (Blueprint $table) {
            $table->id();
            $table->integer('annee')->unique();
            $table->json('data_rows');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('gestion_ir');
    }
};