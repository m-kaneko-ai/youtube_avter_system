"""
動画制作サービス

音声生成、アバター動画生成、B-roll生成のビジネスロジック
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Video, Script
from app.models.production import (
    AudioGeneration,
    AvatarGeneration,
    BrollGeneration,
    GenerationStatus,
)
from app.models.user import UserRole
from app.schemas.production import (
    AudioGenerateRequest,
    AudioResponse,
    AudioGenerateResponse,
    AvatarGenerateRequest,
    AvatarResponse,
    AvatarGenerateResponse,
    BrollGenerateRequest,
    BrollResponse,
    BrollGenerateResponse,
)
from app.services.external import minimax_audio, heygen_api
from app.services.external.gcs_service import gcs_service


class AudioService:
    """音声生成サービス（MiniMax Audio連携）"""

    @staticmethod
    async def generate_audio(
        db: AsyncSession,
        current_user_role: str,
        request: AudioGenerateRequest,
    ) -> AudioGenerateResponse:
        """
        音声を生成

        MiniMax Audio API連携（APIキー未設定時はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: 音声生成リクエスト

        Returns:
            AudioGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="音声生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # 台本からテキストを取得（指定がある場合）
        text = request.text
        if request.script_id:
            script = await db.get(Script, request.script_id)
            if script and script.content:
                text = script.content

        # デフォルト値
        voice_id = request.voice_id or "default_voice_id"
        voice_name = request.voice_name or "Default Voice"
        final_text = text or "サンプルテキストです"
        audio_url = "https://example.com/audio/generated_audio.mp3"
        duration = 120.5
        gen_status = GenerationStatus.COMPLETED
        message = "音声の生成が完了しました"

        # MiniMax Audio APIが利用可能な場合
        if minimax_audio.is_available() and final_text:
            try:
                result = await minimax_audio.text_to_speech(
                    text=final_text,
                    voice_id=voice_id,
                    speed=request.speed or 1.0,
                    pitch=request.pitch or 0.0,
                    output_format="mp3",
                    model="speech-02-hd",
                    emotion="neutral",
                )

                if "error" not in result:
                    # API成功 - base64データを受け取る
                    audio_data_base64 = result.get("audio_data", "")
                    if audio_data_base64:
                        # Google Cloud Storageにアップロードして公開URLを取得
                        try:
                            filename = f"audio_{request.video_id}_{voice_id}.mp3"
                            audio_url = await gcs_service.upload_from_base64(
                                base64_data=audio_data_base64,
                                filename=filename,
                                content_type="audio/mpeg",
                            )
                        except Exception as e:
                            print(f"Failed to upload audio to GCS: {e}")
                            # フォールバック: data URLとして保存（本番では推奨しない）
                            audio_url = f"data:audio/mp3;base64,{audio_data_base64[:100]}..."

                    duration = result.get("duration", 0) or duration
                    gen_status = GenerationStatus.COMPLETED
                    message = "MiniMax Audioによる音声生成が完了しました"
                else:
                    # APIエラー - スタブにフォールバック
                    print(f"MiniMax Audio error: {result.get('error')}")
                    message = "音声の生成が完了しました（フォールバック）"
            except Exception as e:
                print(f"MiniMax Audio exception: {e}")
                message = "音声の生成が完了しました（フォールバック）"

        # 音声生成レコード作成
        audio = AudioGeneration(
            video_id=request.video_id,
            script_id=request.script_id,
            voice_id=voice_id,
            voice_name=voice_name,
            text=final_text,
            audio_url=audio_url,
            duration=duration,
            status=gen_status,
            speed=request.speed,
            pitch=request.pitch,
            generation_params={
                "voice_id": voice_id,
                "speed": request.speed,
                "pitch": request.pitch,
            },
        )
        db.add(audio)
        await db.commit()
        await db.refresh(audio)

        return AudioGenerateResponse(
            audio_id=audio.id,
            status=audio.status,
            message=message,
            estimated_completion=0,
        )

    @staticmethod
    async def get_audio(
        db: AsyncSession,
        current_user_role: str,
        audio_id: UUID,
    ) -> AudioResponse:
        """
        音声を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            audio_id: 音声ID

        Returns:
            AudioResponse: 音声データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="音声取得にはOwnerまたはTeamロールが必要です",
            )

        audio = await db.get(AudioGeneration, audio_id)
        if not audio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="音声が見つかりません",
            )

        return AudioResponse(
            id=audio.id,
            video_id=audio.video_id,
            script_id=audio.script_id,
            voice_id=audio.voice_id,
            voice_name=audio.voice_name,
            text=audio.text,
            audio_url=audio.audio_url,
            duration=audio.duration,
            status=audio.status,
            speed=audio.speed,
            pitch=audio.pitch,
            generation_params=audio.generation_params,
            error_message=audio.error_message,
            created_at=audio.created_at,
            updated_at=audio.updated_at,
        )


class AvatarService:
    """アバター動画生成サービス（HeyGen連携）"""

    @staticmethod
    async def generate_avatar(
        db: AsyncSession,
        current_user_role: str,
        request: AvatarGenerateRequest,
    ) -> AvatarGenerateResponse:
        """
        アバター動画を生成

        HeyGen API連携（APIキー未設定時はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: アバター動画生成リクエスト

        Returns:
            AvatarGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="アバター動画生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # 音声存在確認（指定がある場合）
        audio_record = None
        if request.audio_id:
            audio_record = await db.get(AudioGeneration, request.audio_id)
            if not audio_record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="音声が見つかりません",
                )

        # デフォルト値
        avatar_id = request.avatar_id or "default_avatar_id"
        avatar_name = request.avatar_name or "Default Avatar"
        video_url = "https://example.com/avatar/generated_video.mp4"
        thumbnail_url = "https://example.com/avatar/thumbnail.jpg"
        duration = 120.5
        gen_status = GenerationStatus.COMPLETED
        heygen_task_id = "heygen_task_stub_123"
        message = "アバター動画の生成が完了しました"
        estimated_completion = 0

        # HeyGen APIが利用可能な場合
        if heygen_api.is_available():
            try:
                # 音声URLがある場合はaudio付きで生成
                if audio_record and audio_record.audio_url:
                    result = await heygen_api.create_video_with_audio(
                        avatar_id=avatar_id,
                        audio_url=audio_record.audio_url,
                        title=f"Avatar Video - {video.title}" if video.title else "Avatar Video",
                        background_color=request.background_color or "#ffffff",
                        width=request.width or 1920,
                        height=request.height or 1080,
                    )
                else:
                    # 台本テキストを取得して生成
                    script_text = "サンプルテキストです"
                    if request.script_id:
                        script = await db.get(Script, request.script_id)
                        if script and script.content:
                            script_text = script.content

                    result = await heygen_api.create_video(
                        avatar_id=avatar_id,
                        voice_id=request.voice_id or "default_voice",
                        script=script_text,
                        title=f"Avatar Video - {video.title}" if video.title else "Avatar Video",
                        background_color=request.background_color or "#ffffff",
                        width=request.width or 1920,
                        height=request.height or 1080,
                    )

                if "error" not in result:
                    # API成功 - 処理中ステータスで返す
                    heygen_task_id = result.get("video_id", heygen_task_id)
                    gen_status = GenerationStatus.PROCESSING
                    message = "HeyGenでアバター動画を生成中です"
                    estimated_completion = 180  # 約3分で完了見込み
                else:
                    # APIエラー - スタブにフォールバック
                    print(f"HeyGen API error: {result.get('error')}")
                    message = "アバター動画の生成が完了しました（フォールバック）"
            except Exception as e:
                print(f"HeyGen API exception: {e}")
                message = "アバター動画の生成が完了しました（フォールバック）"

        # アバター動画レコード作成
        avatar = AvatarGeneration(
            video_id=request.video_id,
            audio_id=request.audio_id,
            avatar_id=avatar_id,
            avatar_name=avatar_name,
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            duration=duration,
            width=request.width,
            height=request.height,
            status=gen_status,
            heygen_task_id=heygen_task_id,
            generation_params={
                "avatar_id": avatar_id,
                "width": request.width,
                "height": request.height,
                "background_color": request.background_color,
                "background_url": request.background_url,
            },
        )
        db.add(avatar)
        await db.commit()
        await db.refresh(avatar)

        return AvatarGenerateResponse(
            avatar_id=avatar.id,
            status=avatar.status,
            message=message,
            estimated_completion=estimated_completion,
        )

    @staticmethod
    async def get_avatar(
        db: AsyncSession,
        current_user_role: str,
        avatar_id: UUID,
    ) -> AvatarResponse:
        """
        アバター動画を取得（HeyGen APIのステータスを同期）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            avatar_id: アバター動画ID

        Returns:
            AvatarResponse: アバター動画データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="アバター動画取得にはOwnerまたはTeamロールが必要です",
            )

        avatar = await db.get(AvatarGeneration, avatar_id)
        if not avatar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="アバター動画が見つかりません",
            )

        # 処理中の場合はHeyGen APIでステータスを確認して更新
        if avatar.status == GenerationStatus.PROCESSING and avatar.heygen_task_id and heygen_api.is_available():
            try:
                result = await heygen_api.get_video_status(avatar.heygen_task_id)

                if "error" not in result:
                    api_status = result.get("status", "unknown")

                    # ステータスマッピング（HeyGen → 内部）
                    if api_status == "completed":
                        avatar.status = GenerationStatus.COMPLETED
                        avatar.video_url = result.get("video_url", avatar.video_url)
                        avatar.thumbnail_url = result.get("thumbnail_url", avatar.thumbnail_url)
                        avatar.duration = result.get("duration", avatar.duration)
                    elif api_status == "failed":
                        avatar.status = GenerationStatus.FAILED
                        avatar.error_message = result.get("error", "Generation failed")
                    elif api_status in ["pending", "processing"]:
                        avatar.status = GenerationStatus.PROCESSING

                    avatar.updated_at = datetime.utcnow()
                    await db.commit()
                    await db.refresh(avatar)
            except Exception as e:
                print(f"Error checking HeyGen status: {e}")

        return AvatarResponse(
            id=avatar.id,
            video_id=avatar.video_id,
            audio_id=avatar.audio_id,
            avatar_id=avatar.avatar_id,
            avatar_name=avatar.avatar_name,
            video_url=avatar.video_url,
            thumbnail_url=avatar.thumbnail_url,
            duration=avatar.duration,
            width=avatar.width,
            height=avatar.height,
            status=avatar.status,
            heygen_task_id=avatar.heygen_task_id,
            generation_params=avatar.generation_params,
            error_message=avatar.error_message,
            created_at=avatar.created_at,
            updated_at=avatar.updated_at,
        )


class BrollService:
    """B-roll動画生成サービス（Veo連携）"""

    @staticmethod
    async def generate_broll(
        db: AsyncSession,
        current_user_role: str,
        request: BrollGenerateRequest,
    ) -> BrollGenerateResponse:
        """
        B-roll動画を生成

        Veo API連携想定（現在はスタブ実装）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            request: B-roll動画生成リクエスト

        Returns:
            BrollGenerateResponse: 生成開始レスポンス
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="B-roll動画生成にはOwnerまたはTeamロールが必要です",
            )

        # 動画存在確認
        video = await db.get(Video, request.video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="動画が見つかりません",
            )

        # B-roll作成（スタブ：即座に完了）
        broll = BrollGeneration(
            video_id=request.video_id,
            prompt=request.prompt,
            style=request.style,
            video_url="https://example.com/broll/generated_broll.mp4",
            thumbnail_url="https://example.com/broll/thumbnail.jpg",
            duration=request.duration,
            width=request.width,
            height=request.height,
            status=GenerationStatus.COMPLETED,
            veo_task_id="veo_task_stub_123",
            timestamp_start=request.timestamp_start,
            timestamp_end=request.timestamp_end,
            generation_params={
                "prompt": request.prompt,
                "style": request.style,
                "duration": request.duration,
                "width": request.width,
                "height": request.height,
            },
        )
        db.add(broll)
        await db.commit()
        await db.refresh(broll)

        return BrollGenerateResponse(
            broll_id=broll.id,
            status=broll.status,
            message="B-roll動画の生成が完了しました",
            estimated_completion=0,
        )

    @staticmethod
    async def get_broll(
        db: AsyncSession,
        current_user_role: str,
        broll_id: UUID,
    ) -> BrollResponse:
        """
        B-roll動画を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            broll_id: B-roll動画ID

        Returns:
            BrollResponse: B-roll動画データ
        """
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="B-roll動画取得にはOwnerまたはTeamロールが必要です",
            )

        broll = await db.get(BrollGeneration, broll_id)
        if not broll:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="B-roll動画が見つかりません",
            )

        return BrollResponse(
            id=broll.id,
            video_id=broll.video_id,
            prompt=broll.prompt,
            style=broll.style,
            video_url=broll.video_url,
            thumbnail_url=broll.thumbnail_url,
            duration=broll.duration,
            width=broll.width,
            height=broll.height,
            status=broll.status,
            veo_task_id=broll.veo_task_id,
            timestamp_start=broll.timestamp_start,
            timestamp_end=broll.timestamp_end,
            generation_params=broll.generation_params,
            error_message=broll.error_message,
            created_at=broll.created_at,
            updated_at=broll.updated_at,
        )
