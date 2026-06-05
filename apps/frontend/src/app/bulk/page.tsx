"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, Library, CheckSquare, Square } from "lucide-react";
import { API_BASE_URL } from "../config";

interface ProfilePost {
  id: string;
  url: string;
  type: string; // video, image
  preview: string;
}

export default function BulkDownloader() {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/i);
      if (match) {
        targetUsername = match[1];
        setUsername(targetUsername);
      }
    }
    if (!targetUsername) return;

    setLoading(true);
    setError("");
    setPosts([]);
    setSelected([]);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/download/bulk-fetch`, {
        username: targetUsername,
        limit
      });
      setPosts(response.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch profile posts. Rate limits may apply.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const selectAll = () => {
    setSelected(posts.map(p => p.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleBulkDownload = async () => {
    if (selected.length === 0) return;

    setZipping(true);
    setError("");

    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/i);
      if (match) {
        targetUsername = match[1];
      }
    }

    const selectedPosts = posts.filter(p => selected.includes(p.id));

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/download/zip`, {
        username: targetUsername,
        media: selectedPosts.map(p => ({ id: p.id, url: p.url, type: p.type }))
      });

      // Redirect or initiate ZIP download
      if (response.data.zip_url) {
        window.location.href = response.data.zip_url;
      } else {
        throw new Error("Zip creation failed");
      }
    } catch (err: any) {
      setError("Failed to generate ZIP package. Try choosing fewer files.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-green-400 px-3 py-1 bg-green-400/10 rounded-full">
          Tool #3
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Bulk Profile <span className="text-gradient">ZIP</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Enter a profile username, pick the latest posts, select the ones you want, and save them in a single, high-speed ZIP.
        </p>
      </div>

      <form onSubmit={handleFetch} className="glass-panel p-6 rounded-2xl mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-400 mb-2 block">Instagram Username</label>
          <input
            type="text"
            placeholder="e.g. cristiano"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-2 block">Post Count Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
          >
            <option value={10}>10 Posts</option>
            <option value={20}>20 Posts</option>
            <option value={50}>50 Posts</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn text-white font-semibold rounded-xl py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Library className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching Profile Posts..." : "Fetch Profile Content"}</span>
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
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Querying profile and harvesting media nodes...</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white transition"
              >
                <CheckSquare className="h-4 w-4 text-primary" />
                <span>Select All</span>
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white transition"
              >
                <Square className="h-4 w-4" />
                <span>Deselect All</span>
              </button>
            </div>
            <button
              onClick={handleBulkDownload}
              disabled={selected.length === 0 || zipping}
              className="gradient-btn text-white font-semibold rounded-lg px-6 py-2.5 text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {zipping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{zipping ? "Creating ZIP..." : `Download Selected (${selected.length})`}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {posts.map((post) => {
              const isSel = selected.includes(post.id);
              return (
                <div
                  key={post.id}
                  onClick={() => toggleSelect(post.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    isSel ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={`${API_BASE_URL}/api/v1/download/proxy?url=${encodeURIComponent(post.preview)}`} alt="Instagram Media" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-md">
                    {isSel ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-white/60" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
