"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Loader2, Calendar, User, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../config";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image: string;
  published_at: string;
  author: {
    name: string;
  };
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/blog`);
        setPosts(response.data.posts || []);
      } catch (err) {
        // Fallback demo posts if backend is unseeded/inactive
        setPosts([
          {
            id: "1",
            title: "How to Download Instagram Reels Safely & Privately",
            slug: "how-to-download-instagram-reels-safely",
            content: "Learn the core techniques for downloading Instagram reels without exposing your account details...",
            featured_image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80",
            published_at: "2026-06-01T12:00:00Z",
            author: { name: "InstaSave Writer" }
          },
          {
            id: "2",
            title: "Understanding Instagram's Anti-Bot Scraping Limits",
            slug: "understanding-instagram-anti-bot-limits",
            content: "Discover how session cookies, proxy rotation, and headers prevent rate limit bans during high speed media parsing...",
            featured_image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
            published_at: "2026-05-28T09:30:00Z",
            author: { name: "DevOps Lead" }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          InstaSave <span className="text-gradient">Blog Hub</span>
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
          Insights, guides, and updates about downloader development, Instagram limits, and proxy optimizations.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all duration-300">
              <div>
                <div className="aspect-[16/9] bg-zinc-900 overflow-hidden relative">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-xs text-zinc-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{post.author.name}</span>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Read Article</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
