"""
CTA管理モデル

CTAテンプレート、UTM設定、動画への割り当て
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLAlchemyEnum, Boolean, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class CTAType(str, enum.Enum):
    """CTAタイプ"""
    LINE = "line"
    EMAIL = "email"
    DOWNLOAD = "download"
    DISCORD = "discord"
    WEBINAR = "webinar"
    LP = "lp"
    CUSTOM = "custom"


class CTAPlacement(str, enum.Enum):
    """CTA配置場所"""
    DESCRIPTION_TOP = "description_top"
    DESCRIPTION_BOTTOM = "description_bottom"
    PINNED_COMMENT = "pinned_comment"


class CTATemplate(Base):
    """CTAテンプレートテーブル"""
    __tablename__ = "cta_templates"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="CTA ID（UUID）"
    )
    name = Column(
        String(200),
        nullable=False,
        index=True,
        comment="CTA名"
    )
    type = Column(
        SQLAlchemyEnum(CTAType),
        nullable=False,
        index=True,
        comment="CTAタイプ"
    )
    url = Column(
        Text,
        nullable=False,
        comment="リンクURL"
    )
    utm_params = Column(
        JSONB,
        nullable=True,
        comment="UTMパラメータ（source, medium, campaign）"
    )
    short_url = Column(
        String(500),
        nullable=True,
        comment="短縮URL"
    )
    display_text = Column(
        Text,
        nullable=False,
        comment="表示テキスト"
    )
    placement = Column(
        SQLAlchemyEnum(CTAPlacement),
        nullable=False,
        default=CTAPlacement.DESCRIPTION_TOP,
        index=True,
        comment="配置場所"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="有効/無効"
    )
    conversion_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="コンバージョン数（クリック数）"
    )
    ctr = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="CTR（クリック率 %）"
    )
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="作成者ID"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="更新日時"
    )

    # リレーション
    creator = relationship("User", backref="created_ctas")
    video_assignments = relationship("VideoCTAAssignment", back_populates="cta", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CTATemplate(name={self.name}, type={self.type})>"


class VideoCTAAssignment(Base):
    """動画へのCTA割り当てテーブル"""
    __tablename__ = "video_cta_assignments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="割り当てID（UUID）"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="動画ID"
    )
    cta_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cta_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="CTA ID"
    )
    placement = Column(
        SQLAlchemyEnum(CTAPlacement),
        nullable=False,
        index=True,
        comment="配置場所"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="有効/無効"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="更新日時"
    )

    # リレーション
    video = relationship("Video", backref="cta_assignments")
    cta = relationship("CTATemplate", back_populates="video_assignments")

    def __repr__(self) -> str:
        return f"<VideoCTAAssignment(video_id={self.video_id}, cta_id={self.cta_id})>"


class UTMDefaultSettings(Base):
    """UTMデフォルト設定テーブル"""
    __tablename__ = "utm_default_settings"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="設定ID（UUID）"
    )
    default_source = Column(
        String(100),
        nullable=False,
        default="youtube",
        comment="デフォルトソース"
    )
    default_medium = Column(
        String(100),
        nullable=False,
        default="video",
        comment="デフォルトメディウム"
    )
    campaign_naming_rule = Column(
        String(200),
        nullable=False,
        default="{video_id}_{cta_type}",
        comment="キャンペーン命名規則"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="作成日時"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="更新日時"
    )

    def __repr__(self) -> str:
        return f"<UTMDefaultSettings(source={self.default_source})>"


class CTAClickLog(Base):
    """CTAクリックログテーブル"""
    __tablename__ = "cta_click_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="ログID（UUID）"
    )
    cta_id = Column(
        UUID(as_uuid=True),
        ForeignKey("cta_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="CTA ID"
    )
    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="動画ID"
    )
    clicked_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="クリック日時"
    )
    ip_address = Column(
        String(50),
        nullable=True,
        comment="IPアドレス"
    )
    user_agent = Column(
        String(500),
        nullable=True,
        comment="ユーザーエージェント"
    )
    referrer = Column(
        Text,
        nullable=True,
        comment="リファラー"
    )
    utm_params = Column(
        JSONB,
        nullable=True,
        comment="クリック時のUTMパラメータ"
    )

    # リレーション
    cta = relationship("CTATemplate", backref="click_logs")

    def __repr__(self) -> str:
        return f"<CTAClickLog(cta_id={self.cta_id}, clicked_at={self.clicked_at})>"
