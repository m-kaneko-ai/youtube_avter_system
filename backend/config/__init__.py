"""
環境別設定モジュール

開発環境、ステージング環境、本番環境の設定を管理
"""
from .production import ProductionConfig, get_production_config

__all__ = ["ProductionConfig", "get_production_config"]
