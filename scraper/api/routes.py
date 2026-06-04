from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from services.downloader_service import downloader_service
import re

router = APIRouter()

class DownloadRequest(BaseModel):
    url: str

class ProfileRequest(BaseModel):
    username: str

class ProfilePostsRequest(BaseModel):
    username: str
    limit: int = 10

def extract_shortcode(url: str) -> str:
    match = re.search(r'(?:instagram\.com.*\/p\/|reel\/|reels\/)([\w-]+)', url)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid Instagram URL format")
    return match.group(1)

@router.post("/scrape/single")
def scrape_single(req: DownloadRequest):
    shortcode = extract_shortcode(req.url)
    try:
        return downloader_service.fetch_post(shortcode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape/profile")
def scrape_profile(req: ProfileRequest):
    try:
        return downloader_service.fetch_profile(req.username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape/stories")
def scrape_stories(req: ProfileRequest):
    try:
        return downloader_service.fetch_stories(req.username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape/profile-posts")
def scrape_profile_posts(req: ProfilePostsRequest):
    try:
        return downloader_service.fetch_profile_posts(req.username, req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
