"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Download, AlertCircle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../config";

interface MediaItem {
  url: string;
  type: string;
}

interface ScrapeResult {
  success: boolean;
  owner: string;
  caption: string;
  media_type: string;
  media: MediaItem[];
}

function SingleDownloaderContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      handleDownload(urlParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      handleDownload(url.trim());
    }
  };

  const handleDownload = async (targetUrl: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Laravel backend url is configured locally or via environment variables
      const response = await axios.post(`${API_BASE_URL}/api/v1/download/single`, {
        url: targetUrl
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch Instagram media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3 py-1 bg-primary/10 rounded-full">
          Tool #1
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Reels & Post</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Save Reels, Videos, Photos, and Carousel slides. Download files anonymously through our secure proxy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste Instagram link here (Reel, Photo, Video)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
              <Download className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching..." : "Fetch Media"}</span>
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
          <p className="text-zinc-400 text-sm">Bypassing Instagram limits & extracting media...</p>
        </div>
      )}

      {result && result.success && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Media Found!</h2>
            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full uppercase font-semibold text-zinc-300">
              {result.media_type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {result.media.map((item, idx) => (
              <div key={idx} className="glass-panel rounded-xl overflow-hidden group">
                <div className="aspect-square bg-black/40 relative flex items-center justify-center">
                  {item.type === "video" ? (
                    <video controls className="w-full h-full object-cover">
                      <source src={`${API_BASE_URL}/api/v1/download/proxy?url=${encodeURIComponent(item.url)}`} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={`${API_BASE_URL}/api/v1/download/proxy?url=${encodeURIComponent(item.url)}`} alt="Instagram Media" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 border-t border-white/5">
                  <a
                    href={`${API_BASE_URL}/api/v1/download/proxy?url=${encodeURIComponent(item.url)}`}
                    download
                    className="w-full gradient-btn text-white font-semibold rounded-lg py-2.5 text-xs flex items-center justify-center space-x-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Media</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {result.caption && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Caption</h3>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {result.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SingleDownloader() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading single downloader...</p>
      </div>
    }>
      <SingleDownloaderContent />
    </Suspense>
  );
}
