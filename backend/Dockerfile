# Creator Studio AI - Backend Dockerfile
# Python 3.11 + FastAPI
# マルチステージビルドで最適化

# ===== Builder Stage =====
FROM python:3.11-slim AS builder

# 作業ディレクトリ設定
WORKDIR /app

# システム依存パッケージのインストール（ビルド用）
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ===== Runtime Stage =====
FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# 非rootユーザー作成（セキュリティ向上）
RUN groupadd -r appuser && useradd -r -g appuser appuser

# システム依存パッケージのインストール（ランタイム用）
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Builderからpipパッケージをコピー
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# アプリケーションコードをコピー
COPY --chown=appuser:appuser . .

# Cloud Run用のポート（8080）
ENV PORT=8080

# 本番環境設定
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENVIRONMENT=production

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# 非rootユーザーで実行
USER appuser

# uvicornでFastAPIを起動
# --workers: CPU数に応じて調整（Cloud Runは1-4推奨）
# --timeout-keep-alive: Cloud Runのタイムアウトに合わせて設定
CMD exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --workers 2 \
    --timeout-keep-alive 65 \
    --log-level info \
    --access-log
