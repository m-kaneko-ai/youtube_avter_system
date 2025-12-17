#!/bin/bash

###############################################################################
# データベースバックアップスクリプト
#
# 使い方:
#   ./backup.sh [環境]
#
# 環境:
#   - production (デフォルト)
#   - staging
#   - development
#
# 必要な環境変数:
#   DATABASE_URL: PostgreSQLの接続URL
#   GCS_BUCKET: Google Cloud Storageバケット名（オプション）
###############################################################################

set -e  # エラーが発生したら即座に終了

# 設定
ENVIRONMENT="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)
BACKUP_FILE="backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
RETENTION_DAYS=30

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 環境変数読み込み
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    log_info ".env.localから環境変数を読み込み中..."
    export $(cat "$PROJECT_ROOT/.env.local" | grep -v '^#' | xargs)
else
    log_error ".env.localが見つかりません"
    exit 1
fi

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URLが設定されていません"
    exit 1
fi

# バックアップディレクトリの作成
mkdir -p "$BACKUP_DIR"

log_info "データベースバックアップを開始します..."
log_info "環境: $ENVIRONMENT"
log_info "バックアップ先: $BACKUP_PATH"

# PostgreSQLダンプの実行
log_info "pg_dumpを実行中..."
if pg_dump "$DATABASE_URL" > "$BACKUP_PATH"; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_info "バックアップ完了: $BACKUP_FILE (サイズ: $BACKUP_SIZE)"
else
    log_error "pg_dumpが失敗しました"
    exit 1
fi

# gzip圧縮
log_info "バックアップファイルを圧縮中..."
gzip "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"
COMPRESSED_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log_info "圧縮完了: ${BACKUP_FILE}.gz (サイズ: $COMPRESSED_SIZE)"

# Google Cloud Storageにアップロード（オプション）
if [ -n "$GCS_BUCKET" ]; then
    log_info "Google Cloud Storageにアップロード中..."
    GCS_PATH="gs://$GCS_BUCKET/backups/${ENVIRONMENT}/${BACKUP_FILE}.gz"

    if gsutil cp "$BACKUP_PATH" "$GCS_PATH"; then
        log_info "GCSアップロード完了: $GCS_PATH"

        # 古いバックアップの削除（保持期間を超えたもの）
        log_info "${RETENTION_DAYS}日以上前のバックアップを削除中..."
        CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d)

        # GCS上の古いバックアップをリストアップして削除
        gsutil ls "gs://$GCS_BUCKET/backups/${ENVIRONMENT}/" | while read -r backup; do
            BACKUP_DATE=$(echo "$backup" | grep -oP '\d{8}' | head -n1)
            if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
                log_info "削除: $backup"
                gsutil rm "$backup" || log_warn "削除に失敗: $backup"
            fi
        done
    else
        log_error "GCSアップロードに失敗しました"
        # GCSアップロード失敗でも、ローカルバックアップは成功しているので続行
    fi
else
    log_warn "GCS_BUCKETが設定されていないため、GCSアップロードをスキップします"
fi

# ローカルの古いバックアップを削除
log_info "ローカルの${RETENTION_DAYS}日以上前のバックアップを削除中..."
find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 完了メッセージ
log_info "✅ バックアップが完了しました"
log_info "ローカル: $BACKUP_PATH"
if [ -n "$GCS_BUCKET" ]; then
    log_info "GCS: $GCS_PATH"
fi

# Slack通知（オプション）
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slackに通知を送信中..."
    SLACK_MESSAGE="{\"text\":\"✅ データベースバックアップ完了\",\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"*データベースバックアップ完了*\"}},{\"type\":\"section\",\"fields\":[{\"type\":\"mrkdwn\",\"text\":\"*環境:*\\n${ENVIRONMENT}\"},{\"type\":\"mrkdwn\",\"text\":\"*サイズ:*\\n${COMPRESSED_SIZE}\"},{\"type\":\"mrkdwn\",\"text\":\"*ファイル名:*\\n${BACKUP_FILE}.gz\"},{\"type\":\"mrkdwn\",\"text\":\"*日時:*\\n$(date '+%Y-%m-%d %H:%M:%S')\"}]}]}"

    curl -X POST -H 'Content-type: application/json' --data "$SLACK_MESSAGE" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || log_warn "Slack通知の送信に失敗しました"
fi

exit 0
