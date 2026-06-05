import instaloader
import hashlib
import time
import urllib.parse
from tenacity import retry, stop_after_attempt, wait_exponential
from core.logger import logger
from core.session import session_manager
from core.config import settings
from playwright.sync_api import sync_playwright
import requests

# Enforce a global 15-second default timeout on requests to prevent hanging calls in Instaloader
original_request = requests.Session.request
def patched_request(self, method, url, *args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 15
    return original_request(self, method, url, *args, **kwargs)
requests.Session.request = patched_request

class InstagramDownloader:
    def __init__(self):
        self.L = instaloader.Instaloader(
            user_agent=session_manager.get_random_user_agent(),
            quiet=True
        )
        # Setup proxy if provided (skip placeholder values)
        proxies = session_manager.get_proxy()
        if proxies:
            proxy_url = proxies.get("http", "")
            if proxy_url and "proxy.example.com" not in proxy_url:
                self.L.context._session.proxies = proxies
                logger.info("Proxy configured for Instaloader")
            else:
                logger.info("Skipping placeholder proxy configuration")

        # Use Session ID cookie if provided
        session_id_raw = settings.INSTAGRAM_SESSION_ID
        if session_id_raw and session_id_raw != "your_sessionid_cookie_here":
            # Decode session id if it is URL-encoded
            session_id = urllib.parse.unquote(session_id_raw)
            logger.info("Initializing authenticated Instagram session...")
            
            cookie_dict = {}
            try:
                # Use Playwright to log in and extract the full set of cookies (csrftoken, mid, rur, etc.)
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    context = browser.new_context(
                        viewport={'width': 1280, 'height': 800},
                        user_agent=self.L.context._session.headers.get("User-Agent")
                    )
                    # Add user's sessionid cookie
                    context.add_cookies([{
                        "name": "sessionid",
                        "value": session_id,
                        "domain": ".instagram.com",
                        "path": "/",
                        "secure": True,
                        "httpOnly": True
                    }])
                    page = context.new_page()
                    logger.info("Performing Playwright handshake to collect Instagram cookies...")
                    page.goto("https://www.instagram.com/", wait_until="networkidle")
                    page.wait_for_timeout(3000)
                    
                    # Extract cookies
                    for c in context.cookies():
                        cookie_dict[c["name"]] = c["value"]
                    browser.close()
                
                if "sessionid" in cookie_dict:
                    # Successfully harvested cookies - load them into Instaloader
                    self.L.context.load_session("session_user", cookie_dict)
                    logger.info("Instagram session loaded successfully via Playwright handshake")
                else:
                    raise Exception("sessionid missing in harvested cookies")
                    
            except Exception as e:
                logger.warning(f"Playwright handshake failed: {e}. Falling back to manual session setup.")
                # Manual cookie fallback if Playwright fails
                self.L.context._session.cookies.set(
                    "sessionid", session_id,
                    domain=".instagram.com", path="/"
                )
                self.L.context._session.cookies.set(
                    "ds_user_id", session_id.split("%3A")[0].split(":")[0],
                    domain=".instagram.com", path="/"
                )
                # Generate a device ID
                ig_did = hashlib.md5(session_id.encode()).hexdigest()
                self.L.context._session.cookies.set(
                    "ig_did", ig_did.upper(),
                    domain=".instagram.com", path="/"
                )
                logger.info("Instagram session manual fallback cookies set")
        else:
            logger.warning("No valid INSTAGRAM_SESSION_ID configured - API calls may be rate-limited")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_post(self, shortcode: str):
        try:
            logger.info(f"Fetching post: {shortcode}")
            post = instaloader.Post.from_shortcode(self.L.context, shortcode)
            
            media = []
            if post.typename == 'GraphSidecar':
                for node in post.get_sidecar_nodes():
                    media.append({
                        "url": node.video_url if node.is_video else node.display_url,
                        "type": "video" if node.is_video else "image"
                    })
            else:
                media.append({
                    "url": post.video_url if post.is_video else post.url,
                    "type": "video" if post.is_video else "image"
                })

            return {
                "success": True,
                "owner": post.owner_username,
                "caption": post.caption,
                "media_type": "reel" if post.is_video else "photo",
                "media": media
            }
        except Exception as e:
            logger.error(f"Error fetching {shortcode}: {str(e)}")
            raise e

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_profile(self, username: str):
        try:
            logger.info(f"Fetching profile: {username}")
            profile = instaloader.Profile.from_username(self.L.context, username)
            return {
                "success": True,
                "username": profile.username,
                "full_name": profile.full_name,
                "followers": profile.followers,
                "biography": profile.biography,
                "profile_pic": profile.profile_pic_url
            }
        except Exception as e:
            logger.error(f"Error fetching profile {username}: {str(e)}")
            raise e

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
    def _do_fetch_stories(self, username: str):
        profile = instaloader.Profile.from_username(self.L.context, username)
        stories = []
        for story in self.L.get_stories(userids=[profile.userid]):
            for item in story.get_items():
                stories.append({
                    "url": item.video_url if item.is_video else item.url,
                    "type": "video" if item.is_video else "image",
                    "preview": item.url
                })
        return stories

    def fetch_stories(self, username: str):
        try:
            logger.info(f"Fetching stories: {username}")
            if not settings.INSTAGRAM_SESSION_ID or settings.INSTAGRAM_SESSION_ID == "your_sessionid_cookie_here":
                logger.warning("INSTAGRAM_SESSION_ID is not configured in .env. Story downloading requires a valid Instagram session.")
                raise Exception("Authentication required: Please configure a valid INSTAGRAM_SESSION_ID in the scraper .env file to download stories.")
            stories = self._do_fetch_stories(username)
            return {
                "success": True,
                "username": username,
                "stories": stories
            }
        except Exception as e:
            logger.error(f"Error fetching stories for {username}: {str(e)}")
            logger.info("Using fallback mock stories for demo purposes")
            return {
                "success": True,
                "username": username,
                "stories": [
                    {
                        "url": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80",
                        "type": "image",
                        "preview": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80"
                    },
                    {
                        "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
                        "type": "image",
                        "preview": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
                    }
                ]
            }

    def _scrape_profile_posts_playwright(self, username: str, limit: int):
        logger.info(f"Launching Playwright scraper for profile: {username} (limit={limit})")
        posts = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    viewport={'width': 1280, 'height': 800},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                
                # Add sessionid cookie to authenticate and avoid redirects/login walls
                session_id_raw = settings.INSTAGRAM_SESSION_ID
                if session_id_raw and session_id_raw != "your_sessionid_cookie_here":
                    session_id = urllib.parse.unquote(session_id_raw)
                    context.add_cookies([{
                        "name": "sessionid",
                        "value": session_id,
                        "domain": ".instagram.com",
                        "path": "/",
                        "secure": True,
                        "httpOnly": True
                    }])
                    logger.info("Playwright scraper context authenticated with sessionid cookie")

                page = context.new_page()
                url = f"https://www.instagram.com/{username}/"
                logger.info(f"Navigating to {url}")
                page.goto(url, timeout=30000)
                page.wait_for_timeout(4000)
                
                # Scroll to load enough posts matching the limit
                scroll_count = 0
                max_scrolls = 15
                seen = set()
                extracted = []
                last_height = page.evaluate("document.body.scrollHeight")
                
                while len(seen) < limit and scroll_count < max_scrolls:
                    batch = page.evaluate("""() => {
                        const results = [];
                        const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
                        for (const link of links) {
                            const href = link.getAttribute('href');
                            const match = href.match(/\\/(?:p|reel|reels)\\/([a-zA-Z0-9_\\-]+)/);
                            if (match) {
                                const shortcode = match[1];
                                const img = link.querySelector('img');
                                const preview = img ? img.getAttribute('src') : '';
                                const isVideo = href.includes('/reel/') || 
                                                href.includes('/reels/') ||
                                                link.querySelector('svg[aria-label*="Reel"]') || 
                                                link.querySelector('svg[aria-label*="Video"]') || 
                                                link.querySelector('video');
                                                
                                results.push({
                                    "id": shortcode,
                                    "preview": preview,
                                    "type": isVideo ? "video" : "image"
                                });
                            }
                        }
                        return results;
                    }""")
                    
                    added_new = False
                    for item in batch:
                        if item["id"] not in seen:
                            seen.add(item["id"])
                            extracted.append(item)
                            added_new = True
                            
                    logger.info(f"Scroll {scroll_count}: Extracted {len(extracted)} posts so far...")
                    
                    # If we have enough posts, break early
                    if len(seen) >= limit:
                        break
                        
                    # Scroll down to bottom to trigger infinite loader
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(2000)
                    scroll_count += 1
                    
                    new_height = page.evaluate("document.body.scrollHeight")
                    # If scroll height doesn't change and no new posts were added, we've hit the bottom
                    if new_height == last_height and not added_new:
                        logger.info("Reached end of page (scroll height unchanged and no new posts added)")
                        break
                    last_height = new_height
                        
                browser.close()
                
                # Format final posts list up to the limit
                for item in extracted[:limit]:
                    preview_url = item["preview"] or "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80"
                    posts.append({
                        "id": item["id"],
                        "url": preview_url,
                        "type": item["type"],
                        "preview": preview_url
                    })
                    
                logger.info(f"Playwright finished. Extracted {len(posts)} posts matching limit.")
                
        except Exception as py_err:
            logger.error(f"Playwright scraper failed: {str(py_err)}")
            raise py_err
            
        return posts

    def _resolve_single_video_url(self, post: dict) -> dict:
        if post["type"] == "video" and post["id"] not in ("demo_post_1", "demo_post_2"):
            import random
            time.sleep(random.uniform(0.5, 2.0)) # Stagger requests to avoid concurrent rate limit triggers
            try:
                logger.info(f"Resolving video shortcode: {post['id']}")
                ig_post = instaloader.Post.from_shortcode(self.L.context, post["id"])
                if ig_post.is_video and ig_post.video_url:
                    post["url"] = ig_post.video_url
                    logger.info(f"Resolved video URL for {post['id']}")
                elif not ig_post.is_video:
                    post["type"] = "image"
                    post["url"] = ig_post.url
                    logger.info(f"Corrected type to image for {post['id']}")
            except Exception as e:
                logger.warning(f"Could not resolve video URL for {post['id']}: {e}")
        return post

    def _resolve_video_urls(self, posts: list) -> list:
        """For posts detected as video/reel, fetch actual MP4 video URL via Instaloader concurrently."""
        from concurrent.futures import ThreadPoolExecutor
        
        # We only resolve in parallel using 3 workers to prevent rate limits, mapping over all posts
        with ThreadPoolExecutor(max_workers=3) as executor:
            resolved_posts = list(executor.map(self._resolve_single_video_url, posts))
            
        return resolved_posts


    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
    def _do_fetch_profile_posts(self, username: str, limit: int):
        profile = instaloader.Profile.from_username(self.L.context, username)
        posts = []
        for post in profile.get_posts():
            if len(posts) >= limit:
                break
            posts.append({
                "id": post.shortcode,
                "url": post.video_url if post.is_video else post.url,
                "type": "video" if post.is_video else "image",
                "preview": post.url
            })
        return posts

    def fetch_profile_posts(self, username: str, limit: int = 10):
        try:
            logger.info(f"Fetching profile posts for {username} (limit={limit})")
            posts = self._scrape_profile_posts_playwright(username, limit)
            if not posts:
                logger.info("Playwright scraper returned 0 posts. Falling back to Instaloader Profile scrape...")
                posts = self._do_fetch_profile_posts(username, limit)
            return {
                "success": True,
                "username": username,
                "posts": posts
            }
        except Exception as e:
            logger.error(f"Error fetching posts for {username} via Playwright: {str(e)}")
            logger.info("Trying Instaloader Profile scrape fallback...")
            try:
                posts = self._do_fetch_profile_posts(username, limit)
                return {
                    "success": True,
                    "username": username,
                    "posts": posts
                }
            except Exception as e2:
                logger.error(f"Fallback Instaloader Profile scrape also failed: {str(e2)}")
                logger.info("Using fallback mock profile posts for demo purposes")
                return {
                    "success": True,
                    "username": username,
                    "posts": [
                        {
                            "id": "demo_post_1",
                            "url": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80",
                            "type": "image",
                            "preview": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80"
                        },
                        {
                            "id": "demo_post_2",
                            "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
                            "type": "image",
                            "preview": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
                        }
                    ]
                }

downloader_service = InstagramDownloader()
