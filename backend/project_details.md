# Project Details & Deployment Guide

This document contains the complete technical specifications, architectural workflow, dependency list, and deployment guidelines for the **Instagram Downloader Ecosystem** (comprising the Laravel backend and the FastAPI python scraper).

---

## 1. System Architecture Diagram

```mermaid
graph TD
    %% Clients
    ClientWeb[Next.js Frontend] -->|HTTP Requests| LaravelAPI[Laravel API Backend :8000]
    ClientWP[WordPress Plugins] -->|HTTP Requests with API Key| LaravelAPI

    %% Core Backend
    subgraph Laravel Core (PHP 8.2+)
        LaravelAPI -->|1. Route Middleware / Cache Check| CacheStore{Laravel Cache}
        LaravelAPI -->|2. Concurrent HTTP Chunks| ScraperAPI[FastAPI Scraper :8080]
        LaravelAPI -->|3. Concurrent CDN Downloads| InstaCDN[Instagram CDN Server]
        LaravelAPI -->|4. Temp Files & Archiving| DiskStorage[(Local disk / zips_temp)]
        LaravelAPI -->|5. Save Download Logs| NeonDB[(Neon PostgreSQL)]
    end

    %% Scraper Service
    subgraph Scraper Service (Python 3.10+)
        ScraperAPI -->|Authenticated Calls| Instaloader[Instaloader Engine]
        ScraperAPI -->|Grid/Handshake Scrapes| Playwright[Playwright Headless Browser]
        Playwright -->|Extract Cookie Handshake| InstaCore[Instagram Web API]
        Instaloader -->|Fetch Media Details| InstaCore
    end
```

---

## 2. Technical Stack Details

### Backend API (Laravel)
* **Framework**: Laravel 11.x (PHP 8.2+)
* **Database**: Neon Serverless PostgreSQL (Production-grade DB cloud hosting)
* **Caching**: File Cache driver (Configurable to Redis client `predis` for high-throughput production environments)
* **ZIP Generation Optimizer**:
  * **Memory Safeguard**: Avoids loading binary bodies into PHP memory. It creates a temporary directory (`storage/app/zips_temp/`), downloads the chunks to disk immediately, packages them into a `ZipArchive` using `$zip->addFile()`, and wipes the temporary directory in a `finally` block.
  * **Concurrency Limit**: Chunked execution processes 10 parallel downloads at a time to prevent server spikes.
  * **Dynamic Limits**: Extends PHP execution timeout limits dynamically to `240s` and raises memory to `512MB` for safety.
* **API Protection**: Token-based custom middleware (`X-API-Key`) protecting WordPress integration endpoints.

### Scraper API (FastAPI)
* **Framework**: FastAPI (Python 3.10+) running via Uvicorn.
* **Web Scraping / Handshake Engine**:
  * **Playwright**: Automates chromium browser profiles to extract the session cookies (csrftoken, mid, rur) dynamically, bypassing Instagram login wall checks.
  * **Instaloader**: Uses authenticated session parameters to fetch premium Reels CDN video and image files directly.
* **Concurrency Control**: 
  * Uses python's `ThreadPoolExecutor` (max 3 workers) coupled with random staggered delays (`0.5s` to `2.0s`) to ensure Instagram never detects robotic rate patterns.
  * Timeout patched globally on python `requests` sessions to prevent hanging connections.

---

## 3. Environment Variables (Requirements)

### Laravel API Backend (`backend/.env`)
Create these variables inside the production environment:

| Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `APP_NAME` | Project Application Title | `Instagram Downloader` |
| `APP_ENV` | Environment Type | `production` |
| `APP_KEY` | Secure key for encrypting data | `base64:41u//Wjib5vnl7edcRChbnH4T797LQBityuFCgD4weY=` |
| `APP_DEBUG` | Show debug stacktraces | `false` |
| `APP_URL` | Domain where Laravel API is deployed | `https://your-laravel-api.up.railway.app` |
| `DB_CONNECTION` | Database type | `pgsql` |
| `DB_HOST` | Neon DB server hostname | `ep-still-pine-aq1s5qke.c-8.us-east-1.aws.neon.tech` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_DATABASE` | DB Name | `neondb` |
| `DB_USERNAME` | DB User | `neondb_owner` |
| `DB_PASSWORD` | DB Auth password | `[Secret Database Password]` |
| `DB_SSLMODE` | SSL requirement | `require` |
| `CACHE_STORE` | Cache adapter | `file` or `redis` |
| `SCRAPER_SERVICE_URL` | Domain where FastAPI Python Scraper is deployed | `https://your-python-scraper.up.railway.app` |

---

### Python Scraper (`scraper/.env`)
Provide these credentials for the Python scraper service:

| Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `INSTAGRAM_SESSION_ID` | Valid authenticated Instagram session ID | `[Copy paste your valid sessionid cookie value]` |
| `PROXY_URL` | Optional proxy server address to bypass country IP blocks | `http://user:pass@proxyhost:port` |

> [!IMPORTANT]
> The `INSTAGRAM_SESSION_ID` must be periodically updated if the cookie session expires. Playwright will automatically handshake using this cookie value to keep queries authenticated.

---

## 4. Platform Deployment Guidelines

Since this application runs both PHP (Laravel) and Python (Playwright + Chromium), you will need to host them. Here are the best platform recommendations and how to configure them:

### Option A: Railway (Highly Recommended)
Railway can deploy both services effortlessly from a GitHub repository.

#### 1. Deploying the Python Scraper
* **Requirements**: Python needs Playwright dependencies.
* **Build Command**: Custom Nixpacks command or a `Dockerfile`.
  * If using nixpacks, add a `nixpacks.toml` file to install Chromium dependencies, or use a custom `Dockerfile` in the `/scraper` directory:
    ```dockerfile
    FROM python:3.10-slim
    
    WORKDIR /app
    
    # Install Chromium dependencies
    RUN apt-get update && apt-get install -y \
        gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
        libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
        libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
        libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
        libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
        libext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
        libxtst6 ca-certificates fonts-liberation libappindicator1 \
        libnss3 lsb-release xdg-utils wget curl git
        
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    RUN playwright install chromium
    
    COPY . .
    
    EXPOSE 8080
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
    ```
* **Variables**: Add `INSTAGRAM_SESSION_ID` in Railway variables.

#### 2. Deploying the Laravel Backend
* Railway detects Laravel automatically and builds it using PHP 8.2+.
* **Variables**: Set all `.env` values (Database variables, `SCRAPER_SERVICE_URL`).
* **Deploy Command**: 
  Make sure Railway runs the following start command:
  ```bash
  php artisan migrate --force && php artisan config:cache && heroku-php-apache2 public/
  ```

---

### Option B: VPS (Ubuntu / Nginx) - Maximum Control & Free
If you are deploying on a VPS (DigitalOcean, AWS EC2, Hetzner, etc.):

#### 1. Setup Python Scraper
```bash
# Clone and open directory
cd /var/www/scraper
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
playwright install-deps

# Run service using PM2
pm2 start "venv/bin/uvicorn main:app --host 127.0.0.1 --port 8080" --name "instagram-scraper"
```

#### 2. Setup Laravel Backend
```bash
# Clone and configure directories
cd /var/www/backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

#### 3. Nginx Server Block Configuration
Setup Nginx to serve Laravel on public port 80/443 and proxy `/api/v1/scrape` traffic to local FastAPI on port 8888 (optional, or let Laravel query it internally via private IP).

---

## 5. Security & Maintenance Checklist

1. **Session Cookie Monitoring**: If ZIP downloads start failing or returning empty files, check the logs. If it reports `LoginRequiredException` or `401 Unauthorized`, the Instagram `sessionid` cookie has expired and must be updated in the Scraper config environment.
2. **Neon DB Storage**: Regularly monitor the Neon DB database rows. The application logs every download transaction in the `download_logs` table. If the database reaches serverless storage capacity limits, prune older logs:
   ```sql
   DELETE FROM download_logs WHERE created_at < NOW() - INTERVAL '30 days';
   ```
3. **API Key Rotation**: The WordPress plugins communicate with Laravel API endpoints via the `X-API-Key` header. Generate a secure random string for this key and never expose it publicly.
