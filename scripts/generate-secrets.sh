#!/bin/bash

# ===================================
# Creator Studio AI - シークレット生成スクリプト
# ===================================
#
# このスクリプトは本番デプロイに必要なシークレットを生成します。
#
# 使用方法:
#   chmod +x generate-secrets.sh
#   ./generate-secrets.sh
#
# 作成日: 2025-12-17
# ===================================

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Creator Studio AI${NC}"
echo -e "${BLUE}  シークレット生成スクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Pythonがインストールされているか確認
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: Python 3 がインストールされていません${NC}"
    echo -e "   Python 3.11以上をインストールしてください"
    exit 1
fi

echo -e "${GREEN}✅ Python 3 が見つかりました${NC}"
echo ""

# JWT_SECRET生成
echo -e "${YELLOW}🔑 JWT_SECRET を生成中...${NC}"
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo -e "${GREEN}✅ JWT_SECRET: ${JWT_SECRET}${NC}"
echo ""

# SESSION_SECRET生成
echo -e "${YELLOW}🔑 SESSION_SECRET を生成中...${NC}"
SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo -e "${GREEN}✅ SESSION_SECRET: ${SESSION_SECRET}${NC}"
echo ""

# 結果をファイルに保存
OUTPUT_FILE="secrets-$(date +%Y%m%d-%H%M%S).txt"
cat > "$OUTPUT_FILE" << EOF
# ===================================
# Creator Studio AI - 生成されたシークレット
# 生成日時: $(date)
# ===================================

# JWT署名キー（GitHub Secretsに登録）
JWT_SECRET=${JWT_SECRET}

# セッション署名キー（GitHub Secretsに登録）
SESSION_SECRET=${SESSION_SECRET}

# ===================================
# GitHub Secretsへの登録手順
# ===================================

1. GitHubリポジトリを開く
2. Settings > Secrets and variables > Actions
3. "New repository secret" をクリック
4. 以下のSecretを追加:

   Name: JWT_SECRET
   Value: ${JWT_SECRET}

   Name: SESSION_SECRET
   Value: ${SESSION_SECRET}

# ===================================
# ⚠️ セキュリティ注意事項
# ===================================

- このファイルは絶対にGitにコミットしないでください
- このファイルは安全な場所に保管してください
- 不要になったら削除してください: rm ${OUTPUT_FILE}
- このファイルが含まれているディレクトリは .gitignore に登録されています

EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  生成完了！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📄 シークレットを以下のファイルに保存しました:${NC}"
echo -e "   ${OUTPUT_FILE}"
echo ""
echo -e "${YELLOW}📋 次のステップ:${NC}"
echo "   1. このファイルの内容をGitHub Secretsに登録"
echo "   2. docs/GITHUB_SECRETS_SETUP.md を参照して残りのSecretsを設定"
echo "   3. このファイルを安全に保管または削除"
echo ""
echo -e "${RED}⚠️  重要: このファイルは絶対にGitにコミットしないでください${NC}"
echo ""

# .gitignore に scripts/*.txt が含まれているか確認
GITIGNORE_PATH="../.gitignore"
if [ -f "$GITIGNORE_PATH" ]; then
    if ! grep -q "scripts/secrets-.*\.txt" "$GITIGNORE_PATH"; then
        echo -e "${YELLOW}⚠️  .gitignore に scripts/secrets-*.txt を追加しています...${NC}"
        echo "" >> "$GITIGNORE_PATH"
        echo "# 生成されたシークレットファイル" >> "$GITIGNORE_PATH"
        echo "scripts/secrets-*.txt" >> "$GITIGNORE_PATH"
        echo -e "${GREEN}✅ .gitignore に追加しました${NC}"
        echo ""
    fi
fi

# 環境変数テンプレート出力（オプション）
echo -e "${BLUE}📝 環境変数テンプレート (.env 形式):${NC}"
echo ""
cat << EOF
# ===== 認証システム =====
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# ===== Google OAuth 2.0 =====
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# ===== データベース =====
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
REDIS_URL=rediss://default:password@host:6379

# ===== AI生成サービス =====
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
HEYGEN_API_KEY=xxxxx
MINIMAX_API_KEY=xxxxx

# ===== YouTube / リサーチ =====
YOUTUBE_API_KEY=AIzaSyxxxxx
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxxxx
SERP_API_KEY=xxxxx
SOCIAL_BLADE_API_KEY=xxxxx

# ===== Google Cloud Storage =====
GCS_BUCKET_NAME=creator-studio-ai-prod
GCS_PROJECT_ID=creator-studio-ai-prod

# ===== 通知 =====
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx

# ===== Vercel =====
VERCEL_TOKEN=xxxxx
VERCEL_ORG_ID=xxxxx
VERCEL_PROJECT_ID=xxxxx

# ===== 本番環境設定 =====
ENVIRONMENT=production
NODE_ENV=production
LOG_LEVEL=INFO
DEBUG=false

# ===== フロントエンド (Vite) =====
VITE_API_URL=https://creator-studio-backend.run.app
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ENVIRONMENT=production
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  完了${NC}"
echo -e "${GREEN}========================================${NC}"
