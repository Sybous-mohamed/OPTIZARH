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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('salary_year_id')->nullable()->after('leave_type_id')->constrained('salary_years')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types'); 
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('duration')->default(0);
            $table->text('comments')->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])->default('PENDING');
            $table->string('attachment_path')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->text('hr_note')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
