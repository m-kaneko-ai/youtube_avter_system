#!/bin/bash

# ===================================
# Creator Studio AI - デプロイ前チェックスクリプト
# ===================================
#
# このスクリプトは本番デプロイ前に必要な環境変数と接続をチェックします。
#
# 使用方法:
#   chmod +x pre-deploy-check.sh
#   ./pre-deploy-check.sh
#
# オプション:
#   --env-file <path>  環境変数ファイルを指定（デフォルト: ../.env.local）
#   --skip-db          データベース接続テストをスキップ
#   --skip-redis       Redis接続テストをスキップ
#   --skip-gcs         GCS接続テストをスキップ
#
# 作成日: 2025-12-17
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
ENV_FILE="../.env.local"
SKIP_DB=false
SKIP_REDIS=false
SKIP_GCS=false

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-redis)
            SKIP_REDIS=true
            shift
            ;;
        --skip-gcs)
            SKIP_GCS=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ヘッダー
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Creator Studio AI${NC}"
echo -e "${BLUE}  デプロイ前チェックスクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 環境変数ファイル読み込み
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ 環境変数ファイルを読み込みました: ${ENV_FILE}${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    echo ""
else
    echo -e "${RED}❌ 環境変数ファイルが見つかりません: ${ENV_FILE}${NC}"
    echo -e "${YELLOW}   GitHub Actions環境の場合、Secretsから自動的に読み込まれます${NC}"
    echo ""
fi

# チェック結果カウンター
PASS=0
FAIL=0
WARN=0

# チェック関数
check_env_var() {
    local var_name=$1
    local is_required=$2  # true or false
    local pattern=$3      # 正規表現パターン（オプション）

    echo -n "  ${var_name}: "

    if [ -z "${!var_name}" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}❌ 未設定${NC}"
            ((FAIL++))
        else
            echo -e "${YELLOW}⚠️  未設定（オプション）${NC}"
            ((WARN++))
        fi
        return 1
    else
        if [ -n "$pattern" ]; then
            if [[ "${!var_name}" =~ $pattern ]]; then
                # 値の一部を表示（セキュリティのため最初の10文字のみ）
                local preview="${!var_name:0:10}"
                if [ ${#!var_name} -gt 10 ]; then
                    preview="${preview}..."
                fi
                echo -e "${GREEN}✅ 設定済み${NC} (${preview})"
                ((PASS++))
                return 0
            else
                echo -e "${RED}❌ 形式エラー${NC}"
                ((FAIL++))
                return 1
            fi
        else
            local preview="${!var_name:0:10}"
            if [ ${#!var_name} -gt 10 ]; then
                preview="${preview}..."
            fi
            echo -e "${GREEN}✅ 設定済み${NC} (${preview})"
            ((PASS++))
            return 0
        fi
    fi
}

# ===========================================
# 1. 必須環境変数チェック
# ===========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}1. 必須環境変数チェック${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}▸ データベース${NC}"
check_env_var "DATABASE_URL" true "^postgresql://.+"
echo ""

echo -e "${BLUE}▸ Redis${NC}"
check_env_var "REDIS_URL" true "^rediss?://.+"
echo ""

echo -e "${BLUE}▸ 認証システム${NC}"
check_env_var "JWT_SECRET" true ".{32,}"
check_env_var "SESSION_SECRET" true ".{32,}"
check_env_var "GOOGLE_CLIENT_ID" true ".*\.apps\.googleusercontent\.com$"
check_env_var "GOOGLE_CLIENT_SECRET" true "^GOCSPX-.+"
echo ""

echo -e "${BLUE}▸ AI生成サービス${NC}"
check_env_var "ANTHROPIC_API_KEY" true "^sk-ant-.+"
check_env_var "GEMINI_API_KEY" true "^AIzaSy.+"
check_env_var "HEYGEN_API_KEY" false
check_env_var "MINIMAX_API_KEY" false
echo ""

echo -e "${BLUE}▸ YouTube / リサーチ${NC}"
check_env_var "YOUTUBE_API_KEY" true "^AIzaSy.+"
check_env_var "YOUTUBE_CLIENT_ID" false ".*\.apps\.googleusercontent\.com$"
check_env_var "YOUTUBE_CLIENT_SECRET" false "^GOCSPX-.+"
check_env_var "SERP_API_KEY" false
check_env_var "SOCIAL_BLADE_API_KEY" false
echo ""

echo -e "${BLUE}▸ Google Cloud Platform${NC}"
check_env_var "GCS_BUCKET_NAME" true
check_env_var "GCS_PROJECT_ID" true
echo ""

echo -e "${BLUE}▸ 通知${NC}"
check_env_var "SLACK_WEBHOOK_URL" false "^https://hooks\.slack\.com/services/.+"
echo ""

# ===========================================
# 2. データベース接続テスト
# ===========================================

if [ "$SKIP_DB" = false ] && [ -n "$DATABASE_URL" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}2. データベース接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if command -v psql &> /dev/null; then
        echo -n "  PostgreSQL接続テスト: "
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✅ 成功${NC}"
            ((PASS++))

            # pgvector拡張チェック
            echo -n "  pgvector拡張: "
            if psql "$DATABASE_URL" -c "SELECT 1 FROM pg_extension WHERE extname='vector';" | grep -q 1; then
                echo -e "${GREEN}✅ 有効${NC}"
                ((PASS++))
            else
                echo -e "${YELLOW}⚠️  無効（CREATE EXTENSION vector; を実行してください）${NC}"
                ((WARN++))
            fi
        else
            echo -e "${RED}❌ 失敗${NC}"
            ((FAIL++))
            echo -e "${YELLOW}   DATABASE_URLを確認してください${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  psql コマンドが見つかりません（スキップ）${NC}"
        ((WARN++))
    fi
    echo ""
else
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}2. データベース接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  スキップ${NC}"
    echo ""
fi

# ===========================================
# 3. Redis接続テスト
# ===========================================

if [ "$SKIP_REDIS" = false ] && [ -n "$REDIS_URL" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}3. Redis接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if command -v redis-cli &> /dev/null; then
        echo -n "  Redis接続テスト: "
        if redis-cli -u "$REDIS_URL" PING | grep -q PONG; then
            echo -e "${GREEN}✅ 成功${NC}"
            ((PASS++))
        else
            echo -e "${RED}❌ 失敗${NC}"
            ((FAIL++))
            echo -e "${YELLOW}   REDIS_URLを確認してください${NC}"
        fi
    elif command -v python3 &> /dev/null; then
        echo -n "  Redis接続テスト (Python): "
        python3 << EOF
import sys
try:
    import redis
    r = redis.from_url("$REDIS_URL")
    r.ping()
    print("OK")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
EOF
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 成功${NC}"
            ((PASS++))
        else
            echo -e "${RED}❌ 失敗${NC}"
            ((FAIL++))
        fi
    else
        echo -e "${YELLOW}⚠️  redis-cli/Python が見つかりません（スキップ）${NC}"
        ((WARN++))
    fi
    echo ""
else
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}3. Redis接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  スキップ${NC}"
    echo ""
fi

# ===========================================
# 4. Google Cloud Storage接続テスト
# ===========================================

if [ "$SKIP_GCS" = false ] && [ -n "$GCS_BUCKET_NAME" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}4. Google Cloud Storage接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if command -v gsutil &> /dev/null; then
        echo -n "  GCSバケット存在確認: "
        if gsutil ls "gs://$GCS_BUCKET_NAME" &> /dev/null; then
            echo -e "${GREEN}✅ 存在${NC}"
            ((PASS++))
        else
            echo -e "${RED}❌ バケットが見つかりません${NC}"
            ((FAIL++))
            echo -e "${YELLOW}   gsutil mb gs://$GCS_BUCKET_NAME でバケットを作成してください${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  gsutil コマンドが見つかりません（スキップ）${NC}"
        echo -e "${YELLOW}   Cloud Run環境では自動的に認証されます${NC}"
        ((WARN++))
    fi
    echo ""
else
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}4. Google Cloud Storage接続テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  スキップ${NC}"
    echo ""
fi

# ===========================================
# 5. セキュリティチェック
# ===========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}5. セキュリティチェック${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# JWT_SECRETの長さチェック
if [ -n "$JWT_SECRET" ]; then
    echo -n "  JWT_SECRET長さ: "
    if [ ${#JWT_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✅ ${#JWT_SECRET}文字（推奨: 32文字以上）${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ ${#JWT_SECRET}文字（推奨: 32文字以上）${NC}"
        ((FAIL++))
    fi
fi

# SESSION_SECRETの長さチェック
if [ -n "$SESSION_SECRET" ]; then
    echo -n "  SESSION_SECRET長さ: "
    if [ ${#SESSION_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✅ ${#SESSION_SECRET}文字（推奨: 32文字以上）${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ ${#SESSION_SECRET}文字（推奨: 32文字以上）${NC}"
        ((FAIL++))
    fi
fi

# REDIS_URLのTLSチェック
if [ -n "$REDIS_URL" ]; then
    echo -n "  Redis TLS (rediss://): "
    if [[ "$REDIS_URL" =~ ^rediss:// ]]; then
        echo -e "${GREEN}✅ 有効${NC}"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠️  無効（本番環境では rediss:// を推奨）${NC}"
        ((WARN++))
    fi
fi

# DATABASE_URLのSSLモードチェック
if [ -n "$DATABASE_URL" ]; then
    echo -n "  PostgreSQL SSL: "
    if [[ "$DATABASE_URL" =~ sslmode=require ]]; then
        echo -e "${GREEN}✅ 有効${NC}"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠️  無効（本番環境では ?sslmode=require を推奨）${NC}"
        ((WARN++))
    fi
fi

echo ""

# ===========================================
# 結果サマリー
# ===========================================

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}チェック結果サマリー${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ 成功: ${PASS}${NC}"
echo -e "  ${YELLOW}⚠️  警告: ${WARN}${NC}"
echo -e "  ${RED}❌ 失敗: ${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  全てのチェックに合格しました！${NC}"
        echo -e "${GREEN}  デプロイ準備完了です。${NC}"
        echo -e "${GREEN}========================================${NC}"
        exit 0
    else
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}  警告がありますが、デプロイ可能です。${NC}"
        echo -e "${YELLOW}  警告項目を確認してください。${NC}"
        echo -e "${YELLOW}========================================${NC}"
        exit 0
    fi
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  チェックに失敗しました。${NC}"
    echo -e "${RED}  上記のエラーを修正してください。${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
