# Creator Studio AI - Backend Dockerfile
# Python 3.11 + FastAPI

FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# システム依存パッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# Cloud Run用のポート（8080）
ENV PORT=8080

# 本番環境設定
ENV NODE_ENV=production

# uvicornでFastAPIを起動
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
