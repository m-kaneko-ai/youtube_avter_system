"""
CTA管理スキーマ

Pydanticスキーマ定義
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum


class CTATypeEnum(str, Enum):
    """CTAタイプ"""
    LINE = "line"
    EMAIL = "email"
    DOWNLOAD = "download"
    DISCORD = "discord"
    WEBINAR = "webinar"
    LP = "lp"
    CUSTOM = "custom"


class CTAPlacementEnum(str, Enum):
    """CTA配置場所"""
    DESCRIPTION_TOP = "description_top"
    DESCRIPTION_BOTTOM = "description_bottom"
    PINNED_COMMENT = "pinned_comment"


class UTMParams(BaseModel):
    """UTMパラメータ"""
    source: Optional[str] = Field(None, description="ソース（例: youtube）")
    medium: Optional[str] = Field(None, description="メディウム（例: video）")
    campaign: Optional[str] = Field(None, description="キャンペーン名")


class CTABase(BaseModel):
    """CTA基本スキーマ"""
    name: str = Field(..., min_length=1, max_length=200, description="CTA名")
    type: CTATypeEnum = Field(..., description="CTAタイプ")
    url: str = Field(..., description="リンクURL")
    utm_params: Optional[UTMParams] = Field(None, description="UTMパラメータ")
    display_text: str = Field(..., min_length=1, description="表示テキスト")
    placement: CTAPlacementEnum = Field(
        CTAPlacementEnum.DESCRIPTION_TOP,
        description="配置場所"
    )
    is_active: bool = Field(True, description="有効/無効")


class CTACreate(CTABase):
    """CTA作成スキーマ"""
    generate_short_url: bool = Field(False, description="短縮URL生成フラグ")


class CTAUpdate(BaseModel):
    """CTA更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="CTA名")
    type: Optional[CTATypeEnum] = Field(None, description="CTAタイプ")
    url: Optional[str] = Field(None, description="リンクURL")
    utm_params: Optional[UTMParams] = Field(None, description="UTMパラメータ")
    display_text: Optional[str] = Field(None, min_length=1, description="表示テキスト")
    placement: Optional[CTAPlacementEnum] = Field(None, description="配置場所")
    is_active: Optional[bool] = Field(None, description="有効/無効")
    generate_short_url: bool = Field(False, description="短縮URL生成フラグ")


class CTAResponse(CTABase):
    """CTAレスポンススキーマ"""
    id: str = Field(..., description="CTA ID")
    short_url: Optional[str] = Field(None, description="短縮URL")
    conversion_count: int = Field(0, description="コンバージョン数")
    ctr: Optional[float] = Field(0.0, description="CTR（%）")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class CTAStats(BaseModel):
    """CTA統計情報"""
    total_ctas: int = Field(..., description="総CTA数")
    active_ctas: int = Field(..., description="有効なCTA数")
    total_clicks: int = Field(..., description="総クリック数")
    avg_ctr: float = Field(..., description="平均CTR")


class CTAListResponse(BaseModel):
    """CTA一覧レスポンス"""
    ctas: List[CTAResponse] = Field(..., description="CTA一覧")
    total: int = Field(..., description="総数")
    stats: CTAStats = Field(..., description="統計情報")


class VideoCTAAssignmentCreate(BaseModel):
    """動画CTA割り当て作成スキーマ"""
    video_id: str = Field(..., description="動画ID")
    top_cta_id: Optional[str] = Field(None, description="説明欄上部CTA ID")
    bottom_cta_id: Optional[str] = Field(None, description="説明欄下部CTA ID")
    pinned_comment_cta_id: Optional[str] = Field(None, description="固定コメントCTA ID")


class VideoCTAAssignmentResponse(BaseModel):
    """動画CTA割り当てレスポンス"""
    video_id: str = Field(..., description="動画ID")
    top_cta: Optional[CTAResponse] = Field(None, description="説明欄上部CTA")
    bottom_cta: Optional[CTAResponse] = Field(None, description="説明欄下部CTA")
    pinned_comment_cta: Optional[CTAResponse] = Field(None, description="固定コメントCTA")


class UTMDefaultSettingsBase(BaseModel):
    """UTMデフォルト設定基本スキーマ"""
    default_source: str = Field("youtube", description="デフォルトソース")
    default_medium: str = Field("video", description="デフォルトメディウム")
    campaign_naming_rule: str = Field("{video_id}_{cta_type}", description="キャンペーン命名規則")


class UTMDefaultSettingsResponse(UTMDefaultSettingsBase):
    """UTMデフォルト設定レスポンス"""
    id: str = Field(..., description="設定ID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class CTAClickLogResponse(BaseModel):
    """CTAクリックログレスポンス"""
    id: str = Field(..., description="ログID")
    cta_id: str = Field(..., description="CTA ID")
    video_id: Optional[str] = Field(None, description="動画ID")
    clicked_at: datetime = Field(..., description="クリック日時")

    class Config:
        from_attributes = True


class CTADailyStats(BaseModel):
    """CTA日別統計"""
    date: str = Field(..., description="日付（YYYY-MM-DD）")
    clicks: int = Field(..., description="クリック数")


class CTADetailStats(BaseModel):
    """CTA詳細統計"""
    cta_id: str = Field(..., description="CTA ID")
    clicks: int = Field(..., description="クリック数")
    ctr: float = Field(..., description="CTR")
    daily_clicks: List[CTADailyStats] = Field(default_factory=list, description="日別クリック数")


class GeneratedDescriptionWithCTA(BaseModel):
    """CTA付き説明文生成結果"""
    description: str = Field(..., description="CTA挿入済み説明文")
    top_cta_text: Optional[str] = Field(None, description="上部CTAテキスト")
    bottom_cta_text: Optional[str] = Field(None, description="下部CTAテキスト")
