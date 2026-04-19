<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('parametrage_rcars', function (Blueprint $table) {
            $table->id();
            $table->string('annee', 4)->unique();
            
            // Part Salariale
            $table->boolean('salariale_active')->default(true);
            $table->decimal('salariale_rg_taux', 5, 2)->default(0); 
            $table->decimal('salariale_rc_taux', 5, 2)->default(0); 
            $table->decimal('salariale_rg_plafond', 15, 2)->nullable();
            $table->decimal('salariale_rc_plafond', 15, 2)->nullable();
            
            // Part Patronale
            $table->boolean('patronale_active')->default(true);
            $table->decimal('patronale_rg_taux', 5, 2)->default(0); 
            $table->decimal('patronale_rc_taux', 5, 2)->default(0); 
            $table->decimal('patronale_rg_plafond', 15, 2)->nullable();
            $table->decimal('patronale_rc_plafond', 15, 2)->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('parametrage_rcars');
    }
};