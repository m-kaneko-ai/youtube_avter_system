#!/bin/bash
# Creator Studio AI - GitHub Secrets 設定ヘルパー
# 対話形式で必要な情報を収集し、GitHub Secrets用のコマンドを生成します

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo -e "${BLUE}🚀 Creator Studio AI${NC}"
echo -e "${BLUE}   GitHub Secrets 設定ヘルパー${NC}"
echo "========================================"
echo ""

# 出力ファイル
OUTPUT_FILE="github-secrets-$(date +%Y%m%d-%H%M%S).txt"

# 一時ファイルに保存する関数
save_secret() {
    local name=$1
    local value=$2
    echo "gh secret set $name --body '$value'" >> "$OUTPUT_FILE"
}

echo -e "${YELLOW}📋 このスクリプトは以下を行います:${NC}"
echo "   1. 必要な情報を対話形式で収集"
echo "   2. GitHub Secrets設定用のコマンドを生成"
echo "   3. コマンドをファイルに保存"
echo ""
echo -e "${RED}⚠️  注意: 入力した値はファイルに保存されます。${NC}"
echo -e "${RED}   完了後、ファイルを安全に削除してください。${NC}"
echo ""
read -p "続行しますか？ (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "キャンセルしました。"
    exit 0
fi

echo ""
echo "========================================"
echo -e "${GREEN}1. GCP設定${NC}"
echo "========================================"
echo ""

read -p "GCPプロジェクトID (例: creator-studio-ai-prod): " GCP_PROJECT_ID
save_secret "GCP_PROJECT_ID" "$GCP_PROJECT_ID"

echo ""
echo -e "${YELLOW}GCPサービスアカウントキー:${NC}"
echo "   1. GCPコンソール > IAM > サービスアカウント"
echo "   2. 新規作成 or 既存を選択"
echo "   3. 「キーを追加」> JSON"
echo "   4. ダウンロードしたファイルをBase64エンコード:"
echo -e "      ${BLUE}cat path/to/key.json | base64 | tr -d '\\n'${NC}"
echo ""
read -p "Base64エンコードしたキー（長い文字列）: " GCP_SA_KEY
save_secret "GCP_SA_KEY" "$GCP_SA_KEY"

read -p "GCSバケット名 (例: creator-studio-ai-prod): " GCS_BUCKET_NAME
save_secret "GCS_BUCKET_NAME" "$GCS_BUCKET_NAME"

echo ""
echo "========================================"
echo -e "${GREEN}2. データベース設定${NC}"
echo "========================================"
echo ""

echo -e "${YELLOW}Neon PostgreSQL:${NC}"
echo "   1. https://console.neon.tech/"
echo "   2. プロジェクト > Connection Details"
echo "   3. 接続文字列をコピー"
echo ""
read -p "DATABASE_URL (postgresql://...): " DATABASE_URL
save_secret "DATABASE_URL" "$DATABASE_URL"

echo ""
echo -e "${YELLOW}Upstash Redis:${NC}"
echo "   1. https://console.upstash.com/"
echo "   2. Database > Details"
echo "   3. TLS Endpoint (rediss://...) をコピー"
echo ""
read -p "REDIS_URL (rediss://...): " REDIS_URL
save_secret "REDIS_URL" "$REDIS_URL"

echo ""
echo "========================================"
echo -e "${GREEN}3. 認証設定${NC}"
echo "========================================"
echo ""

# JWT/Session Secret自動生成
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
save_secret "JWT_SECRET" "$JWT_SECRET"
save_secret "SESSION_SECRET" "$SESSION_SECRET"
echo -e "${GREEN}✅ JWT_SECRET と SESSION_SECRET を自動生成しました${NC}"

echo ""
echo -e "${YELLOW}Google OAuth:${NC}"
echo "   1. https://console.cloud.google.com/apis/credentials"
echo "   2. OAuth 2.0 クライアント ID"
echo ""
read -p "GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
save_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"

read -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
save_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"

echo ""
echo "========================================"
echo -e "${GREEN}4. AI APIキー${NC}"
echo "========================================"
echo ""

echo -e "${YELLOW}Claude API:${NC}"
echo "   https://console.anthropic.com/settings/keys"
echo ""
read -p "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
save_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

echo ""
echo -e "${YELLOW}Gemini API:${NC}"
echo "   https://aistudio.google.com/app/apikey"
echo ""
read -p "GEMINI_API_KEY: " GEMINI_API_KEY
save_secret "GEMINI_API_KEY" "$GEMINI_API_KEY"

echo ""
echo -e "${YELLOW}YouTube Data API:${NC}"
echo "   https://console.cloud.google.com/apis/credentials"
echo ""
read -p "YOUTUBE_API_KEY: " YOUTUBE_API_KEY
save_secret "YOUTUBE_API_KEY" "$YOUTUBE_API_KEY"

echo ""
echo "========================================"
echo -e "${GREEN}5. Vercel設定${NC}"
echo "========================================"
echo ""

echo -e "${YELLOW}Vercel:${NC}"
echo "   1. https://vercel.com/account/tokens でトークン作成"
echo "   2. プロジェクト設定 > General で ID確認"
echo ""
read -p "VERCEL_TOKEN: " VERCEL_TOKEN
save_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"

read -p "VERCEL_ORG_ID: " VERCEL_ORG_ID
save_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"

read -p "VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID
save_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"

echo ""
echo "========================================"
echo -e "${GREEN}6. オプション設定（スキップ可）${NC}"
echo "========================================"
echo ""

read -p "OpenAI API Key（空でスキップ）: " OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    save_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
fi

read -p "Slack Webhook URL（空でスキップ）: " SLACK_WEBHOOK_URL
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    save_secret "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ 完了！${NC}"
echo "========================================"
echo ""
echo -e "GitHub Secretsコマンドを ${BLUE}$OUTPUT_FILE${NC} に保存しました。"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo ""
echo "1. GitHubリポジトリのルートに移動"
echo ""
echo "2. GitHub CLIでログイン:"
echo -e "   ${BLUE}gh auth login${NC}"
echo ""
echo "3. Secretsを登録:"
echo -e "   ${BLUE}source $OUTPUT_FILE${NC}"
echo ""
echo "4. 登録確認:"
echo -e "   ${BLUE}gh secret list${NC}"
echo ""
echo "5. ファイルを削除（セキュリティ）:"
echo -e "   ${BLUE}rm $OUTPUT_FILE${NC}"
echo ""
echo "========================================"
