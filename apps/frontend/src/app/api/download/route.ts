import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, url, username, limit } = body;

    // Validate inputs
    let targetUrl = "";
    let shortcode = "";
    if (type === "single") {
      if (!url || !url.startsWith("http")) {
        return NextResponse.json({ error: "Invalid Instagram URL format" }, { status: 400 });
      }
      targetUrl = url;
      // Extract shortcode
      const match = url.match(/(?:instagram\.com\/(?:p|reel|tv|stories)\/)([a-zA-Z0-9_\-]+)/i);
      if (match) {
        shortcode = match[1];
      }
    } else if (type === "stories") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
      // Construct a public story URL or handle direct link
      targetUrl = username.startsWith("http") 
        ? username 
        : `https://www.instagram.com/stories/${username}/`;
    } else if (type === "bulk-fetch") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
      targetUrl = username.startsWith("http") 
        ? username 
        : `https://www.instagram.com/${username}/`;
    } else {
      return NextResponse.json({ error: "Unsupported download type" }, { status: 400 });
    }

    // Load credentials from environment
    const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_API_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || "social-media-video-downloader.p.rapidapi.com";

    if (!apiKey) {
      return NextResponse.json({ error: "API Key configuration missing on server" }, { status: 500 });
    }

    // Call RapidAPI with 30s timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let apiEndpoint = `https://${apiHost}/instagram?url=${encodeURIComponent(targetUrl)}`;

    if (type === "single" && shortcode) {
      apiEndpoint = `https://${apiHost}/instagram/v3/media/post/details?renderableFormats=720p%2Chighres&shortcode=${shortcode}`;
    } else if (type === "stories") {
      apiEndpoint = `https://${apiHost}/instagram/v3/stories?username=${username || ""}`;
    } else if (type === "bulk-fetch") {
      apiEndpoint = `https://${apiHost}/instagram/v3/user/posts?username=${username || ""}`;
    }

    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `Third-party API returned status ${response.status}: ${errorText || "Unknown error"}` 
      }, { status: 502 });
    }

    const data = await response.json();

    // Map third-party response format to frontend expected schemas
    // Standard RapidAPI shapes often include 'success' and 'media' or 'result' fields
    const success = 
      data.success || 
      data.status === "success" || 
      Array.isArray(data.media) || 
      Array.isArray(data.result) || 
      data.video_url || 
      data.display_url || 
      data.image_url || 
      data.data ||
      (data.stories && Array.isArray(data.stories)) ||
      (data.posts && Array.isArray(data.posts));

    if (!success) {
      return NextResponse.json({ 
        error: data.message || "Failed to extract media details. Make sure the content is public." 
      }, { status: 422 });
    }

    // Extract raw media array
    const rawMedia = data.media || data.result || data.carousel_media || data.children || data.data?.carousel_media || data.data?.children || [];
    let mediaItems = Array.isArray(rawMedia) 
      ? rawMedia.map((m: any) => ({
          url: m.url || m.downloadUrl || m.link || m.video_url || m.display_url || m.image_url || m.download_url || "",
          type: m.type === "video" || m.isVideo || (m.url && m.url.includes(".mp4")) || m.video_url || m.download_url ? "video" : "image"
        })).filter((item: any) => item.url !== "")
      : [];

    if (mediaItems.length === 0) {
      // Fallback for single item responses (direct properties on 'data' or nested in 'data.data')
      const targetObj = data.data || data;
      const singleUrl = targetObj.video_url || targetObj.display_url || targetObj.image_url || targetObj.url || targetObj.downloadUrl || targetObj.download_url;
      if (singleUrl) {
        mediaItems.push({
          url: singleUrl,
          type: targetObj.video_url || targetObj.type === "video" || (singleUrl && singleUrl.includes(".mp4")) || targetObj.download_url ? "video" : "image"
        });
      }
    }

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: "No downloadable media items found in the response" }, { status: 422 });
    }

    const caption = data.caption || data.title || data.data?.title || data.data?.caption || "";
    const owner = data.owner || data.username || username || data.data?.owner?.username || "instagram_user";

    // Format final response based on request type
    if (type === "single") {
      return NextResponse.json({
        success: true,
        owner,
        caption,
        media_type: mediaItems.length > 1 ? "carousel" : mediaItems[0].type,
        media: mediaItems
      });
    } else if (type === "stories") {
      // Map stories format
      const stories = mediaItems.map((item, idx) => ({
        url: item.url,
        type: item.type,
        preview: item.url // Use same URL as preview for simplicity
      }));
      return NextResponse.json({ stories });
    } else if (type === "bulk-fetch") {
      // Map bulk-fetch format
      const posts = mediaItems.slice(0, limit || 10).map((item, idx) => ({
        id: `post_${idx}_${Date.now()}`,
        url: item.url,
        type: item.type,
        preview: item.url
      }));
      return NextResponse.json({ posts });
    }

    return NextResponse.json({ error: "Invalid type flow reached" }, { status: 500 });

  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "API connection timed out after 30 seconds" }, { status: 504 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
