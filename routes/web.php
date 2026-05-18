<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

Route::get('/login', function () {
    return redirect('/auth/login');
})->name('login');

Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    if (!file_exists($fullPath)) {
        abort(404, 'Fichier non trouvé: ' . $path);
    }
    
    $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'pdf' => 'application/pdf',
    ];
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    
    return response()->file($fullPath, ['Content-Type' => $mimeType]);
})->where('path', '.*');