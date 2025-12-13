"""
AI生成サービスクライアント

Claude API / Gemini API を使用した台本・コンテンツ生成
"""
from typing import Optional, Dict, Any, List
from enum import Enum

from app.core.config import settings


class AIProvider(str, Enum):
    """AI プロバイダー"""
    CLAUDE = "claude"
    GEMINI = "gemini"


class ClaudeClient:
    """Claude API クライアント"""

    def __init__(self):
        """初期化"""
        self.api_key = settings.ANTHROPIC_API_KEY
        self._client = None

    @property
    def client(self):
        """遅延初期化されたAPIクライアント"""
        if self._client is None and self.api_key:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self.api_key)
        return self._client

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def generate_script(
        self,
        prompt: str,
        title: Optional[str] = None,
        target_duration: int = 180,
        style: str = "educational",
        knowledge_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        台本を生成

        Args:
            prompt: 台本生成プロンプト
            title: 動画タイトル
            target_duration: 目標再生時間（秒）
            style: 台本スタイル
            knowledge_context: ナレッジDB からのコンテキスト

        Returns:
            Dict: 生成結果
        """
        if not self.is_available():
            return {"error": "Claude API is not available", "content": None}

        try:
            # 文字数目安を計算（1分あたり約300文字）
            target_chars = int(target_duration / 60 * 300)

            system_prompt = f"""あなたはYouTube動画の台本を作成するプロの脚本家です。
以下の要件に従って、視聴者を惹きつける台本を作成してください。

【要件】
- スタイル: {style}
- 目標文字数: 約{target_chars}文字
- 構成: オープニング → 本編 → エンディング
- 視聴者の興味を引く導入
- 明確なポイントと具体例
- 行動を促すエンディング

【出力形式】
```
【オープニング】
（導入部分）

【本編】
（メインコンテンツ）

【エンディング】
（締めの言葉とCTA）
```
"""
            if knowledge_context:
                system_prompt += f"\n【参考情報（ナレッジ）】\n{knowledge_context}\n"

            user_prompt = f"タイトル: {title or '未定'}\n\n{prompt}"

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            content = message.content[0].text
            word_count = len(content)
            estimated_duration = int(word_count / 300 * 60)

            return {
                "content": content,
                "word_count": word_count,
                "estimated_duration": estimated_duration,
                "model": "claude-sonnet-4-20250514",
                "provider": AIProvider.CLAUDE.value,
            }

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e), "content": None}

    async def generate_title(
        self,
        topic: str,
        keywords: List[str],
        style: str = "engaging",
        count: int = 5,
    ) -> Dict[str, Any]:
        """
        タイトル候補を生成

        Args:
            topic: 動画のトピック
            keywords: キーワードリスト
            style: タイトルスタイル
            count: 生成数

        Returns:
            Dict: タイトル候補リスト
        """
        if not self.is_available():
            return {"error": "Claude API is not available", "titles": None}

        try:
            keywords_str = ", ".join(keywords) if keywords else ""

            prompt = f"""以下の情報を元に、YouTube動画のタイトル候補を{count}個生成してください。

【トピック】
{topic}

【キーワード】
{keywords_str}

【スタイル】
{style}

【要件】
- クリック率を高めるタイトル
- 50文字以内
- 数字や【】を効果的に使用
- 感情を動かす表現

各タイトルを1行ずつ出力してください。番号は不要です。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            titles = [
                line.strip()
                for line in message.content[0].text.strip().split("\n")
                if line.strip()
            ][:count]

            return {
                "titles": titles,
                "recommended_index": 0,
                "provider": AIProvider.CLAUDE.value,
            }

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e), "titles": None}

    async def generate_description(
        self,
        title: str,
        script_summary: Optional[str] = None,
        keywords: Optional[List[str]] = None,
        include_timestamps: bool = True,
        include_links: bool = True,
    ) -> Dict[str, Any]:
        """
        説明文を生成

        Args:
            title: 動画タイトル
            script_summary: 台本サマリー
            keywords: キーワードリスト
            include_timestamps: タイムスタンプを含めるか
            include_links: リンクを含めるか

        Returns:
            Dict: 説明文と関連情報
        """
        if not self.is_available():
            return {"error": "Claude API is not available", "description": None}

        try:
            prompt = f"""以下の情報を元に、YouTube動画の説明文を生成してください。

【タイトル】
{title}

【台本サマリー】
{script_summary or '台本情報なし'}

【キーワード】
{', '.join(keywords) if keywords else '指定なし'}

【要件】
- SEOを意識した説明文
- 視聴者にとって有益な情報
{"- タイムスタンプを含める" if include_timestamps else "- タイムスタンプ不要"}
{"- 関連リンクセクションを含める" if include_links else "- リンクセクション不要"}
- ハッシュタグを最後に追加

フォーマット例:
📺 [タイトル]

[動画の概要説明]

📌 タイムスタンプ（必要な場合）
00:00 導入
...

🔗 関連リンク（必要な場合）
...

#ハッシュタグ1 #ハッシュタグ2
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            description = message.content[0].text

            # ハッシュタグを抽出
            import re
            hashtags = re.findall(r'#\w+', description)

            return {
                "description": description,
                "hashtags": hashtags,
                "provider": AIProvider.CLAUDE.value,
            }

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e), "description": None}


class GeminiClient:
    """Gemini API クライアント"""

    def __init__(self):
        """初期化"""
        self.api_key = settings.GEMINI_API_KEY
        self._model = None

    @property
    def model(self):
        """遅延初期化されたモデル"""
        if self._model is None and self.api_key:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel('gemini-1.5-flash')
        return self._model

    def is_available(self) -> bool:
        """APIが利用可能かどうか"""
        return bool(self.api_key)

    async def generate_script(
        self,
        prompt: str,
        title: Optional[str] = None,
        target_duration: int = 180,
        style: str = "educational",
        knowledge_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        台本を生成

        Args:
            prompt: 台本生成プロンプト
            title: 動画タイトル
            target_duration: 目標再生時間（秒）
            style: 台本スタイル
            knowledge_context: ナレッジDB からのコンテキスト

        Returns:
            Dict: 生成結果
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "content": None}

        try:
            # 文字数目安を計算（1分あたり約300文字）
            target_chars = int(target_duration / 60 * 300)

            full_prompt = f"""あなたはYouTube動画の台本を作成するプロの脚本家です。
以下の要件に従って、視聴者を惹きつける台本を作成してください。

【タイトル】
{title or '未定'}

【リクエスト】
{prompt}

【要件】
- スタイル: {style}
- 目標文字数: 約{target_chars}文字
- 構成: オープニング → 本編 → エンディング
- 視聴者の興味を引く導入
- 明確なポイントと具体例
- 行動を促すエンディング
"""
            if knowledge_context:
                full_prompt += f"\n【参考情報（ナレッジ）】\n{knowledge_context}\n"

            full_prompt += """
【出力形式】
```
【オープニング】
（導入部分）

【本編】
（メインコンテンツ）

【エンディング】
（締めの言葉とCTA）
```
"""

            response = self.model.generate_content(full_prompt)
            content = response.text
            word_count = len(content)
            estimated_duration = int(word_count / 300 * 60)

            return {
                "content": content,
                "word_count": word_count,
                "estimated_duration": estimated_duration,
                "model": "gemini-1.5-flash",
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "content": None}

    async def generate_title(
        self,
        topic: str,
        keywords: List[str],
        style: str = "engaging",
        count: int = 5,
    ) -> Dict[str, Any]:
        """
        タイトル候補を生成

        Args:
            topic: 動画のトピック
            keywords: キーワードリスト
            style: タイトルスタイル
            count: 生成数

        Returns:
            Dict: タイトル候補リスト
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "titles": None}

        try:
            keywords_str = ", ".join(keywords) if keywords else ""

            prompt = f"""以下の情報を元に、YouTube動画のタイトル候補を{count}個生成してください。

【トピック】
{topic}

【キーワード】
{keywords_str}

【スタイル】
{style}

【要件】
- クリック率を高めるタイトル
- 50文字以内
- 数字や【】を効果的に使用
- 感情を動かす表現

各タイトルを1行ずつ出力してください。番号は不要です。
"""

            response = self.model.generate_content(prompt)
            titles = [
                line.strip()
                for line in response.text.strip().split("\n")
                if line.strip()
            ][:count]

            return {
                "titles": titles,
                "recommended_index": 0,
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "titles": None}

    async def generate_description(
        self,
        title: str,
        script_summary: Optional[str] = None,
        keywords: Optional[List[str]] = None,
        include_timestamps: bool = True,
        include_links: bool = True,
    ) -> Dict[str, Any]:
        """
        説明文を生成

        Args:
            title: 動画タイトル
            script_summary: 台本サマリー
            keywords: キーワードリスト
            include_timestamps: タイムスタンプを含めるか
            include_links: リンクを含めるか

        Returns:
            Dict: 説明文と関連情報
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "description": None}

        try:
            prompt = f"""以下の情報を元に、YouTube動画の説明文を生成してください。

【タイトル】
{title}

【台本サマリー】
{script_summary or '台本情報なし'}

【キーワード】
{', '.join(keywords) if keywords else '指定なし'}

【要件】
- SEOを意識した説明文
- 視聴者にとって有益な情報
{"- タイムスタンプを含める" if include_timestamps else "- タイムスタンプ不要"}
{"- 関連リンクセクションを含める" if include_links else "- リンクセクション不要"}
- ハッシュタグを最後に追加
"""

            response = self.model.generate_content(prompt)
            description = response.text

            # ハッシュタグを抽出
            import re
            hashtags = re.findall(r'#\w+', description)

            return {
                "description": description,
                "hashtags": hashtags,
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "description": None}


# シングルトンインスタンス
claude_client = ClaudeClient()
gemini_client = GeminiClient()
