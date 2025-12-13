"""
pytest設定とフィクスチャ

統合テスト用の共通フィクスチャを提供
"""
import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db


# テスト用データベースエンジン（実際のPostgreSQLを使用）
@pytest.fixture(scope="function")
async def test_engine():
    """テスト用データベースエンジン"""
    # .env.localのDATABASE_URLを使用（開発段階は同一DB）
    # asyncpg用にURLを変換し、sslmodeパラメータを除去
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # クエリパラメータからsslmodeとchannel_bindingを削除
    # asyncpgはconnect_argsでSSL設定を行う
    if "?" in db_url:
        base_url, query_string = db_url.split("?", 1)
        query_params = []
        for param in query_string.split("&"):
            if not param.startswith("sslmode=") and not param.startswith("channel_binding="):
                query_params.append(param)
        db_url = base_url + ("?" + "&".join(query_params) if query_params else "")

    engine = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"ssl": "require"},  # asyncpg用のSSL設定
    )
    yield engine
    await engine.dispose()


# テスト用セッションメーカー
@pytest.fixture(scope="function")
def test_session_maker(test_engine):
    """テスト用セッションメーカー"""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# テスト用データベースセッション
@pytest.fixture
async def db_session(test_session_maker) -> AsyncGenerator[AsyncSession, None]:
    """テスト用データベースセッション（各テストで独立したトランザクション）"""
    async with test_session_maker() as session:
        # トランザクション開始
        await session.begin()
        try:
            yield session
        finally:
            # テスト後に必ずロールバック
            await session.rollback()
            await session.close()


# FastAPIテストクライアント
@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """FastAPIテストクライアント"""

    # 依存性注入のオーバーライド
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    # クリーンアップ
    app.dependency_overrides.clear()
