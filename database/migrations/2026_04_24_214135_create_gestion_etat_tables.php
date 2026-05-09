<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Years
        Schema::create('salary_years', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Roles
        Schema::create('Post', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_year_id')->constrained('salary_years')->onDelete('cascade');
            $table->string('name');
            $table->boolean('is_starred')->default(false);
            $table->index('is_starred');
            $table->timestamps();
        });

        // 3. Grades
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('Post_id')->constrained('Post')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        // 4. Echelles
        Schema::create('echelles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained('grades')->onDelete('cascade');
            $table->string('level'); 
            $table->timestamps();
        });

        // 5. Echelons
        Schema::create('echelons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('echelle_id')->constrained('echelles')->onDelete('cascade');
            $table->integer('order');
            $table->integer('index_val');
            $table->decimal('salary', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('echelons');
        Schema::dropIfExists('echelles');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('Post');
        Schema::dropIfExists('salary_years');
    }
};