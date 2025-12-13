"""
外部APIサービス

外部サービスとの連携クライアントを提供
"""
from app.services.external.youtube_api import youtube_api, YouTubeAPIClient
from app.services.external.ai_clients import (
    claude_client,
    gemini_client,
    ClaudeClient,
    GeminiClient,
    AIProvider,
)
from app.services.external.serp_api import serp_api, SerpAPIClient
from app.services.external.heygen_api import heygen_api, HeyGenClient
from app.services.external.minimax_api import minimax_audio, MiniMaxAudioClient
from app.services.external.social_blade_api import social_blade_api, SocialBladeClient

__all__ = [
    # YouTube
    "youtube_api",
    "YouTubeAPIClient",
    # AI Generation
    "claude_client",
    "gemini_client",
    "ClaudeClient",
    "GeminiClient",
    "AIProvider",
    # Search & Trends
    "serp_api",
    "SerpAPIClient",
    # Social Blade (YouTube Analytics)
    "social_blade_api",
    "SocialBladeClient",
    # Avatar Video
    "heygen_api",
    "HeyGenClient",
    # Audio Generation
    "minimax_audio",
    "MiniMaxAudioClient",
]
