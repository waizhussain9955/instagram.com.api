<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ApiKey;

class VerifyApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('X-API-Key');

        if (!$key) {
            return response()->json(['error' => 'API Key missing'], 401);
        }

        $apiKey = ApiKey::where('key', $key)->where('is_active', true)->first();

        if (!$apiKey) {
            return response()->json(['error' => 'Invalid or inactive API Key'], 401);
        }

        // Attach user ID for tracking
        $request->merge(['api_user_id' => $apiKey->user_id]);

        return $next($request);
    }
}
