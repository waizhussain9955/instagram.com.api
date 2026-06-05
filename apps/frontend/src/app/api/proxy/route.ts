import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return new Response("Missing or invalid target media URL", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch media from source: status ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = response.body;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return new Response(`Proxy Error: ${err.message}`, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
