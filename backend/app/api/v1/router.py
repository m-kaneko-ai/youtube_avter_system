"""
APIルーター集約モジュール

全APIエンドポイントのルーターを統合
"""
from fastapi import APIRouter

# メインルーター（/api/v1プレフィックス）
api_router = APIRouter()

# ヘルスチェックエンドポイント（認証不要）
@api_router.get("/health", tags=["Health"])
async def health_check():
    """
    ヘルスチェックエンドポイント

    Returns:
        dict: システムステータス
    """
    return {
        "status": "ok",
        "message": "Creator Studio AI Backend is running"
    }


# 設定情報エンドポイント（認証不要）
@api_router.get("/config", tags=["Config"])
async def get_config():
    """
    公開設定情報エンドポイント

    Returns:
        dict: フロントエンド向け設定情報
    """
    return {
        "version": "1.0.0",
        "environment": "development"
    }


# 各機能のルーターを登録
from app.api.v1.endpoints import (
    auth, users, clients, master, knowledges, projects, videos,
    research, planning, scripts, metadata, thumbnails,
    audio, avatar, broll, publish, analytics, admin, dashboard, metrics,
    cta
)

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clients.router)
api_router.include_router(master.router)
api_router.include_router(knowledges.router, prefix="/knowledges", tags=["Knowledges"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(videos.router, prefix="/videos", tags=["Videos"])
api_router.include_router(research.router, prefix="/research", tags=["Research"])
api_router.include_router(planning.router, prefix="/planning", tags=["Planning"])
api_router.include_router(scripts.router, prefix="/scripts", tags=["Scripts"])
api_router.include_router(metadata.router, prefix="/metadata", tags=["Metadata"])
api_router.include_router(thumbnails.router, prefix="/thumbnails", tags=["Thumbnails"])
api_router.include_router(audio.router, prefix="/audio", tags=["Audio"])
api_router.include_router(avatar.router, prefix="/avatar", tags=["Avatar"])
api_router.include_router(broll.router, prefix="/broll", tags=["B-roll"])
api_router.include_router(publish.router, prefix="/publish", tags=["Publish"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(metrics.router, tags=["Metrics"])
api_router.include_router(cta.router, prefix="/cta", tags=["CTA"])
