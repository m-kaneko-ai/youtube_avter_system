#!/bin/bash

# ===================================
# Creator Studio AI - 本番デプロイスクリプト
# ===================================
#
# 使用方法:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# オプション:
#   --skip-tests       テストをスキップ
#   --skip-checks      デプロイ前チェックをスキップ
#   --dry-run          実際のデプロイを行わず、チェックのみ実行
#   --version <tag>    デプロイするバージョンタグ（デフォルト: タイムスタンプ）
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
SKIP_TESTS=false
SKIP_CHECKS=false
DRY_RUN=false
VERSION=""

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# バージョンが指定されていない場合はタイムスタンプを使用
if [ -z "$VERSION" ]; then
    VERSION=$(date +%Y%m%d%H%M%S)
fi

# ヘッダー
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Creator Studio AI${NC}"
echo -e "${BLUE}  本番デプロイスクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}バージョン: v${VERSION}${NC}"
echo ""

# ===================================
# 1. 事前チェック
# ===================================

if [ "$SKIP_CHECKS" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}1. 事前チェック${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # カレントブランチ確認
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "  カレントブランチ: ${CYAN}${CURRENT_BRANCH}${NC}"

    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "${YELLOW}  ⚠️  警告: mainブランチではありません${NC}"
        read -p "  本当にデプロイしますか? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}  デプロイを中止しました${NC}"
            exit 1
        fi
    fi

    # Gitステータス確認
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}  ❌ Gitに未コミットの変更があります${NC}"
        git status --short
        exit 1
    else
        echo -e "${GREEN}  ✅ Gitステータス: クリーン${NC}"
    fi

    # デプロイ前チェックスクリプト実行
    echo ""
    echo -e "${CYAN}  デプロイ前チェックスクリプトを実行中...${NC}"
    echo ""
    if ./pre-deploy-check.sh; then
        echo -e "${GREEN}  ✅ デプロイ前チェック: 合格${NC}"
    else
        echo -e "${RED}  ❌ デプロイ前チェック: 失敗${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  事前チェックをスキップしました${NC}"
    echo ""
fi

# ===================================
# 2. フロントエンドビルド & テスト
# ===================================

if [ "$SKIP_TESTS" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}2. フロントエンドビルド & テスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd ../frontend

    # npm install
    echo -e "${CYAN}  npm install を実行中...${NC}"
    npm install --silent

    # Type Check
    echo -e "${CYAN}  型チェックを実行中...${NC}"
    if npm run type-check; then
        echo -e "${GREEN}  ✅ 型チェック: 合格${NC}"
    else
        echo -e "${RED}  ❌ 型チェック: 失敗${NC}"
        exit 1
    fi

    # Lint
    echo -e "${CYAN}  Lintを実行中...${NC}"
    if npm run lint; then
        echo -e "${GREEN}  ✅ Lint: 合格${NC}"
    else
        echo -e "${RED}  ❌ Lint: 失敗${NC}"
        exit 1
    fi

    # Test
    echo -e "${CYAN}  テストを実行中...${NC}"
    if npm run test -- --run; then
        echo -e "${GREEN}  ✅ テスト: 合格${NC}"
    else
        echo -e "${RED}  ❌ テスト: 失敗${NC}"
        exit 1
    fi

    # Build
    echo -e "${CYAN}  ビルドを実行中...${NC}"
    if npm run build; then
        echo -e "${GREEN}  ✅ ビルド: 成功${NC}"
    else
        echo -e "${RED}  ❌ ビルド: 失敗${NC}"
        exit 1
    fi

    cd ../scripts
    echo ""
else
    echo -e "${YELLOW}⚠️  フロントエンドテストをスキップしました${NC}"
    echo ""
fi

# ===================================
# 3. バックエンドテスト
# ===================================

if [ "$SKIP_TESTS" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}3. バックエンドテスト${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd ../backend

    # Ruff Check
    echo -e "${CYAN}  Ruff チェックを実行中...${NC}"
    if python3 -m ruff check app/; then
        echo -e "${GREEN}  ✅ Ruff: 合格${NC}"
    else
        echo -e "${RED}  ❌ Ruff: 失敗${NC}"
        exit 1
    fi

    # Mypy Type Check
    echo -e "${CYAN}  型チェックを実行中...${NC}"
    if python3 -m mypy app/ --ignore-missing-imports; then
        echo -e "${GREEN}  ✅ 型チェック: 合格${NC}"
    else
        echo -e "${RED}  ❌ 型チェック: 失敗${NC}"
        exit 1
    fi

    # Pytest
    echo -e "${CYAN}  テストを実行中...${NC}"
    if python3 -m pytest tests/ -v; then
        echo -e "${GREEN}  ✅ テスト: 合格${NC}"
    else
        echo -e "${RED}  ❌ テスト: 失敗${NC}"
        exit 1
    fi

    cd ../scripts
    echo ""
else
    echo -e "${YELLOW}⚠️  バックエンドテストをスキップしました${NC}"
    echo ""
fi

# ===================================
# 4. Gitタグ作成
# ===================================

if [ "$DRY_RUN" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}4. Gitタグ作成${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    TAG_NAME="v${VERSION}"

    # タグが既に存在するかチェック
    if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  タグ ${TAG_NAME} は既に存在します${NC}"
        read -p "  上書きしますか? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git tag -d "$TAG_NAME"
            git push origin ":refs/tags/$TAG_NAME" 2>/dev/null || true
        else
            echo -e "${RED}  デプロイを中止しました${NC}"
            exit 1
        fi
    fi

    # タグ作成
    echo -e "${CYAN}  タグを作成中: ${TAG_NAME}${NC}"
    git tag -a "$TAG_NAME" -m "Production Release ${TAG_NAME}"

    # タグをプッシュ
    echo -e "${CYAN}  タグをプッシュ中...${NC}"
    git push origin "$TAG_NAME"

    echo -e "${GREEN}  ✅ タグ作成: ${TAG_NAME}${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Dry-run モード: タグ作成をスキップ${NC}"
    echo ""
fi

# ===================================
# 5. mainブランチへマージ
# ===================================

if [ "$DRY_RUN" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}5. mainブランチへマージ${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "${CYAN}  ${CURRENT_BRANCH} から main へマージします${NC}"
        read -p "  続行しますか? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}  デプロイを中止しました${NC}"
            exit 1
        fi

        # mainブランチへチェックアウト
        git checkout main
        git pull origin main

        # マージ
        git merge "$CURRENT_BRANCH" --no-ff -m "Merge ${CURRENT_BRANCH} for production release v${VERSION}"

        # プッシュ
        git push origin main

        echo -e "${GREEN}  ✅ mainブランチへマージ: 完了${NC}"
    else
        echo -e "${CYAN}  既にmainブランチです${NC}"
        echo -e "${CYAN}  mainブランチをプッシュします...${NC}"
        git push origin main
        echo -e "${GREEN}  ✅ mainブランチプッシュ: 完了${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Dry-run モード: マージをスキップ${NC}"
    echo ""
fi

# ===================================
# 6. デプロイ状況確認
# ===================================

if [ "$DRY_RUN" = false ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}6. デプロイ状況確認${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${CYAN}  GitHub Actionsでデプロイが開始されました${NC}"
    echo -e "${CYAN}  デプロイ状況を確認してください:${NC}"
    echo ""
    echo -e "  ${BLUE}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions${NC}"
    echo ""
    echo -e "${YELLOW}  注意: Production環境へのデプロイには手動承認が必要です${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Dry-run モード: デプロイはスキップされました${NC}"
    echo ""
fi

# ===================================
# デプロイ完了
# ===================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  デプロイ処理完了: v${VERSION}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}次のステップ:${NC}"
echo -e "  1. GitHub Actionsでデプロイ状況を確認"
echo -e "  2. Production環境のデプロイを手動承認"
echo -e "  3. デプロイ後の動作確認を実施"
echo -e "  4. PRODUCTION_CHECKLIST.md の「デプロイ後確認」を実施"
echo ""
echo -e "${YELLOW}ロールバックが必要な場合:${NC}"
echo -e "  ./rollback.sh"
echo ""
