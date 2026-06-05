<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ApiKey;
use App\Models\Setting;
use App\Models\BlogPost;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            if ($user->role === 'admin') {
                return response()->json([
                    'success' => true,
                    'message' => 'Logged in successfully',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ]
                ]);
            }
            Auth::logout();
            return response()->json(['error' => 'Unauthorized. Admin role required.'], 403);
        }

        return response()->json(['error' => 'Invalid email or password'], 401);
    }

    public function getSetupStatus()
    {
        $setting = Setting::where('key', 'setup_wizard_completed')->first();
        $completed = $setting ? (bool)$setting->value : false;

        return response()->json([
            'completed' => $completed
        ]);
    }

    public function completeSetup(Request $request)
    {
        $request->validate([
            'admin_name' => 'required|string',
            'admin_email' => 'required|email',
            'admin_password' => 'required|string|min:6',
        ]);

        // Create or update admin user
        $admin = User::updateOrCreate(
            ['email' => $request->input('admin_email')],
            [
                'name' => $request->input('admin_name'),
                'password' => Hash::make($request->input('admin_password')),
                'role' => 'admin',
            ]
        );

        // Mark setup wizard as completed
        Setting::updateOrCreate(
            ['key' => 'setup_wizard_completed'],
            ['value' => '1']
        );

        return response()->json([
            'success' => true,
            'message' => 'Setup wizard completed successfully',
            'admin' => [
                'name' => $admin->name,
                'email' => $admin->email
            ]
        ]);
    }

    public function listBlogPosts()
    {
        $posts = BlogPost::with('author:id,name')
            ->where('is_published', true)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts
        ]);
    }

    public function getBlogPost($slug)
    {
        $post = BlogPost::with('author:id,name')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (!$post) {
            return response()->json(['error' => 'Blog post not found'], 404);
        }

        return response()->json([
            'post' => $post
        ]);
    }

    public function createBlogPost(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'featured_image' => 'nullable|url',
        ]);

        // Assume currently logged in admin user, or default to first admin
        $authorId = Auth::id() ?: User::where('role', 'admin')->first()->id;

        $post = BlogPost::create([
            'author_id' => $authorId,
            'title' => $request->input('title'),
            'slug' => Str::slug($request->input('title')),
            'content' => $request->input('content'),
            'featured_image' => $request->input('featured_image'),
            'is_published' => true,
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'post' => $post
        ]);
    }

    public function listKeys()
    {
        $keys = ApiKey::with('user:id,name,email')->get();
        return response()->json([
            'keys' => $keys
        ]);
    }

    public function createKey(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Create key for the logged in user or first admin
        $userId = Auth::id() ?: User::where('role', 'admin')->first()->id;
        $keyString = 'wp_instasave_api_key_' . Str::random(32);

        $apiKey = ApiKey::create([
            'user_id' => $userId,
            'name' => $request->input('name'),
            'key' => $keyString,
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'key' => $apiKey
        ]);
    }

    public function deleteKey($id)
    {
        $key = ApiKey::find($id);
        if (!$key) {
            return response()->json(['error' => 'API Key not found'], 404);
        }

        $key->delete();

        return response()->json([
            'success' => true,
            'message' => 'API Key deleted successfully'
        ]);
    }
}
