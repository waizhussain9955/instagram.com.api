<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DownloadLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Pool;

class DownloadController extends Controller
{
    public function single(Request $request)
    {
        @set_time_limit(90);
        $request->validate([
            'url' => 'required|url'
        ]);

        $url = $request->input('url');
        $source = $request->route()->named('plugin.*') ? 'plugin_single' : 'web';
        $userId = $request->input('api_user_id', null);

        // Call the FastAPI scraper internally
        try {
            $scraperUrl = env('SCRAPER_SERVICE_URL', 'http://localhost:8080') . '/api/v1/scrape/single';
            $response = Http::timeout(60)->post($scraperUrl, ['url' => $url]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Log success
                DownloadLog::create([
                    'user_id' => $userId,
                    'source' => $source,
                    'request_url' => $url,
                    'media_type' => $data['media_type'] ?? 'unknown',
                    'status' => 'success',
                ]);

                return response()->json($data);
            }

            // Log failure
            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => $url,
                'status' => 'failed',
            ]);

            return response()->json(['error' => 'Failed to fetch media from Instagram'], 500);

        } catch (\Exception $e) {
            Log::error('Scraper Error: ' . $e->getMessage());
            
            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => $url,
                'status' => 'failed',
            ]);

            return response()->json(['error' => 'Internal server error during scraping'], 500);
        }
    }

    public function proxy(Request $request)
    {
        $url = $request->query('url');
        if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'Invalid media URL'], 400);
        }

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->timeout(60)->get($url);

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to download media file from Instagram source'], 502);
            }

            $contentType = $response->header('Content-Type') ?: 'application/octet-stream';
            
            $extension = 'bin';
            if (str_contains($contentType, 'image/jpeg') || str_contains($url, '.jpg')) {
                $extension = 'jpg';
            } elseif (str_contains($contentType, 'image/png') || str_contains($url, '.png')) {
                $extension = 'png';
            } elseif (str_contains($contentType, 'image/webp') || str_contains($url, '.webp')) {
                $extension = 'webp';
            } elseif (str_contains($contentType, 'video/mp4') || str_contains($url, '.mp4')) {
                $extension = 'mp4';
            }

            $filename = 'instagram_media_' . time() . '.' . $extension;

            return response($response->body(), 200, [
                'Content-Type' => $contentType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Access-Control-Allow-Origin' => '*'
            ]);

        } catch (\Exception $e) {
            Log::error('Proxy download error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to download media: ' . $e->getMessage()], 500);
        }
    }
    
    public function stories(Request $request)
    {
        @set_time_limit(300);
        $request->validate([
            'username' => 'required|string'
        ]);

        $username = preg_replace('/[^a-zA-Z0-9_\.]/', '', $request->input('username'));
        $source = $request->route()->named('plugin.*') ? 'plugin_stories' : 'web';
        $userId = $request->input('api_user_id', null);

        try {
            $scraperUrl = env('SCRAPER_SERVICE_URL', 'http://localhost:8080') . '/api/v1/scrape/stories';
            $response = Http::timeout(120)->post($scraperUrl, ['username' => $username]);

            if ($response->successful()) {
                $data = $response->json();
                
                DownloadLog::create([
                    'user_id' => $userId,
                    'source' => $source,
                    'request_url' => 'stories://' . $username,
                    'media_type' => 'story',
                    'status' => 'success',
                ]);

                return response()->json($data);
            }

            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => 'stories://' . $username,
                'status' => 'failed',
            ]);

            $errorMsg = 'Failed to fetch stories from Instagram';
            $errorData = $response->json();
            if (isset($errorData['detail'])) {
                $errorMsg = $errorData['detail'];
            }
            return response()->json(['error' => $errorMsg], 500);

        } catch (\Exception $e) {
            Log::error('Scraper Stories Error: ' . $e->getMessage());
            
            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => 'stories://' . $username,
                'status' => 'failed',
            ]);

            return response()->json(['error' => 'Internal server error during scraping stories'], 500);
        }
    }

    public function bulkFetch(Request $request)
    {
        @set_time_limit(300);
        $request->validate([
            'username' => 'required|string',
            'limit' => 'integer|min:1|max:50'
        ]);

        $username = preg_replace('/[^a-zA-Z0-9_\.]/', '', $request->input('username'));
        $limit = $request->input('limit', 10);
        $source = $request->route()->named('plugin.*') ? 'plugin_bulk' : 'web';
        $userId = $request->input('api_user_id', null);

        try {
            $scraperUrl = env('SCRAPER_SERVICE_URL', 'http://localhost:8080') . '/api/v1/scrape/profile-posts';
            $response = Http::timeout(250)->post($scraperUrl, [
                'username' => $username,
                'limit' => $limit
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                DownloadLog::create([
                    'user_id' => $userId,
                    'source' => $source,
                    'request_url' => 'profile://' . $username,
                    'media_type' => 'profile_posts',
                    'status' => 'success',
                ]);

                return response()->json($data);
            }

            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => 'profile://' . $username,
                'status' => 'failed',
            ]);

            $errorMsg = 'Failed to fetch profile posts from Instagram';
            $errorData = $response->json();
            if (isset($errorData['detail'])) {
                $errorMsg = $errorData['detail'];
            }
            return response()->json(['error' => $errorMsg], 500);

        } catch (\Exception $e) {
            Log::error('Scraper Profile Posts Error: ' . $e->getMessage());
            
            DownloadLog::create([
                'user_id' => $userId,
                'source' => $source,
                'request_url' => 'profile://' . $username,
                'status' => 'failed',
            ]);

            return response()->json(['error' => 'Internal server error during scraping profile posts'], 500);
        }
    }

    public function zip(Request $request)
    {
        @set_time_limit(240);
        @ini_set('memory_limit', '512M');
        
        $request->validate([
            'username' => 'required|string',
            'media' => 'required|array',
            'media.*.id' => 'nullable|string',
            'media.*.url' => 'required|url',
            'media.*.type' => 'required|string'
        ]);

        $username = preg_replace('/[^a-zA-Z0-9_\.]/', '', $request->input('username'));
        $mediaItems = $request->input('media');

        $tempDir = null;
        $tempFiles = [];

        try {
            $zipDir = storage_path('app/public/zips');
            if (!file_exists($zipDir)) {
                mkdir($zipDir, 0755, true);
            }

            // Create a unique temporary directory for storing raw files before archiving
            $tempDir = storage_path('app/zips_temp/' . uniqid('zip_temp_', true));
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $zipFilename = $username . '_downloads_' . time() . '.zip';
            $zipPath = $zipDir . '/' . $zipFilename;

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                return response()->json(['error' => 'Could not create ZIP file archive'], 500);
            }

            $count = 0;

            // 1. Resolve video URLs concurrently via scraper (checking Cache first)
            $resolveKeys = [];
            foreach ($mediaItems as $index => $item) {
                if ($item['type'] === 'video' && !empty($item['id'])) {
                    $cacheKey = 'ig_video_url_' . $item['id'];
                    $cachedUrl = \Illuminate\Support\Facades\Cache::get($cacheKey);
                    if ($cachedUrl) {
                        $mediaItems[$index]['url'] = $cachedUrl;
                    } else {
                        $resolveKeys[] = $index;
                    }
                }
            }

            if (count($resolveKeys) > 0) {
                try {
                    $singleUrl = env('SCRAPER_SERVICE_URL', 'http://localhost:8080') . '/api/v1/scrape/single';
                    $chunks = array_chunk($resolveKeys, 10); // Process resolutions in chunks of 10
                    
                    foreach ($chunks as $chunkIndex => $chunkKeys) {
                        if ($chunkIndex > 0) {
                            sleep(1); // Stagger requests to avoid Instagram rate limit spikes
                        }
                        
                        $resolveResponses = Http::pool(function (Pool $pool) use ($chunkKeys, $mediaItems, $singleUrl) {
                            foreach ($chunkKeys as $key) {
                                $item = $mediaItems[$key];
                                $pool->timeout(20)->post($singleUrl, [
                                    'url' => 'https://www.instagram.com/p/' . $item['id'] . '/'
                                ]);
                            }
                        });

                        // Update the mediaItems URLs and cache them
                        foreach ($chunkKeys as $i => $key) {
                            $res = $resolveResponses[$i] ?? null;
                            if ($res instanceof \Illuminate\Http\Client\Response && $res->successful()) {
                                $resData = $res->json();
                                if (!empty($resData['media']) && count($resData['media']) > 0) {
                                    $resolvedUrl = $resData['media'][0]['url'];
                                    $mediaItems[$key]['url'] = $resolvedUrl;
                                    
                                    // Cache the resolved URL for 4 hours
                                    $cacheKey = 'ig_video_url_' . $mediaItems[$key]['id'];
                                    \Illuminate\Support\Facades\Cache::put($cacheKey, $resolvedUrl, 14400);
                                }
                            }
                        }
                    }
                } catch (\Exception $ex) {
                    Log::warning("Failed to resolve video shortcodes in parallel ZIP generation: " . $ex->getMessage());
                }
            }

            // 2. Download and package media items in chunks of 10 to conserve memory and network resources
            $downloadChunks = array_chunk($mediaItems, 10);
            $globalIndex = 0;
            foreach ($downloadChunks as $chunk) {
                $downloads = Http::pool(function (Pool $pool) use ($chunk) {
                    foreach ($chunk as $item) {
                        $pool->withoutVerifying()->withHeaders([
                            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        ])->timeout(45)->get($item['url']);
                    }
                });

                foreach ($chunk as $chunkIndex => $item) {
                    $response = $downloads[$chunkIndex] ?? null;
                    if ($response instanceof \Illuminate\Http\Client\Response && $response->successful()) {
                        $contentType = $response->header('Content-Type') ?: 'application/octet-stream';
                        $url = $item['url'];
                        
                        $extension = 'bin';
                        if (str_contains($contentType, 'image/jpeg') || str_contains($url, '.jpg')) {
                            $extension = 'jpg';
                        } elseif (str_contains($contentType, 'image/png') || str_contains($url, '.png')) {
                            $extension = 'png';
                        } elseif (str_contains($contentType, 'image/webp') || str_contains($url, '.webp')) {
                            $extension = 'webp';
                        } elseif (str_contains($contentType, 'video/mp4') || str_contains($url, '.mp4')) {
                            $extension = 'mp4';
                        }

                        $filename = 'media_' . ($globalIndex + 1) . '.' . $extension;
                        $tempFilePath = $tempDir . '/' . $filename;
                        
                        // Write downloaded content to disk to avoid storing massive files in PHP memory
                        file_put_contents($tempFilePath, $response->body());
                        
                        // Reference file on disk in the ZIP archive
                        $zip->addFile($tempFilePath, $filename);
                        
                        $tempFiles[] = $tempFilePath;
                        $count++;
                    }
                    $globalIndex++;
                }
                unset($downloads);
            }

            $zip->close();

            if ($count === 0) {
                @unlink($zipPath);
                return response()->json(['error' => 'Could not download any media files to package into ZIP'], 500);
            }

            $zipUrl = asset('storage/zips/' . $zipFilename);

            return response()->json([
                'success' => true,
                'zip_url' => $zipUrl
            ]);

        } catch (\Exception $e) {
            Log::error('ZIP generation error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error generating ZIP: ' . $e->getMessage()], 500);
        } finally {
            // Clean up temporary files on disk
            foreach ($tempFiles as $tempFile) {
                if (file_exists($tempFile)) {
                    @unlink($tempFile);
                }
            }
            if ($tempDir && file_exists($tempDir)) {
                @rmdir($tempDir);
            }
        }
    }
    
    public function bulk(Request $request)
    {
        $request->validate([
            'profile_url' => 'required|url',
            'limit' => 'integer|min:1|max:50'
        ]);
        
        return response()->json([
            'message' => 'Bulk download queued',
            'job_id' => uniqid('job_')
        ]);
    }
}
