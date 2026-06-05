<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DownloadController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

use App\Http\Controllers\Api\AdminController;

// Public Web API
Route::prefix('v1')->group(function () {
    Route::post('/download/single', [DownloadController::class, 'single'])->name('web.download.single');
    Route::get('/download/proxy', [DownloadController::class, 'proxy'])->name('web.download.proxy');
    Route::post('/download/stories', [DownloadController::class, 'stories'])->name('web.download.stories');
    Route::post('/download/bulk-fetch', [DownloadController::class, 'bulkFetch'])->name('web.download.bulk_fetch');
    Route::post('/download/zip', [DownloadController::class, 'zip'])->name('web.download.zip');
    Route::post('/download/bulk', [DownloadController::class, 'bulk'])->name('web.download.bulk');
    
    // Auth, Setup & Admin Protected Routes (Stateful via web middleware)
    Route::middleware('web')->group(function () {
        Route::post('/auth/login', [AdminController::class, 'login']);
        Route::get('/setup/status', [AdminController::class, 'getSetupStatus']);
        Route::post('/setup/complete', [AdminController::class, 'completeSetup']);

        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/keys', [AdminController::class, 'listKeys']);
            Route::post('/keys', [AdminController::class, 'createKey']);
            Route::delete('/keys/{id}', [AdminController::class, 'deleteKey']);
            Route::post('/blog', [AdminController::class, 'createBlogPost']);
        });
    });

    // Public Blog
    Route::get('/blog', [AdminController::class, 'listBlogPosts']);
    Route::get('/blog/{slug}', [AdminController::class, 'getBlogPost']);
});

// WordPress Plugin API (Protected by API Key)
Route::prefix('v1/plugin')->middleware('api.key')->group(function () {
    Route::post('/download/single', [DownloadController::class, 'single'])->name('plugin.download.single');
    Route::post('/download/bulk-fetch', [DownloadController::class, 'bulkFetch'])->name('plugin.download.bulk_fetch');
    Route::post('/download/zip', [DownloadController::class, 'zip'])->name('plugin.download.zip');
    Route::post('/download/bulk', [DownloadController::class, 'bulk'])->name('plugin.download.bulk');
});
