"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  title: string;
  content: string;
  featured_image: string;
  published_at: string;
  author: {
    name: string;
  };
}

export default function BlogDetails() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/v1/blog/${params.slug}`);
        setPost(response.data.post);
      } catch (err) {
        // Fallback demo matching the selected slug
        const demoPosts: Record<string, BlogPost> = {
          "how-to-download-instagram-reels-safely": {
            title: "How to Download Instagram Reels Safely & Privately",
            content: `Downloading Instagram reels doesn't have to put your credentials or account safety at risk. The modern internet landscape requires caution when choosing tools.
            
            Why avoid logged-in browser downloader browser extensions? Extensions that query internal Instagram APIs inside your active login session are extremely risky. Instagram monitors anomalous extension queries and has strict rules against scraping while logged in. If Instagram flags your browser fingerprint, they might flag your account for violating community guidelines.
            
            Our safe architecture works through server proxying. When you input an Instagram Reel link into InstaSave, the request is dispatched to our standalone backend microservice, which utilizes proxy rotation and headless sessions completely isolated from your account. Your login session is never queried or transmitted.
            
            Best Practices:
            1. Never login or authorize accounts on third-party downloader sites.
            2. Choose platforms that proxy download streams to protect your local IP address.
            3. Always follow copyright boundaries.`,
            featured_image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80",
            published_at: "2026-06-01T12:00:00Z",
            author: { name: "InstaSave Writer" }
          },
          "understanding-instagram-anti-bot-limits": {
            title: "Understanding Instagram's Anti-Bot Scraping Limits",
            content: `Instagram hosts one of the most advanced bot-detection algorithms on the modern web. From request rate limiting to behavioral analyses, scraper developers must constantly optimize code.
            
            In this guide, we dive deep into how InstaSave maintains persistent extraction speeds.
            
            1. Cookie Pools & Session Key Rotation:
            We store logged-in cookie instances securely to parse stories and reels. If one session cookie gets rate-limited, the microservice immediately rotates to the next available slot in the Redis database.
            
            2. User Agent Pools:
            We emulate authentic modern desktop web layouts using Chromium headless browsers configured through Playwright. Outgoing headers rotate naturally to ensure request profiles match everyday users.
            
            3. Rate Limiting Rules:
            To prevent IP-wide bans, we use Redis token bucket rate limiting on the API layer, giving client applications immediate feedback.`,
            featured_image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
            published_at: "2026-05-28T09:30:00Z",
            author: { name: "DevOps Lead" }
          }
        };

        const slugStr = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        setPost(demoPosts[slugStr || ""] || null);
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto py-40 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Post Not Found</h2>
        <Link href="/blog" className="text-sm text-primary underline">
          Back to Blog List
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/blog" className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition mb-8">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Blog List</span>
      </Link>

      <div className="aspect-[21/9] bg-zinc-900 rounded-2xl overflow-hidden mb-10">
        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
      </div>

      <h1 className="text-3xl font-extrabold text-white sm:text-5xl leading-tight mb-6">
        {post.title}
      </h1>

      <div className="flex items-center space-x-6 text-xs text-zinc-400 mb-10 pb-6 border-b border-white/5">
        <span className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{new Date(post.published_at).toLocaleDateString()}</span>
        </span>
        <span className="flex items-center space-x-1">
          <User className="h-4 w-4" />
          <span>{post.author.name}</span>
        </span>
      </div>

      <div className="text-zinc-300 leading-relaxed whitespace-pre-line text-base max-w-none">
        {post.content}
      </div>
    </article>
  );
}
