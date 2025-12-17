"""
外部APIキーの有効性を検証するモジュール

使用方法:
    # コマンドラインから実行
    python -m app.services.api_key_validator

    # Pythonコードから実行
    from app.services.api_key_validator import validate_all_api_keys
    results = await validate_all_api_keys()
"""

import asyncio
import os
import sys
import time
from typing import Dict, Literal, Optional, Tuple

import httpx
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv(".env.local")

# カラー出力用のANSIエスケープコード
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


ServiceStatus = Literal["ok", "error", "not_configured", "warning"]


class APIKeyValidator:
    """APIキーの有効性を検証するクラス"""

    def __init__(self):
        self.timeout = 10.0  # タイムアウト秒数

    async def _make_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, str]] = None,
        json_data: Optional[Dict] = None,
    ) -> Tuple[int, Optional[float]]:
        """
        HTTPリクエストを送信してステータスコードとレイテンシを返す

        Returns:
            (status_code, latency_ms) のタプル
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                start_time = time.time()
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json_data,
                )
                latency = (time.time() - start_time) * 1000  # ms
                return response.status_code, latency
        except Exception:
            return 0, None

    async def validate_claude_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """Claude API (Anthropic) の検証"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key.startswith("sk-ant-xxxxx"):
            return "not_configured", None, "APIキーが設定されていません"

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        json_data = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "test"}],
        }

        status_code, latency = await self._make_request(
            "POST",
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json_data=json_data,
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 401:
            return "error", None, "APIキーが無効です"
        elif status_code == 429:
            return "warning", None, "レート制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_gemini_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """Gemini API (Google) の検証"""
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("AIzaSyXXXXX"):
            return "not_configured", None, "APIキーが設定されていません"

        params = {"key": api_key}
        json_data = {
            "contents": [{"parts": [{"text": "test"}]}],
        }

        status_code, latency = await self._make_request(
            "POST",
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
            params=params,
            json_data=json_data,
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 400:
            return "error", None, "APIキーが無効です"
        elif status_code == 429:
            return "warning", None, "レート制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_openai_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """OpenAI API の検証"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("sk-proj-xxxxx"):
            return "not_configured", None, "APIキーが設定されていません"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        json_data = {
            "input": "test",
            "model": "text-embedding-3-large",
        }

        status_code, latency = await self._make_request(
            "POST",
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json_data=json_data,
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 401:
            return "error", None, "APIキーが無効です"
        elif status_code == 429:
            return "warning", None, "レート制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_heygen_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """HeyGen API の検証"""
        api_key = os.getenv("HEYGEN_API_KEY")
        if not api_key or api_key == "xxxxxxxxxxxxxxxx":
            return "not_configured", None, "APIキーが設定されていません"

        headers = {"X-Api-Key": api_key}

        status_code, latency = await self._make_request(
            "GET", "https://api.heygen.com/v1/avatar.list", headers=headers
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 401:
            return "error", None, "APIキーが無効です"
        elif status_code == 429:
            return "warning", None, "レート制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_minimax_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """MiniMax Audio API の検証"""
        api_key = os.getenv("MINIMAX_API_KEY")
        secret_key = os.getenv("MINIMAX_SECRET_KEY")

        if not api_key or api_key == "xxxxxxxxxxxxxxxx":
            return "not_configured", None, "APIキーが設定されていません"
        if not secret_key or secret_key == "xxxxxxxxxxxxxxxx":
            return "not_configured", None, "Secret Keyが設定されていません"

        # MiniMax APIのエンドポイントは実際のドキュメントに基づいて調整が必要
        return "warning", None, "手動検証が必要です（エンドポイント情報が不足）"

    async def validate_youtube_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """YouTube Data API v3 の検証"""
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key or api_key.startswith("AIzaSyXXXXX"):
            return "not_configured", None, "APIキーが設定されていません"

        params = {
            "part": "snippet",
            "q": "test",
            "maxResults": 1,
            "key": api_key,
        }

        status_code, latency = await self._make_request(
            "GET", "https://www.googleapis.com/youtube/v3/search", params=params
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 400:
            return "error", None, "APIキーが無効です"
        elif status_code == 403:
            return "error", None, "YouTube Data API v3が有効化されていません"
        elif status_code == 429:
            return "warning", None, "クォータ制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_serp_api(self) -> Tuple[ServiceStatus, Optional[float], str]:
        """SerpAPI の検証"""
        api_key = os.getenv("SERP_API_KEY")
        if not api_key or api_key == "xxxxxxxxxxxxxxxx":
            return "not_configured", None, "APIキーが設定されていません"

        params = {
            "engine": "google",
            "q": "test",
            "api_key": api_key,
        }

        status_code, latency = await self._make_request(
            "GET", "https://serpapi.com/search", params=params
        )

        if status_code == 200:
            return "ok", latency, "正常に接続できました"
        elif status_code == 401:
            return "error", None, "APIキーが無効です"
        elif status_code == 429:
            return "warning", None, "レート制限に達しています"
        else:
            return "error", None, f"エラー (status: {status_code})"

    async def validate_social_blade_api(
        self,
    ) -> Tuple[ServiceStatus, Optional[float], str]:
        """Social Blade API の検証"""
        api_key = os.getenv("SOCIAL_BLADE_API_KEY")
        if not api_key or api_key == "xxxxxxxxxxxxxxxx":
            return "not_configured", None, "APIキーが設定されていません"

        # Social Blade APIのエンドポイントは実際のドキュメントに基づいて調整が必要
        return "warning", None, "手動検証が必要です（有料プランが必要）"

    async def validate_google_oauth(
        self,
    ) -> Tuple[ServiceStatus, Optional[float], str]:
        """Google OAuth の検証（クライアントIDの存在確認のみ）"""
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if not client_id or client_id.endswith(".apps.googleusercontent.com") == False:
            return "not_configured", None, "Client IDが設定されていません"
        if not client_secret or client_secret.startswith("GOCSPX-") == False:
            return "not_configured", None, "Client Secretが設定されていません"

        return "ok", None, "OAuth認証情報が設定されています（接続テストは未実施）"


async def validate_all_api_keys() -> Dict[str, Dict[str, any]]:
    """
    すべてのAPIキーを検証する

    Returns:
        各サービスの検証結果を含む辞書
    """
    validator = APIKeyValidator()

    services = {
        "Claude API": validator.validate_claude_api,
        "Gemini API": validator.validate_gemini_api,
        "OpenAI API": validator.validate_openai_api,
        "HeyGen API": validator.validate_heygen_api,
        "MiniMax Audio API": validator.validate_minimax_api,
        "YouTube Data API": validator.validate_youtube_api,
        "SerpAPI": validator.validate_serp_api,
        "Social Blade API": validator.validate_social_blade_api,
        "Google OAuth": validator.validate_google_oauth,
    }

    results = {}
    for service_name, validator_func in services.items():
        status, latency, message = await validator_func()
        results[service_name] = {
            "status": status,
            "latency_ms": latency,
            "message": message,
        }

    return results


def print_results(results: Dict[str, Dict[str, any]]):
    """検証結果をカラフルに表示"""
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}  外部APIキー検証結果{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")

    ok_count = 0
    warning_count = 0
    error_count = 0
    not_configured_count = 0

    for service_name, result in results.items():
        status = result["status"]
        latency = result["latency_ms"]
        message = result["message"]

        # ステータスに応じたアイコンと色
        if status == "ok":
            icon = "✅"
            color = Colors.GREEN
            ok_count += 1
        elif status == "warning":
            icon = "⚠️ "
            color = Colors.YELLOW
            warning_count += 1
        elif status == "error":
            icon = "❌"
            color = Colors.RED
            error_count += 1
        else:  # not_configured
            icon = "⚪"
            color = Colors.BLUE
            not_configured_count += 1

        # サービス名とステータス
        print(f"{icon} {color}{service_name:<25}{Colors.RESET}", end="")

        # レイテンシ表示
        if latency is not None:
            print(f" ({latency:.0f}ms)", end="")

        # メッセージ
        print(f" - {message}")

    # サマリー
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}サマリー:{Colors.RESET}")
    print(f"  {Colors.GREEN}✅ 正常: {ok_count}{Colors.RESET}")
    print(f"  {Colors.YELLOW}⚠️  警告: {warning_count}{Colors.RESET}")
    print(f"  {Colors.RED}❌ エラー: {error_count}{Colors.RESET}")
    print(f"  {Colors.BLUE}⚪ 未設定: {not_configured_count}{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")

    # 推奨アクション
    if error_count > 0:
        print(f"{Colors.RED}{Colors.BOLD}⚠️  エラーが発生しています{Colors.RESET}")
        print(
            f"   docs/API_KEYS_SETUP.md を参照してAPIキーを再設定してください。\n"
        )

    if not_configured_count > 0:
        print(f"{Colors.BLUE}ℹ️  未設定のAPIがあります{Colors.RESET}")
        print(f"   必須APIは docs/API_KEYS_SETUP.md を参照して設定してください。\n")


async def main():
    """メイン関数"""
    print(f"\n{Colors.BOLD}外部APIキー検証を開始します...{Colors.RESET}\n")
    results = await validate_all_api_keys()
    print_results(results)

    # エラーがある場合は終了コード1を返す
    has_error = any(r["status"] == "error" for r in results.values())
    sys.exit(1 if has_error else 0)


if __name__ == "__main__":
    asyncio.run(main())
