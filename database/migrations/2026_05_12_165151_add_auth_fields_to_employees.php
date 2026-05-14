<?php
// database/migrations/2026_01_15_000001_add_auth_fields_to_employees.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('temp_password')->nullable()->after('user_id');
            $table->timestamp('credentials_sent_at')->nullable()->after('temp_password');
        });
    }

    public function down()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['temp_password', 'credentials_sent_at']);
        });
    }
};