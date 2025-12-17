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

    async def analyze_trend(
        self,
        keyword: str,
        context: dict,
    ) -> Dict[str, Any]:
        """
        トレンドの重要度を分析

        Args:
            keyword: 分析対象のキーワード
            context: トレンドのコンテキスト情報（search_volume, growth_rate等）

        Returns:
            Dict: {
                "importance": "high/medium/low",
                "reason": str,
                "recommendations": list
            }
        """
        if not self.is_available():
            return {"error": "Claude API is not available"}

        try:
            prompt = f"""以下のトレンドキーワードの重要度を分析してください。

【キーワード】
{keyword}

【コンテキスト情報】
{context}

【分析観点】
- 検索ボリュームの大きさ
- 成長率・トレンドの勢い
- YouTube動画コンテンツとの親和性
- 競合状況
- 収益化の可能性

【出力形式】
importance: high/medium/low のいずれか
reason: 重要度の判断理由（100文字程度）
recommendations: このトレンドを活用するための具体的な提案（3-5個）

JSON形式で出力してください。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            result = json.loads(message.content[0].text)
            return result

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e)}

    async def analyze_competitor(
        self,
        channel_data: dict,
        video_data: list,
    ) -> Dict[str, Any]:
        """
        競合チャンネルの分析レポート生成

        Args:
            channel_data: チャンネル情報
            video_data: 動画データリスト

        Returns:
            Dict: {
                "strengths": list,
                "weaknesses": list,
                "opportunities": list,
                "summary": str
            }
        """
        if not self.is_available():
            return {"error": "Claude API is not available"}

        try:
            prompt = f"""以下の競合チャンネルデータを分析し、SWOT分析レポートを作成してください。

【チャンネル情報】
{channel_data}

【最近の動画データ】
{video_data}

【分析観点】
- コンテンツ戦略の強み
- 弱点や改善点
- 自社が参考にできる機会
- 動画の傾向やパターン
- エンゲージメント率

【出力形式】
strengths: 強み（3-5個）
weaknesses: 弱点（3-5個）
opportunities: 自社にとっての機会（3-5個）
summary: 総合サマリー（200文字程度）

JSON形式で出力してください。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            result = json.loads(message.content[0].text)
            return result

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e)}

    async def analyze_performance(
        self,
        metrics: dict,
    ) -> Dict[str, Any]:
        """
        パフォーマンスサマリーを生成

        Args:
            metrics: パフォーマンス指標データ

        Returns:
            Dict: {
                "summary": str,
                "insights": list,
                "recommendations": list
            }
        """
        if not self.is_available():
            return {"error": "Claude API is not available"}

        try:
            prompt = f"""以下のパフォーマンス指標を分析し、サマリーレポートを作成してください。

【パフォーマンス指標】
{metrics}

【分析観点】
- 視聴回数・視聴維持率のトレンド
- エンゲージメント（いいね、コメント、シェア）の傾向
- クリック率（CTR）の評価
- 好調な動画の共通点
- 改善が必要な領域

【出力形式】
summary: 全体的なサマリー（150文字程度）
insights: 重要な洞察（3-5個）
recommendations: 改善のための具体的提案（3-5個）

JSON形式で出力してください。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            result = json.loads(message.content[0].text)
            return result

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e)}

    async def evaluate_script_quality(
        self,
        script: str,
        criteria: dict,
    ) -> Dict[str, Any]:
        """
        台本の品質評価（QAチェッカー用）

        Args:
            script: 評価対象の台本
            criteria: 評価基準（target_audience, style, duration等）

        Returns:
            Dict: {
                "score": int (0-100),
                "evaluation": dict,
                "improvements": list
            }
        """
        if not self.is_available():
            return {"error": "Claude API is not available"}

        try:
            prompt = f"""以下の台本の品質を評価してください。

【台本】
{script}

【評価基準】
{criteria}

【評価項目】
1. 導入の魅力度（視聴者を引き込めるか）
2. 構成の明確さ（論理的な流れか）
3. 具体性（具体例や数値が適切か）
4. ターゲット適合性（ターゲット層に刺さるか）
5. エンディングの強さ（行動を促せるか）
6. 文字数・尺の適切さ

【出力形式】
score: 総合点（0-100）
evaluation: 各項目の評価（項目名: スコア(0-100)と理由）
improvements: 改善提案（3-5個の具体的な修正案）

JSON形式で出力してください。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            result = json.loads(message.content[0].text)
            return result

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e)}

    async def analyze_keywords(
        self,
        keywords: list,
        context: str,
    ) -> Dict[str, Any]:
        """
        キーワード分析（キーワードリサーチ用）

        Args:
            keywords: 分析対象のキーワードリスト
            context: コンテキスト情報（チャンネル方向性、ターゲット層等）

        Returns:
            Dict: {
                "relevance_scores": dict,
                "suggestions": list,
                "grouped": dict
            }
        """
        if not self.is_available():
            return {"error": "Claude API is not available"}

        try:
            prompt = f"""以下のキーワードリストを分析してください。

【キーワードリスト】
{keywords}

【コンテキスト】
{context}

【分析タスク】
1. 各キーワードの関連性スコアを算出（0-100）
2. 追加で検討すべきキーワードを提案
3. キーワードをテーマ別にグループ化

【出力形式】
relevance_scores: キーワード名: スコア（0-100）と理由
suggestions: 追加提案キーワード（5-10個）
grouped: テーマ名: [キーワードリスト] の形式でグループ化

JSON形式で出力してください。
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            import json
            result = json.loads(message.content[0].text)
            return result

        except Exception as e:
            print(f"Claude API Error: {e}")
            return {"error": str(e)}


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

    async def generate_comment_reply(
        self,
        comment: str,
        video_context: dict,
        tone: str = "friendly",
    ) -> Dict[str, Any]:
        """
        コメントへの返信文を生成

        Args:
            comment: コメント本文
            video_context: 動画のコンテキスト情報
            tone: 返信のトーン (friendly, professional, casual, etc.)

        Returns:
            Dict: {"reply": str, "sentiment": str, "tags": list}
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "reply": None}

        try:
            video_title = video_context.get("title", "")
            video_description = video_context.get("description", "")

            prompt = f"""あなたはYouTubeチャンネルのコミュニティマネージャーです。
視聴者のコメントに対して、適切で親しみやすい返信を作成してください。

【動画情報】
タイトル: {video_title}
説明: {video_description[:200]}...

【コメント】
{comment}

【返信のトーン】
{tone}

【要件】
- 視聴者に感謝の気持ちを伝える
- コメントの内容に具体的に応える
- エンゲージメントを高める質問や提案を含める
- 自然で人間らしい表現
- 100文字以内

返信文のみを出力してください。
"""

            response = self.model.generate_content(prompt)
            reply_text = response.text.strip()

            # センチメント分析用プロンプト
            sentiment_prompt = f"""以下のコメントのセンチメントを分析してください。

【コメント】
{comment}

positive, negative, neutral のいずれかで答えてください。1単語のみ出力してください。
"""

            sentiment_response = self.model.generate_content(sentiment_prompt)
            sentiment = sentiment_response.text.strip().lower()

            # タグ抽出用プロンプト
            tags_prompt = f"""以下のコメントから、関連するトピックやカテゴリを抽出してください。

【コメント】
{comment}

カテゴリ例: 質問、感想、提案、技術的な問題、賞賛、批判、その他

該当するカテゴリをカンマ区切りで出力してください。
"""

            tags_response = self.model.generate_content(tags_prompt)
            tags = [tag.strip() for tag in tags_response.text.strip().split(",")]

            return {
                "reply": reply_text,
                "sentiment": sentiment if sentiment in ["positive", "negative", "neutral"] else "neutral",
                "tags": tags,
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "reply": None}

    async def generate_planning_suggestions(
        self,
        trend_data: dict,
        knowledge_context: str,
    ) -> Dict[str, Any]:
        """
        トレンドに基づく企画提案を生成

        Args:
            trend_data: トレンドデータ（キーワード、トピック等）
            knowledge_context: ナレッジDB からのコンテキスト

        Returns:
            Dict: {"suggestions": list, "priority": list, "reasoning": str}
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "suggestions": None}

        try:
            trending_keywords = trend_data.get("keywords", [])
            trending_topics = trend_data.get("topics", [])

            prompt = f"""あなたはYouTube動画の企画プランナーです。
トレンドデータとナレッジコンテキストを元に、動画企画を5つ提案してください。

【トレンドキーワード】
{', '.join(trending_keywords[:10]) if trending_keywords else 'なし'}

【トレンドトピック】
{', '.join(trending_topics[:10]) if trending_topics else 'なし'}

【ナレッジコンテキスト】
{knowledge_context[:500]}...

【要件】
- トレンドを活かした企画
- ターゲット視聴者に響く内容
- 実現可能性が高い
- 競合との差別化
- SEOを意識したキーワード

各企画について以下の形式で出力してください:

企画1: [タイトル]
概要: [簡単な説明]
見込み視聴数: [high/medium/low]

企画2: ...
"""

            response = self.model.generate_content(prompt)
            content = response.text

            # 企画を解析
            import re
            suggestions = []
            pattern = r'企画\d+:\s*(.+?)\n概要:\s*(.+?)\n見込み視聴数:\s*(\w+)'
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)

            for match in matches:
                suggestions.append({
                    "title": match.group(1).strip(),
                    "description": match.group(2).strip(),
                    "estimated_views": match.group(3).strip().lower(),
                })

            # 優先度順にソート
            priority_order = {"high": 1, "medium": 2, "low": 3}
            sorted_suggestions = sorted(
                suggestions,
                key=lambda x: priority_order.get(x.get("estimated_views", "low"), 3)
            )

            # 優先度リストを作成
            priority = [s["title"] for s in sorted_suggestions]

            return {
                "suggestions": sorted_suggestions,
                "priority": priority,
                "reasoning": "トレンドデータとナレッジコンテキストに基づく企画提案",
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "suggestions": None}

    async def suggest_improvements(
        self,
        content: str,
        content_type: str,
    ) -> Dict[str, Any]:
        """
        コンテンツの改善提案を生成

        Args:
            content: 改善対象のコンテンツ
            content_type: コンテンツタイプ (script, title, description, thumbnail, etc.)

        Returns:
            Dict: {"improvements": list, "priority_order": list, "estimated_impact": dict}
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "improvements": None}

        try:
            content_type_ja = {
                "script": "台本",
                "title": "タイトル",
                "description": "説明文",
                "thumbnail": "サムネイル",
            }.get(content_type, content_type)

            prompt = f"""あなたはYouTubeコンテンツの品質管理専門家です。
以下の{content_type_ja}を分析し、改善提案をしてください。

【{content_type_ja}】
{content[:2000]}...

【分析観点】
- 視聴者への訴求力
- SEO最適化
- エンゲージメント要素
- クリック率（CTR）
- 視聴維持率
- ブランド一貫性

【要件】
- 具体的で実行可能な改善案
- 優先度の高い順に提案
- 各改善の期待効果を明示

以下の形式で出力してください:

改善案1: [タイトル]
詳細: [具体的な改善内容]
優先度: [high/medium/low]
期待効果: [具体的な効果]

改善案2: ...
"""

            response = self.model.generate_content(prompt)
            content_text = response.text

            # 改善案を解析
            import re
            improvements = []
            pattern = r'改善案\d+:\s*(.+?)\n詳細:\s*(.+?)\n優先度:\s*(\w+)\n期待効果:\s*(.+?)(?=\n改善案|\Z)'
            matches = re.finditer(pattern, content_text, re.MULTILINE | re.DOTALL)

            for match in matches:
                improvements.append({
                    "title": match.group(1).strip(),
                    "detail": match.group(2).strip(),
                    "priority": match.group(3).strip().lower(),
                    "expected_impact": match.group(4).strip(),
                })

            # 優先度順にソート
            priority_order = {"high": 1, "medium": 2, "low": 3}
            sorted_improvements = sorted(
                improvements,
                key=lambda x: priority_order.get(x.get("priority", "low"), 3)
            )

            # 優先度リストを作成
            priority_list = [imp["title"] for imp in sorted_improvements]

            # インパクト推定
            estimated_impact = {
                "ctr_improvement": "5-15%",
                "engagement_improvement": "10-20%",
                "seo_score_improvement": "medium",
            }

            return {
                "improvements": sorted_improvements,
                "priority_order": priority_list,
                "estimated_impact": estimated_impact,
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "improvements": None}

    async def generate_keyword_ideas(
        self,
        seed_keywords: list,
        category: str,
    ) -> Dict[str, Any]:
        """
        関連キーワードアイデアを生成

        Args:
            seed_keywords: シードキーワードリスト
            category: カテゴリ (ビジネス、教育、エンタメ、等)

        Returns:
            Dict: {"keywords": list, "long_tail": list, "trending": list}
        """
        if not self.is_available():
            return {"error": "Gemini API is not available", "keywords": None}

        try:
            seed_keywords_str = ", ".join(seed_keywords) if seed_keywords else ""

            prompt = f"""あなたはSEOとキーワードリサーチの専門家です。
以下のシードキーワードとカテゴリを元に、YouTube動画のキーワードアイデアを提案してください。

【シードキーワード】
{seed_keywords_str}

【カテゴリ】
{category}

【要件】
- 検索ボリュームが期待できるキーワード
- ロングテールキーワード
- トレンド性のあるキーワード
- 競合が少ない穴場キーワード

以下の形式で出力してください:

【関連キーワード】（10個）
キーワード1
キーワード2
...

【ロングテールキーワード】（10個）
ロングテール1
ロングテール2
...

【トレンドキーワード】（5個）
トレンド1
トレンド2
...
"""

            response = self.model.generate_content(prompt)
            content_text = response.text

            # キーワードを抽出
            import re

            # 関連キーワード
            keywords_section = re.search(
                r'【関連キーワード】.*?\n(.*?)(?=\n【|$)',
                content_text,
                re.DOTALL
            )
            keywords = []
            if keywords_section:
                keywords = [
                    line.strip().lstrip('キーワード0123456789.')
                    for line in keywords_section.group(1).strip().split('\n')
                    if line.strip()
                ]

            # ロングテールキーワード
            long_tail_section = re.search(
                r'【ロングテールキーワード】.*?\n(.*?)(?=\n【|$)',
                content_text,
                re.DOTALL
            )
            long_tail = []
            if long_tail_section:
                long_tail = [
                    line.strip().lstrip('ロングテール0123456789.')
                    for line in long_tail_section.group(1).strip().split('\n')
                    if line.strip()
                ]

            # トレンドキーワード
            trending_section = re.search(
                r'【トレンドキーワード】.*?\n(.*?)(?=\n【|$)',
                content_text,
                re.DOTALL
            )
            trending = []
            if trending_section:
                trending = [
                    line.strip().lstrip('トレンド0123456789.')
                    for line in trending_section.group(1).strip().split('\n')
                    if line.strip()
                ]

            return {
                "keywords": keywords[:10],
                "long_tail": long_tail[:10],
                "trending": trending[:5],
                "provider": AIProvider.GEMINI.value,
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": str(e), "keywords": None}


# シングルトンインスタンス
claude_client = ClaudeClient()
gemini_client = GeminiClient()
