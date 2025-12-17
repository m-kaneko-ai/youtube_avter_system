#!/bin/bash

# ===================================
# Creator Studio AI - ロールバックスクリプト
# ===================================
#
# 使用方法:
#   chmod +x rollback.sh
#   ./rollback.sh
#
# オプション:
#   --version <tag>       ロールバックするバージョン（デフォルト: 前のバージョン）
#   --force              確認なしで実行
#   --backend-only       バックエンドのみロールバック
#   --frontend-only      フロントエンドのみロールバック
#
# 作成日: 2025-12-18
# ===================================

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# デフォルト設定
ROLLBACK_VERSION=""
FORCE=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ヘッダー
echo -e "${RED}========================================${NC}"
echo -e "${RED}  Creator Studio AI${NC}"
echo -e "${RED}  ロールバックスクリプト${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  警告: この操作は本番環境を前のバージョンに戻します${NC}"
echo ""

# ===================================
# 1. バージョン確認
# ===================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}1. バージョン確認${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 利用可能なタグを表示
echo -e "${CYAN}  最近のバージョン:${NC}"
git tag -l "v*" --sort=-version:refname | head -5 | while read -r tag; do
    echo "    - $tag"
done
echo ""

# ロールバックバージョンが指定されていない場合
if [ -z "$ROLLBACK_VERSION" ]; then
    # 最新のタグを取得
    LATEST_TAG=$(git tag -l "v*" --sort=-version:refname | head -1)
    # 前のタグを取得
    ROLLBACK_VERSION=$(git tag -l "v*" --sort=-version:refname | head -2 | tail -1)

    echo -e "${CYAN}  現在のバージョン: ${LATEST_TAG}${NC}"
    echo -e "${CYAN}  ロールバック先: ${ROLLBACK_VERSION}${NC}"
else
    # 指定されたタグが存在するか確認
    if ! git rev-parse "$ROLLBACK_VERSION" >/dev/null 2>&1; then
        echo -e "${RED}  ❌ バージョン ${ROLLBACK_VERSION} が見つかりません${NC}"
        exit 1
    fi
    echo -e "${CYAN}  ロールバック先: ${ROLLBACK_VERSION}${NC}"
fi
echo ""

# 確認
if [ "$FORCE" = false ]; then
    read -p "$(echo -e ${YELLOW}本当にロールバックしますか? \(y/N\): ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}  ロールバックを中止しました${NC}"
        exit 1
    fi
fi

# ===================================
# 2. バックエンド ロールバック
# ===================================

if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}2. バックエンド ロールバック (Cloud Run)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # GCPプロジェクトID確認
    if [ -z "$GCP_PROJECT_ID" ]; then
        echo -e "${YELLOW}  GCP_PROJECT_IDが設定されていません${NC}"
        read -p "  GCPプロジェクトIDを入力してください: " GCP_PROJECT_ID
    fi

    echo -e "${CYAN}  GCPプロジェクト: ${GCP_PROJECT_ID}${NC}"

    # Cloud Run リビジョン一覧取得
    echo -e "${CYAN}  Cloud Run リビジョン一覧を取得中...${NC}"

    if command -v gcloud &> /dev/null; then
        echo ""
        gcloud run revisions list \
            --service=creator-studio-backend \
            --region=asia-northeast1 \
            --platform=managed \
            --project="$GCP_PROJECT_ID" \
            --limit=5

        echo ""
        read -p "$(echo -e ${YELLOW}ロールバックするリビジョンを入力してください: ${NC})" REVISION_NAME

        if [ -z "$REVISION_NAME" ]; then
            echo -e "${RED}  ❌ リビジョン名が入力されていません${NC}"
            exit 1
        fi

        # トラフィックを指定リビジョンに切り替え
        echo -e "${CYAN}  トラフィックを ${REVISION_NAME} に切り替え中...${NC}"
        gcloud run services update-traffic creator-studio-backend \
            --region=asia-northeast1 \
            --platform=managed \
            --project="$GCP_PROJECT_ID" \
            --to-revisions="${REVISION_NAME}=100"

        echo -e "${GREEN}  ✅ バックエンド ロールバック: 完了${NC}"
    else
        echo -e "${YELLOW}  ⚠️  gcloud コマンドが見つかりません${NC}"
        echo -e "${YELLOW}  手動でロールバックしてください:${NC}"
        echo ""
        echo -e "    1. Cloud Consoleにアクセス"
        echo -e "    2. Cloud Run > creator-studio-backend を選択"
        echo -e "    3. 「リビジョン」タブを開く"
        echo -e "    4. 前のリビジョンを選択 > 「トラフィックを送信」"
        echo ""
    fi
    echo ""
fi

# ===================================
# 3. フロントエンド ロールバック
# ===================================

if [ "$BACKEND_ONLY" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}3. フロントエンド ロールバック (Vercel)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if command -v vercel &> /dev/null; then
        # Vercel デプロイ一覧取得
        echo -e "${CYAN}  Vercel デプロイ一覧を取得中...${NC}"
        cd ../frontend

        echo ""
        vercel ls --limit=5

        echo ""
        read -p "$(echo -e ${YELLOW}ロールバックするデプロイURLを入力してください: ${NC})" DEPLOYMENT_URL

        if [ -z "$DEPLOYMENT_URL" ]; then
            echo -e "${RED}  ❌ デプロイURLが入力されていません${NC}"
            exit 1
        fi

        # デプロイをプロモート
        echo -e "${CYAN}  ${DEPLOYMENT_URL} をProductionに昇格中...${NC}"
        vercel promote "$DEPLOYMENT_URL"

        echo -e "${GREEN}  ✅ フロントエンド ロールバック: 完了${NC}"
        cd ../scripts
    else
        echo -e "${YELLOW}  ⚠️  vercel コマンドが見つかりません${NC}"
        echo -e "${YELLOW}  手動でロールバックしてください:${NC}"
        echo ""
        echo -e "    1. Vercel Dashboardにアクセス"
        echo -e "    2. プロジェクトを選択"
        echo -e "    3. 「Deployments」タブを開く"
        echo -e "    4. 前のデプロイを選択 > 「Promote to Production」"
        echo ""
        echo -e "  または、以下のコマンドを実行:"
        echo -e "    ${BLUE}npm install -g vercel${NC}"
        echo -e "    ${BLUE}cd frontend && vercel rollback <deployment-url>${NC}"
        echo ""
    fi
    echo ""
fi

# ===================================
# 4. データベース マイグレーション
# ===================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}4. データベース マイグレーション${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}  ⚠️  警告: データベースマイグレーションのロールバックは慎重に行ってください${NC}"
echo -e "${YELLOW}  データ損失の可能性があります${NC}"
echo ""

read -p "$(echo -e ${YELLOW}データベースマイグレーションをロールバックしますか? \(y/N\): ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ../backend

    # 現在のマイグレーションバージョン確認
    echo -e "${CYAN}  現在のマイグレーションバージョン:${NC}"
    alembic current

    echo ""
    echo -e "${CYAN}  マイグレーション履歴:${NC}"
    alembic history --verbose | head -10

    echo ""
    read -p "$(echo -e ${YELLOW}何ステップ戻しますか? \(数値を入力\): ${NC})" STEPS

    if [[ "$STEPS" =~ ^[0-9]+$ ]] && [ "$STEPS" -gt 0 ]; then
        echo -e "${CYAN}  ${STEPS}ステップ戻します...${NC}"
        alembic downgrade "-${STEPS}"
        echo -e "${GREEN}  ✅ マイグレーション ロールバック: 完了${NC}"
    else
        echo -e "${YELLOW}  マイグレーション ロールバック: スキップ${NC}"
    fi

    cd ../scripts
else
    echo -e "${YELLOW}  マイグレーション ロールバック: スキップ${NC}"
fi
echo ""

# ===================================
# 5. ロールバック確認
# ===================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}5. ロールバック確認${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# フロントエンド確認
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "${CYAN}  フロントエンド:${NC}"
    echo -e "    https://creator-studio-ai.vercel.app"
    echo ""
fi

# バックエンド確認
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "${CYAN}  バックエンド:${NC}"
    echo -e "    https://creator-studio-backend.run.app/api/v1/health"
    echo ""
fi

echo -e "${YELLOW}  必ず以下を確認してください:${NC}"
echo -e "    1. アプリケーションが正常に起動している"
echo -e "    2. ログインができる"
echo -e "    3. 主要機能が動作する"
echo -e "    4. エラーログを確認"
echo ""

# ===================================
# ロールバック完了
# ===================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ロールバック処理完了${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}次のステップ:${NC}"
echo -e "  1. アプリケーションの動作確認"
echo -e "  2. エラーログの確認"
echo -e "  3. 問題の原因調査"
echo -e "  4. 修正後、再デプロイ"
echo ""
echo -e "${YELLOW}注意事項:${NC}"
echo -e "  - ロールバック後も問題が発生する場合は、さらに前のバージョンに戻してください"
echo -e "  - データベースの不整合が発生している場合は、バックアップから復元を検討してください"
echo -e "  - Slackで関係者に通知してください"
echo ""
