import { NextResponse } from "next/server";
import instagramUrlDirect from "instagram-url-direct";
const { instagramGetUrl } = instagramUrlDirect;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, url, username, limit } = body;

    // Validate inputs
    let targetUrl = "";
    if (type === "single") {
      if (!url || !url.startsWith("http")) {
        return NextResponse.json({ error: "Invalid Instagram URL format" }, { status: 400 });
      }
      targetUrl = url;
    } else if (type === "stories") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
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

    // Handle single downloads keylessly using the instagram-url-direct scraper
    if (type === "single") {
      try {
        const result = await instagramGetUrl(targetUrl);
        if (!result || !result.url_list || result.url_list.length === 0) {
          return NextResponse.json({ error: "No media resolved from this post. Make sure it is public." }, { status: 422 });
        }

        const mediaItems = (result.media_details || []).map((m: any) => ({
          url: m.url || "",
          type: m.type === "video" ? "video" : "image"
        })).filter((item: any) => item.url !== "");

        // Fallback to url_list if media_details format fails
        if (mediaItems.length === 0 && result.url_list && result.url_list.length > 0) {
          result.url_list.forEach((u: string, idx: number) => {
            mediaItems.push({
              url: u,
              type: u.includes(".mp4") ? "video" : "image"
            });
          });
        }

        const caption = result.post_info?.caption || "";
        const owner = result.post_info?.owner_username || "instagram_user";

        return NextResponse.json({
          success: true,
          owner,
          caption,
          media_type: mediaItems.length > 1 ? "carousel" : mediaItems[0]?.type || "video",
          media: mediaItems
        });
      } catch (err: any) {
        return NextResponse.json({ error: `Keyless Downloader failed: ${err.message || err}` }, { status: 422 });
      }
    }

    // Stories and Bulk Profile Scraper require RapidAPI due to Instagram session constraints
    const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_API_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || "social-media-video-downloader.p.rapidapi.com";

    if (!apiKey || apiKey.startsWith("wp_instasave_rapidapi_key_demo")) {
      return NextResponse.json({ 
        error: "Stories & Bulk profile downloads require a valid RapidAPI Key configured in environment variables." 
      }, { status: 401 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let apiEndpoint = "";
    if (type === "stories") {
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
        error: `Hosted Scraper returned status ${response.status}: ${errorText || "Unknown error"}` 
      }, { status: 502 });
    }

    const data = await response.json();

    const success = 
      data.success || 
      data.status === "success" || 
      Array.isArray(data.media) || 
      Array.isArray(data.result) || 
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

    if (type === "stories") {
      const stories = mediaItems.map((item) => ({
        url: item.url,
        type: item.type,
        preview: item.url
      }));
      return NextResponse.json({ stories });
    } else if (type === "bulk-fetch") {
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
