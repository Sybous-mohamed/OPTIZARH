<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

<<<<<<< HEAD
return new class extends Migration
{
public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('full_name');
        $table->string('email')->unique();
        $table->string('password');
        $table->string('company_name')->nullable();
        $table->string('sector')->nullable();
        $table->integer('employee_count')->nullable();
        $table->string('role')->default('admin');
        $table->timestamp('email_verified_at')->nullable();
        $table->text('profile_image')->nullable();
        $table->string('theme')->default('light');   
        $table->string('language')->default('en');
        $table->boolean('is_blocked')->default(false);
        $table->boolean('must_change_password')->default(false);
        $table->rememberToken(); 
        $table->timestamps();
    });
}
    
=======
return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('company_name')->nullable();
            $table->string('sector')->nullable();
            $table->integer('employee_count')->nullable();
            $table->string('role')->default('admin');
            $table->timestamp('email_verified_at')->nullable();
            $table->text('profile_image')->nullable();
            $table->string('theme')->default('light');
            $table->string('language')->default('en');
            $table->boolean('is_blocked')->default(false);
            $table->boolean('must_change_password')->default(false);
            $table->rememberToken();
            $table->timestamps();
        });
    }

>>>>>>> bouray/main

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};