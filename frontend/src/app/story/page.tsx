"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, PlayCircle, Eye } from "lucide-react";

interface StoryItem {
  url: string;
  type: string; // video, image
  preview: string;
}

export default function StoryDownloader() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stories, setStories] = useState<StoryItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/(?:stories\/)?([a-zA-Z0-9_\.]+)/i);
      if (match) {
        targetUsername = match[1];
        setUsername(targetUsername);
      }
    }
    if (!targetUsername) return;

    setLoading(true);
    setError("");
    setStories([]);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/v1/download/stories", {
        username: targetUsername
      });
      setStories(response.data.stories || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch stories. Please verify username or proxy settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary px-3 py-1 bg-secondary/10 rounded-full">
          Tool #2
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Story</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Download active stories and highlights from public profiles anonymously. Save video or image stories easily.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Instagram username (e.g. cristiano)..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-grow glass-input text-white rounded-xl px-5 py-4 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn text-white font-semibold rounded-xl px-8 py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching..." : "View Stories"}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="glass-panel border-red-500/20 bg-red-500/5 p-4 rounded-xl flex items-center space-x-3 mb-8">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-secondary animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Querying active sessions and parsing stories...</p>
        </div>
      )}

      {stories.length > 0 ? (
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <PlayCircle className="h-5 w-5 text-secondary" />
            <span>Active Stories ({stories.length})</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {stories.map((story, idx) => (
              <div key={idx} className="glass-panel rounded-xl overflow-hidden relative group">
                <div className="aspect-[9/16] bg-black/40 relative flex items-center justify-center">
                  {story.type === "video" ? (
                    <video controls className="w-full h-full object-cover">
                      <source src={`http://127.0.0.1:8000/api/v1/download/proxy?url=${encodeURIComponent(story.url)}`} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={`http://127.0.0.1:8000/api/v1/download/proxy?url=${encodeURIComponent(story.url)}`} alt="Story content" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3 border-t border-white/5 bg-zinc-900/60 backdrop-blur-sm">
                  <a
                    href={`http://127.0.0.1:8000/api/v1/download/proxy?url=${encodeURIComponent(story.url)}`}
                    download
                    className="w-full gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && username && (
          <div className="text-center py-10 text-zinc-500">
            No active stories found for this profile.
          </div>
        )
      )}
    </div>
  );
}
