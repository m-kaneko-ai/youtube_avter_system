"""
台本・メタデータ生成サービス

台本生成、タイトル生成、説明文生成、サムネイル生成のビジネスロジック
Claude/Gemini API連携による実装
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Video, Knowledge
from app.models.script import (
    Script,
    ScriptStatus,
    GeneratorType,
    Thumbnail,
    ThumbnailStatus,
    MetadataGeneration,
)
from app.models.user import UserRole
from app.schemas.script import (
    ScriptGenerateRequest,
    ScriptResponse,
    ScriptUpdateRequest,
    ScriptGenerateResponse,
    TitleGenerateRequest,
    TitleGenerateResponse,
    DescriptionGenerateRequest,
    DescriptionGenerateResponse,
    ThumbnailGenerateRequest,
    ThumbnailResponse,
    ThumbnailGenerateResponse,
)
from app.services.external import claude_client, gemini_client


class ScriptService:
    """台本生成サービス"""

    @staticmethod
    async def generate_script(
        db: AsyncSession,
        current_user_role: str,
        request: ScriptGenerateRequest,
    ) -> ScriptGenerateResponse:
        """
        台本を生成

        Claude/Gemini APIを使用して台本を生成
        APIキーが設定されていない場合はスタブデータを返す

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: 台本生成リクエスト

        Returns:
            ScriptGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="台本生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # ナレッジコンテキストを取得（設定されている場合）
        knowledge_context = None
        if request.knowledge_id:
            knowledge = await db.get(Knowledge, request.knowledge_id)
            if knowledge and knowledge.content:
                knowledge_context = knowledge.content[:2000]  # 最大2000文字

        # AI APIで台本生成
        content = None
        word_count = 200
        estimated_duration = request.target_duration or 180
        generator_used = request.generator.value

        # Claudeを選択した場合
        if request.generator == GeneratorType.CLAUDE and claude_client.is_available():
            result = await claude_client.generate_script(
                prompt=request.prompt,
                title=request.title,
                target_duration=request.target_duration or 180,
                style=request.style or "educational",
                knowledge_context=knowledge_context,
            )
            if result.get("content"):
                content = result["content"]
                word_count = result.get("word_count", len(content))
                estimated_duration = result.get("estimated_duration", 180)

        # Geminiを選択した場合
        elif request.generator == GeneratorType.GEMINI and gemini_client.is_available():
            result = await gemini_client.generate_script(
                prompt=request.prompt,
                title=request.title,
                target_duration=request.target_duration or 180,
                style=request.style or "educational",
                knowledge_context=knowledge_context,
            )
            if result.get("content"):
                content = result["content"]
                word_count = result.get("word_count", len(content))
                estimated_duration = result.get("estimated_duration", 180)

        # APIが利用できない場合はスタブデータを使用
        if content is None:
            content = f"""【オープニング】
こんにちは！今日は{request.title or 'このトピック'}についてお話しします。

【本編】
それでは早速見ていきましょう。

まず最初のポイントですが...
（AIによる台本生成のスタブ実装です - {request.generator.value} APIキーが設定されていません）

次に重要なのは...

そして最後に...

【エンディング】
いかがでしたか？
この動画が参考になったらチャンネル登録よろしくお願いします！
"""
            word_count = len(content)

        # 台本をDBに保存
        script = Script(
            video_id=request.video_id,
            knowledge_id=request.knowledge_id,
            title=request.title or "生成された台本",
            prompt=request.prompt,
            generator=request.generator,
            status=ScriptStatus.COMPLETED,
            content=content,
            word_count=word_count,
            estimated_duration=estimated_duration,
            generation_params={
                "generator": generator_used,
                "target_duration": request.target_duration,
                "style": request.style,
                "has_knowledge_context": knowledge_context is not None,
            },
        )
        db.add(script)
        await db.commit()
        await db.refresh(script)

        return ScriptGenerateResponse(
            script_id=script.id,
            status=script.status,
            message="台本の生成が完了しました",
            estimated_completion=0,
        )

    @staticmethod
    async def get_script(
        db: AsyncSession,
        current_user_role: str,
        script_id: UUID,
    ) -> ScriptResponse:
        """
        台本を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            script_id: 台本ID

        Returns:
            ScriptResponse: 台本データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="台本取得にはOwnerまたはTeamロールが必要です",
            )

        script = await db.get(Script, script_id)
        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="台本が見つかりません",
            )

        return ScriptResponse(
            id=script.id,
            video_id=script.video_id,
            knowledge_id=script.knowledge_id,
            title=script.title,
            content=script.content,
            prompt=script.prompt,
            generator=script.generator,
            status=script.status,
            word_count=script.word_count,
            estimated_duration=script.estimated_duration,
            generation_params=script.generation_params,
            created_at=script.created_at,
            updated_at=script.updated_at,
        )

    @staticmethod
    async def update_script(
        db: AsyncSession,
        current_user_role: str,
        script_id: UUID,
        request: ScriptUpdateRequest,
    ) -> ScriptResponse:
        """
        台本を更新

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            script_id: 台本ID
            request: 更新リクエスト

        Returns:
            ScriptResponse: 更新後の台本データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="台本更新にはOwnerまたはTeamロールが必要です",
            )

        script = await db.get(Script, script_id)
        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="台本が見つかりません",
            )

        if request.title is not None:
            script.title = request.title
        if request.content is not None:
            script.content = request.content
            script.word_count = len(request.content)

        script.status = ScriptStatus.EDITED
        script.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(script)

        return await ScriptService.get_script(db, current_user_role, script_id)


class MetadataService:
    """メタデータ生成サービス"""

    @staticmethod
    async def generate_title(
        db: AsyncSession,
        current_user_role: str,
        request: TitleGenerateRequest,
    ) -> TitleGenerateResponse:
        """
        タイトルを生成

        Claude/Gemini APIを使用してタイトル候補を生成
        APIキーが設定されていない場合はスタブデータを返す

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: タイトル生成リクエスト

        Returns:
            TitleGenerateResponse: 生成されたタイトル候補
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="タイトル生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        keywords = request.keywords or ["AI", "効率化"]
        keywords_str = ", ".join(keywords)
        titles = None
        recommended_index = 0

        # Claude APIで生成を試行
        if claude_client.is_available():
            result = await claude_client.generate_title(
                topic=request.topic or keywords_str,
                keywords=keywords,
                style=request.style or "engaging",
                count=request.count or 5,
            )
            if result.get("titles"):
                titles = result["titles"]
                recommended_index = result.get("recommended_index", 0)

        # Claudeが使えない場合はGeminiを試行
        if titles is None and gemini_client.is_available():
            result = await gemini_client.generate_title(
                topic=request.topic or keywords_str,
                keywords=keywords,
                style=request.style or "engaging",
                count=request.count or 5,
            )
            if result.get("titles"):
                titles = result["titles"]
                recommended_index = result.get("recommended_index", 0)

        # APIが利用できない場合はスタブデータを使用
        if titles is None:
            titles = [
                f"【完全攻略】{keywords_str}の全てがわかる！初心者から上級者まで",
                f"知らないと損する{keywords_str}の活用術10選",
                f"プロが教える{keywords_str}の極意【2025年最新版】",
                f"{keywords_str}で人生が変わった話【実体験】",
                f"【保存版】{keywords_str}マスターへの道",
            ]

        # 生成履歴を保存
        metadata_gen = MetadataGeneration(
            video_id=request.video_id,
            metadata_type="title",
            prompt=f"keywords: {keywords_str}, style: {request.style}",
            result=titles[0] if titles else "",
            alternatives=titles[1:] if len(titles) > 1 else [],
        )
        db.add(metadata_gen)
        await db.commit()

        return TitleGenerateResponse(
            video_id=request.video_id,
            titles=titles[: request.count] if request.count else titles,
            recommended_index=recommended_index,
            generated_at=datetime.utcnow(),
        )

    @staticmethod
    async def generate_description(
        db: AsyncSession,
        current_user_role: str,
        request: DescriptionGenerateRequest,
    ) -> DescriptionGenerateResponse:
        """
        説明文を生成

        Claude/Gemini APIを使用して説明文を生成
        APIキーが設定されていない場合はスタブデータを返す

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: 説明文生成リクエスト

        Returns:
            DescriptionGenerateResponse: 生成された説明文
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="説明文生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        title = request.title or "この動画"
        keywords = request.keywords or ["AI", "効率化", "初心者"]
        description = None
        hashtags = None

        # Claude APIで生成を試行
        if claude_client.is_available():
            result = await claude_client.generate_description(
                title=title,
                script_summary=request.script_summary,
                keywords=keywords,
                include_timestamps=request.include_timestamps,
                include_links=request.include_links,
            )
            if result.get("description"):
                description = result["description"]
                hashtags = result.get("hashtags", [])

        # Claudeが使えない場合はGeminiを試行
        if description is None and gemini_client.is_available():
            result = await gemini_client.generate_description(
                title=title,
                script_summary=request.script_summary,
                keywords=keywords,
                include_timestamps=request.include_timestamps,
                include_links=request.include_links,
            )
            if result.get("description"):
                description = result["description"]
                hashtags = result.get("hashtags", [])

        # APIが利用できない場合はスタブデータを使用
        if description is None:
            description_parts = [
                f"📺 {title}",
                "",
                "この動画では、実践的なテクニックを分かりやすく解説しています。",
                "初心者の方でも安心して学べる内容になっています。",
                "",
            ]

            if request.include_timestamps:
                description_parts.extend([
                    "📌 タイムスタンプ",
                    "00:00 オープニング",
                    "00:30 はじめに",
                    "02:00 ポイント1",
                    "05:00 ポイント2",
                    "08:00 まとめ",
                    "",
                ])

            if request.include_links:
                description_parts.extend([
                    "🔗 関連リンク",
                    "▶ チャンネル登録: https://youtube.com/@channel",
                    "▶ 公式サイト: https://example.com",
                    "",
                ])

            description_parts.extend([
                "━━━━━━━━━━━━━━━━",
                "💬 コメント欄で感想をお聞かせください！",
                "👍 いいね＆チャンネル登録お願いします！",
            ])

            description = "\n".join(description_parts)
            hashtags = [f"#{kw.replace(' ', '')}" for kw in keywords]

        # 生成履歴を保存
        metadata_gen = MetadataGeneration(
            video_id=request.video_id,
            metadata_type="description",
            prompt=f"title: {title}",
            result=description,
        )
        db.add(metadata_gen)
        await db.commit()

        return DescriptionGenerateResponse(
            video_id=request.video_id,
            description=description,
            hashtags=hashtags or [],
            generated_at=datetime.utcnow(),
        )


class ThumbnailService:
    """サムネイル生成サービス"""

    @staticmethod
    async def generate_thumbnail(
        db: AsyncSession,
        current_user_role: str,
        request: ThumbnailGenerateRequest,
    ) -> ThumbnailGenerateResponse:
        """
        サムネイルを生成

        Imagen/Nano Banana API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: サムネイル生成リクエスト

        Returns:
            ThumbnailGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="サムネイル生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # サムネイル作成（スタブ：即座に完了）
        thumbnail = Thumbnail(
            video_id=request.video_id,
            prompt=request.prompt or f"YouTube thumbnail for: {request.title}",
            image_url="https://example.com/thumbnails/generated_thumbnail.jpg",
            status=ThumbnailStatus.COMPLETED,
            width=1280,
            height=720,
            generation_params={
                "style": request.style,
                "include_text": request.include_text,
                "text_content": request.text_content,
            },
        )
        db.add(thumbnail)
        await db.commit()
        await db.refresh(thumbnail)

        return ThumbnailGenerateResponse(
            thumbnail_id=thumbnail.id,
            status=thumbnail.status,
            message="サムネイルの生成が完了しました",
            estimated_completion=0,
        )

    @staticmethod
    async def get_thumbnail(
        db: AsyncSession,
        current_user_role: str,
        thumbnail_id: UUID,
    ) -> ThumbnailResponse:
        """
        サムネイルを取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            thumbnail_id: サムネイルID

        Returns:
            ThumbnailResponse: サムネイルデータ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="サムネイル取得にはOwnerまたはTeamロールが必要です",
            )

        thumbnail = await db.get(Thumbnail, thumbnail_id)
        if not thumbnail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="サムネイルが見つかりません",
            )

        return ThumbnailResponse(
            id=thumbnail.id,
            video_id=thumbnail.video_id,
            prompt=thumbnail.prompt,
            image_url=thumbnail.image_url,
            status=thumbnail.status,
            width=thumbnail.width,
            height=thumbnail.height,
            generation_params=thumbnail.generation_params,
            created_at=thumbnail.created_at,
        )
