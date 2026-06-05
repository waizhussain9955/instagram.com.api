# Project Details & Deployment Guide

This document provides a comprehensive overview of the architecture, key dependencies, API endpoints, and deployment options for the Instagram Media Downloader application.

---

## 1. System Architecture

The project has been refactored from a multi-service setup (Laravel + FastAPI Scraper + Next.js Frontend) into a single unified **Next.js Serverless Monorepo**. All operations run serverless within the Next.js runtime.

```
┌────────────────────────────────────────────────────────┐
│                      Next.js App                       │
│                                                        │
│  ┌────────────────┐               ┌─────────────────┐  │
│  │  Client / UI   │               │   Serverless    │  │
│  │ (Single/Bulk/  ├──────────────►│    Handlers     │  │
│  │    Stories)    │               │  (/api/download)│  │
│  └──────┬─────────┘               └────────┬────────┘  │
│         │                                  │           │
│         │ (Fetch proxy stream)             │ (RapidAPI)│
│         ▼                                  ▼           │
│  ┌────────────────┐               ┌─────────────────┐  │
│  │   API Proxy    │               │    Hosted API   │  │
│  │  (/api/proxy)  │               │    Downloader   │  │
│  └──────┬─────────┘               └─────────────────┘  │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
    [Instagram CDN]
```

### Key Architectural Benefits:
1. **No Scraping Infrastructure**: Zero maintenance of proxy rotation, browser sessions, or Playwright instances.
2. **Reduced Server Overhead**: Zipping is done entirely on the client's browser using `JSZip`, reducing backend memory usage to zero for bulk packaging.
3. **Optimized Proxying**: The media proxy streams data chunk-by-chunk using standard `ReadableStream` interfaces, preventing RAM spikes.

---

## 2. API Endpoints

### 2.1 Metadata Resolver (`POST /api/download`)
* **Endpoint**: `/api/download`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Payload**:
  * For Single Downloader:
    ```json
    {
      "type": "single",
      "url": "https://www.instagram.com/reel/XYZ/"
    }
    ```
  * For Story Downloader:
    ```json
    {
      "type": "stories",
      "username": "cristiano"
    }
    ```
  * For Bulk Profile Downloader:
    ```json
    {
      "type": "bulk-fetch",
      "username": "cristiano",
      "limit": 10
    }
    ```
* **Output**: A normalized JSON response returning array of media links (`url` and `type` [image/video]).

### 2.2 Media Proxy (`GET /api/proxy`)
* **Endpoint**: `/api/proxy`
* **Method**: `GET`
* **Query Params**: `url=[INSTAGRAM_CDN_MEDIA_URL]`
* **Purpose**: Bypasses Instagram CDN CORS policy (hotlink prevention) by downloading the stream on the server side and serving it with an open CORS header (`Access-Control-Allow-Origin: *`).

---

## 3. Deployment Configuration

### 3.1 Environment Variables
To run or deploy this project, you need to configure the following environment variables.

| Variable | Description |
| :--- | :--- |
| `RAPIDAPI_KEY` | Your RapidAPI account access key. |
| `RAPIDAPI_HOST` | Host header for the third-party API: `social-media-video-downloader.p.rapidapi.com` |

---

## 4. Platform Deployment Guides

Because the project is now a standard Next.js application, you can deploy it to any serverless or Node.js hosting platform.

### Option A: Vercel (Recommended - Fastest & Free Staging)
Vercel is the creator of Next.js and provides native support for Next.js App Router and Serverless Routes.

1. **Push your code** to your GitHub repository: `https://github.com/waizhussain9955/instagram.com.api.git`.
2. **Log into Vercel** (using your GitHub account).
3. Click **Add New Project** and import the repository.
4. Set the **Root Directory** to `apps/frontend`.
5. Add the Environment Variables:
   * `RAPIDAPI_KEY` = `[Your RapidAPI Key]`
   * `RAPIDAPI_HOST` = `social-media-video-downloader.p.rapidapi.com`
6. Click **Deploy**. Vercel will build and host it automatically.

### Option B: Docker / VPS Hosting (Self-Hosted)
If you want to host on your own Linux Server or VPS using Docker:

1. Configure a `.env` file in your server directory:
   ```env
   RAPIDAPI_KEY=your_key_here
   RAPIDAPI_HOST=social-media-video-downloader.p.rapidapi.com
   ```
2. Build and start using Docker-Compose:
   ```bash
   docker-compose up -d --build
   ```
3. The server will run on port `3000`. You can configure a reverse proxy (like Nginx) to map your domain to `http://localhost:3000`.

### Option C: Fly.io
Since you have a Dockerfile under `apps/frontend/Dockerfile`, you can deploy to Fly.io easily:

1. Install Fly CLI and log in.
2. Initialize fly in the frontend directory:
   ```bash
   cd apps/frontend
   fly launch --src .
   ```
3. Set secrets for the application:
   ```bash
   fly secrets set RAPIDAPI_KEY=your_key_here RAPIDAPI_HOST=social-media-video-downloader.p.rapidapi.com
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

## 5. WordPress Integration

You can easily embed these downloaders into a WordPress plugin or directly into a post/page using custom code blocks or Shortcodes.

### 5.1 Single Video Downloader Custom HTML Code
Add this script and layout inside a WordPress page block (Custom HTML) pointing to your hosted API:

```html
<div class="wp-instagram-downloader">
  <input type="text" id="insta-url" placeholder="Paste Instagram Link..." style="width: 80%; padding: 10px;"/>
  <button onclick="fetchInstagramVideo()" style="padding: 10px 20px;">Download</button>
  <div id="download-result" style="margin-top: 15px;"></div>
</div>

<script>
async function fetchInstagramVideo() {
  const url = document.getElementById('insta-url').value;
  const resultDiv = document.getElementById('download-result');
  resultDiv.innerHTML = 'Fetching...';
  
  try {
    const response = await fetch('YOUR_DEPLOYED_APP_DOMAIN/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'single', url })
    });
    const data = await response.json();
    if (data.success && data.media.length > 0) {
      resultDiv.innerHTML = '';
      data.media.forEach((item, index) => {
        // Use proxy to avoid hotlinking download block
        const proxyUrl = `YOUR_DEPLOYED_APP_DOMAIN/api/proxy?url=${encodeURIComponent(item.url)}`;
        resultDiv.innerHTML += `
          <div style="margin-bottom:10px;">
            <p>File #${index+1} (${item.type})</p>
            <a href="${proxyUrl}" download="instagram_${index+1}.mp4" target="_blank" style="background: #e1306c; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Download File</a>
          </div>
        `;
      });
    } else {
      resultDiv.innerHTML = 'Error: ' + (data.error || 'Failed to download.');
    }
  } catch (err) {
    resultDiv.innerHTML = 'Error communicating with downloader backend.';
  }
}
</script>
```
*(Replace `YOUR_DEPLOYED_APP_DOMAIN` with the URL of your Vercel or VPS deployment).*
