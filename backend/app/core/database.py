"""
データベース接続モジュール

SQLAlchemy 2.0 AsyncSessionを使用したPostgreSQL接続設定
トランザクション管理ユーティリティを含む
"""
import functools
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Callable, TypeVar, ParamSpec

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

logger = logging.getLogger(__name__)
P = ParamSpec('P')
T = TypeVar('T')

from app.core.config import settings

# DATABASE_URLをasyncpg用に変換
# postgresql:// -> postgresql+asyncpg://
# sslmodeパラメータはasyncpgでは未対応なので除去
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpgでサポートされていないパラメータを除去
parsed = urlparse(database_url)
if parsed.query:
    # クエリパラメータを解析
    params = parse_qs(parsed.query, keep_blank_values=True)
    # asyncpg未対応パラメータを除去
    unsupported_params = ['sslmode', 'channel_binding']
    for param in unsupported_params:
        params.pop(param, None)
    # 新しいクエリ文字列を構築（値がリストの場合は最初の値を使用）
    new_query = urlencode({k: v[0] if isinstance(v, list) else v for k, v in params.items()})
    # URLを再構築
    database_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment,
    ))

# 非同期エンジンの作成
engine = create_async_engine(
    database_url,
    echo=settings.NODE_ENV == "development",  # 開発環境のみSQLログ出力
    future=True,
    pool_pre_ping=True,  # 接続プールのヘルスチェック
    pool_size=10,
    max_overflow=20,
)

# 非同期セッションファクトリー
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ベースクラス（モデル定義用）
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    データベースセッションの依存性注入

    FastAPIのDependsで使用する非同期ジェネレーター関数

    Yields:
        AsyncSession: データベースセッション
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    データベース初期化

    全テーブルを作成（開発環境のみ使用）
    本番環境ではAlembicマイグレーションを使用
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """
    データベース接続のクリーンアップ

    アプリケーション終了時に呼び出す
    """
    await engine.dispose()


# ========== トランザクション管理ユーティリティ ==========


@asynccontextmanager
async def transaction(session: AsyncSession):
    """
    明示的トランザクションコンテキストマネージャー

    複数のDB操作をアトミックに実行する必要がある場合に使用

    Usage:
        async with transaction(db) as tx_session:
            await tx_session.execute(...)
            await tx_session.execute(...)
            # 全て成功すれば自動コミット、例外発生時は自動ロールバック

    Args:
        session: データベースセッション

    Yields:
        AsyncSession: トランザクション中のセッション
    """
    try:
        yield session
        await session.commit()
        logger.debug("Transaction committed successfully")
    except Exception as e:
        await session.rollback()
        logger.error(f"Transaction rolled back due to: {type(e).__name__}: {e}")
        raise


@asynccontextmanager
async def savepoint(session: AsyncSession, name: str | None = None):
    """
    セーブポイント（ネストされたトランザクション）コンテキストマネージャー

    部分的なロールバックが必要な場合に使用

    Usage:
        async with savepoint(db, "create_video") as sp:
            video = await create_video(db, data)
            async with savepoint(db, "add_metadata") as sp2:
                await add_metadata(db, video.id, metadata)
                # ここで失敗してもビデオは保持

    Args:
        session: データベースセッション
        name: セーブポイント名（デバッグ用）

    Yields:
        ネストトランザクション
    """
    sp_name = name or f"sp_{id(session)}"
    nested = await session.begin_nested()
    try:
        yield nested
        logger.debug(f"Savepoint '{sp_name}' committed")
    except Exception as e:
        await nested.rollback()
        logger.warning(f"Savepoint '{sp_name}' rolled back: {type(e).__name__}: {e}")
        raise


def transactional(func: Callable[P, T]) -> Callable[P, T]:
    """
    トランザクションデコレータ

    関数全体をトランザクションで囲む
    関数の第一引数がAsyncSessionであることを前提

    Usage:
        @transactional
        async def create_project_with_videos(db: AsyncSession, data: ProjectCreate):
            project = await create_project(db, data)
            for video_data in data.videos:
                await create_video(db, project.id, video_data)
            return project

    Args:
        func: デコレート対象の非同期関数

    Returns:
        トランザクションで囲まれた関数
    """
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        # 第一引数からセッションを取得
        session: AsyncSession | None = None
        if args and isinstance(args[0], AsyncSession):
            session = args[0]
        elif 'db' in kwargs and isinstance(kwargs['db'], AsyncSession):
            session = kwargs['db']
        elif 'session' in kwargs and isinstance(kwargs['session'], AsyncSession):
            session = kwargs['session']

        if session is None:
            # セッションが見つからない場合はそのまま実行
            return await func(*args, **kwargs)

        try:
            result = await func(*args, **kwargs)
            await session.commit()
            logger.debug(f"Transaction committed for {func.__name__}")
            return result
        except Exception as e:
            await session.rollback()
            logger.error(f"Transaction rolled back for {func.__name__}: {type(e).__name__}: {e}")
            raise

    return wrapper


async def execute_in_transaction(
    session: AsyncSession,
    *operations: Callable[[AsyncSession], T],
) -> list[T]:
    """
    複数の操作をトランザクション内で順次実行

    すべての操作が成功した場合のみコミット

    Usage:
        results = await execute_in_transaction(
            db,
            lambda s: create_project(s, project_data),
            lambda s: create_video(s, video_data),
            lambda s: update_workflow(s, workflow_data),
        )

    Args:
        session: データベースセッション
        operations: 実行する操作（各操作はセッションを受け取る関数）

    Returns:
        list: 各操作の結果リスト
    """
    results: list[T] = []
    try:
        for op in operations:
            result = await op(session)
            results.append(result)
        await session.commit()
        logger.debug(f"Executed {len(operations)} operations in transaction")
        return results
    except Exception as e:
        await session.rollback()
        logger.error(f"Transaction failed after {len(results)} operations: {type(e).__name__}: {e}")
        raise
