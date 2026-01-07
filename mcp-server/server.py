#!/usr/bin/env python3
"""
Human-First AIスタッフ MCPサーバー

金子式・人間中心AI増幅システムの5人のAIスタッフを
Claude Desktop/Claude CodeからMCPツールとして利用可能にする

使用方法:
  Claude Desktop/Codeの設定ファイルに追加後、
  以下のツールが利用可能になります：

  - sachiko_respond: 秘書サチコによる応答
  - kenji_research: リサーチャーケンジによる調査
  - yuta_create: クリエイティブユウタによるコンテンツ作成
  - makoto_check: 品質管理マコトによるチェック
  - naomi_analyze: 学習ナオミによる分析
"""

import json
import os
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Central DB環境設定を読み込み
env_path = Path.home() / ".bluelamp" / "central-db.env"
if env_path.exists():
    load_dotenv(env_path)


# =============================================================================
# MCPサーバー初期化
# =============================================================================

mcp = FastMCP("human-first-ai-staff")


# =============================================================================
# Central DB接続
# =============================================================================

class CentralDBClient:
    """Central DBクライアント（PostgreSQL + pgvector + OpenAI Embedding）"""

    def __init__(self):
        self._pool = None
        self._openai = None
        self.database_url = os.getenv("DATABASE_URL")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def _get_pool(self):
        """データベース接続プール（遅延初期化）"""
        if self._pool is None and self.database_url:
            try:
                import psycopg
                from psycopg_pool import ConnectionPool
                self._pool = ConnectionPool(self.database_url, min_size=1, max_size=5)
            except ImportError:
                # psycopg_poolがない場合はシンプル接続
                pass
            except Exception as e:
                print(f"DB接続エラー: {e}")
        return self._pool

    def _get_openai(self):
        """OpenAIクライアント（遅延初期化）"""
        if self._openai is None and self.openai_api_key:
            try:
                from openai import OpenAI
                self._openai = OpenAI(api_key=self.openai_api_key)
            except Exception as e:
                print(f"OpenAI初期化エラー: {e}")
        return self._openai

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """テキストのEmbeddingを生成"""
        client = self._get_openai()
        if not client:
            return None

        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]  # 8000文字制限
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding生成エラー: {e}")
            return None

    def search_knowledge(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """ナレッジをベクトル検索（RAG）"""
        if not self.database_url:
            return []

        # クエリのEmbedding生成
        query_embedding = self.generate_embedding(query)
        if not query_embedding:
            return []

        try:
            import psycopg

            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    if category:
                        sql = """
                            SELECT id, title, content, summary, category, subcategory, tags, source,
                                   1 - (embedding <=> %s::vector) as similarity
                            FROM knowledge_base
                            WHERE embedding IS NOT NULL AND category = %s
                            ORDER BY embedding <=> %s::vector
                            LIMIT %s
                        """
                        cur.execute(sql, (json.dumps(query_embedding), category, json.dumps(query_embedding), limit))
                    else:
                        sql = """
                            SELECT id, title, content, summary, category, subcategory, tags, source,
                                   1 - (embedding <=> %s::vector) as similarity
                            FROM knowledge_base
                            WHERE embedding IS NOT NULL
                            ORDER BY embedding <=> %s::vector
                            LIMIT %s
                        """
                        cur.execute(sql, (json.dumps(query_embedding), json.dumps(query_embedding), limit))

                    columns = [desc[0] for desc in cur.description]
                    results = []
                    for row in cur.fetchall():
                        result = dict(zip(columns, row))
                        # UUIDを文字列に変換
                        if 'id' in result:
                            result['id'] = str(result['id'])
                        # similarityを小数点4桁に
                        if 'similarity' in result:
                            result['similarity'] = round(float(result['similarity']), 4)
                        results.append(result)

                    return results

        except Exception as e:
            print(f"検索エラー: {e}")
            return []

    def get_categories(self) -> Dict[str, int]:
        """カテゴリ一覧と件数を取得"""
        if not self.database_url:
            return {}

        try:
            import psycopg

            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT c.id, c.name, c.description, c.icon,
                               COALESCE(k.count, 0) as knowledge_count
                        FROM categories c
                        LEFT JOIN (
                            SELECT category, COUNT(*) as count
                            FROM knowledge_base
                            GROUP BY category
                        ) k ON c.id = k.category
                        ORDER BY c.name
                    """)

                    results = {}
                    for row in cur.fetchall():
                        results[row[0]] = {
                            "name": row[1],
                            "description": row[2],
                            "icon": row[3],
                            "count": row[4]
                        }
                    return results

        except Exception as e:
            print(f"カテゴリ取得エラー: {e}")
            return {}


# グローバルCentral DBクライアント
central_db = CentralDBClient()


# =============================================================================
# 共通定義
# =============================================================================

class CustomerTier(str, Enum):
    """顧客階層"""
    PREMIUM = "premium"
    STANDARD = "standard"
    ENTRY = "entry"
    LINE = "line"
    FREE = "free"


class EscalationLevel(str, Enum):
    """エスカレーションレベル"""
    HIGH = "high"
    MID = "mid"
    LOW = "low"


# 感情キーワード
EMOTION_KEYWORDS = {
    "high": ["死にたい", "自殺", "自傷", "死ぬ", "殺", "消えたい"],
    "mid": ["辛い", "つらい", "悲しい", "助けて", "限界", "離婚", "病気", "借金"],
    "low": ["不安", "心配", "モヤモヤ", "もやもや", "悩み", "迷い"],
}

# HSP避けるべき表現
HSP_AVOID = ["すぐに", "今すぐ", "絶対", "必ず", "〜しなければ", "〜すべき"]


def check_emotion(text: str) -> Optional[EscalationLevel]:
    """感情キーワードをチェック"""
    for level, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return EscalationLevel(level)
    return None


def add_ai_disclosure(content: str, agent_name: str) -> str:
    """AI開示ラベルを追加"""
    header = f"AI{agent_name}です\n\n"
    footer = "\n\n---\nこのメッセージはAI自動返信です\n金子への直接相談はいつでもどうぞ"
    return header + content + footer


# =============================================================================
# サチコ（秘書）
# =============================================================================

def _search_faq_knowledge(query: str) -> Optional[str]:
    """Central DBからFAQ関連ナレッジを検索"""
    results = central_db.search_knowledge(
        query=query,
        category="questions",
        limit=3
    )
    if results:
        answers = []
        for r in results:
            title = r.get("title", "")
            content = r.get("content", "")[:200]
            if title:
                answers.append(f"・{title}")
        return "\n".join(answers) if answers else None
    return None


@mcp.tool()
def sachiko_respond(
    message: str,
    customer_name: str = "お客様",
    tier: str = "free",
    use_knowledge: bool = True,
) -> str:
    """
    秘書エージェント「サチコ」による応答

    FAQ対応、タスク管理、スケジュール調整などを行います。
    Central DBから関連するFAQナレッジを検索して回答の参考にします。
    感情的な質問は金子さんへエスカレーションします。

    Args:
        message: お客様からのメッセージ
        customer_name: お客様の名前
        tier: 顧客階層 (premium/standard/entry/line/free)
        use_knowledge: Central DBからナレッジを検索するか

    Returns:
        サチコからの応答
    """
    # 階層チェック
    if tier in ["premium", "standard"]:
        return f"【エスカレーション】\n{tier}のお客様への対応は金子さんが直接行います。"

    # 感情キーワードチェック
    emotion = check_emotion(message)
    if emotion:
        if emotion == EscalationLevel.HIGH:
            return (
                "【緊急エスカレーション】\n"
                "大切なお話をありがとうございます。\n"
                "金子が直接お話を伺います。\n\n"
                "緊急の場合:\n"
                "いのちの電話: 0120-783-556"
            )
        elif emotion == EscalationLevel.MID:
            return add_ai_disclosure(
                f"{customer_name}さん、お気持ち受け止めました。\n"
                "このようなお話は金子が直接お返事いたします。\n"
                "48時間以内にご連絡しますね。",
                "秘書サチコ"
            )
        else:
            return add_ai_disclosure(
                f"{customer_name}さん、ご相談ありがとうございます。\n"
                "金子に共有しました。24時間以内に確認いたします。",
                "秘書サチコ"
            )

    # FAQ対応
    msg_lower = message.lower()

    if any(kw in msg_lower for kw in ["視聴", "見方", "再生", "動画"]):
        response = (
            "講座の視聴方法ですね！\n"
            "マイページの「講座一覧」からご覧いただけます。\n"
            "ご不明点があればお気軽にどうぞ！"
        )
    elif any(kw in msg_lower for kw in ["課題", "提出", "ワーク"]):
        response = (
            "課題の提出方法ですね！\n"
            "マイページの「課題提出」からアップロードできます。\n"
            "期限は各週の日曜23:59までです。"
        )
    elif any(kw in msg_lower for kw in ["料金", "価格", "プラン"]):
        response = (
            "プランについてですね！\n"
            "詳細は公式サイトでご確認いただけます。\n"
            "ご質問があれば金子に直接お聞きくださいね。"
        )
    else:
        # Central DBからFAQナレッジを検索
        knowledge_hint = ""
        if use_knowledge:
            faq_results = _search_faq_knowledge(message)
            if faq_results:
                knowledge_hint = f"\n\n【関連する質問パターン（参考）】\n{faq_results}"

        response = (
            f"{customer_name}さん、お問い合わせありがとうございます！\n"
            "この内容は金子に確認して、改めてご連絡しますね。"
            f"{knowledge_hint}"
        )

    return add_ai_disclosure(response, "秘書サチコ（Central DB参照）" if use_knowledge else "秘書サチコ")


# =============================================================================
# ケンジ（リサーチ）- Central DB連携版
# =============================================================================

@mcp.tool()
def kenji_research(
    query: str,
    research_type: str = "general",
    category: str = "",
    limit: int = 5,
) -> str:
    """
    リサーチエージェント「ケンジ」による調査

    競合分析、トレンド調査、Central DBナレッジ検索などを行います。
    調査結果は金子さんのレビューを経て使用されます。

    Args:
        query: 調査クエリ
        research_type: 調査種別 (competitor/trend/knowledge/general)
        category: Central DB検索時のカテゴリ絞り込み (methods/questions/clients/business/content/tech)
        limit: 検索結果の最大件数

    Returns:
        調査レポート
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    if research_type == "knowledge":
        # Central DBからRAG検索
        results = central_db.search_knowledge(
            query=query,
            category=category if category else None,
            limit=limit
        )

        if not results:
            report = f"""# 知識検索レポート: {query}

**検索日時**: {timestamp}
**カテゴリ**: {category or "全カテゴリ"}

## 検索結果

Central DBに該当するナレッジが見つかりませんでした。

### 考えられる原因
- 検索キーワードを変えてみてください
- まだ関連ナレッジが登録されていない可能性があります

---
*このレポートはAI「ケンジ」が作成しました*
"""
        else:
            report = f"""# 知識検索レポート: {query}

**検索日時**: {timestamp}
**カテゴリ**: {category or "全カテゴリ"}
**ヒット件数**: {len(results)}件

## 検索結果

"""
            for i, r in enumerate(results, 1):
                similarity = r.get('similarity', 0)
                confidence = "★★★★★" if similarity > 0.85 else "★★★★☆" if similarity > 0.75 else "★★★☆☆" if similarity > 0.65 else "★★☆☆☆"

                report += f"""### {i}. {r.get('title', '無題')}
- **カテゴリ**: {r.get('category', '-')} / {r.get('subcategory', '-') or '-'}
- **関連度**: {confidence} ({similarity:.1%})
- **タグ**: {', '.join(r.get('tags', []) or ['-'])}

{r.get('summary', '') or r.get('content', '')[:300]}{'...' if len(r.get('content', '')) > 300 else ''}

"""

            report += """---
*このレポートはAI「ケンジ」がCentral DBから取得しました*
*最終確認は金子さんが行います*
"""
        return report

    elif research_type == "categories":
        # カテゴリ一覧取得
        categories = central_db.get_categories()

        if not categories:
            return f"""# カテゴリ一覧

**取得日時**: {timestamp}

カテゴリ情報を取得できませんでした。

---
*このレポートはAI「ケンジ」が作成しました*
"""

        report = f"""# Central DB カテゴリ一覧

**取得日時**: {timestamp}

## カテゴリ

| アイコン | カテゴリ | 説明 | 件数 |
|:------:|--------|------|-----:|
"""
        for cat_id, info in categories.items():
            report += f"| {info.get('icon', '📁')} | **{info.get('name', cat_id)}** ({cat_id}) | {info.get('description', '-')} | {info.get('count', 0)}件 |\n"

        report += """
---
*このレポートはAI「ケンジ」が作成しました*
"""
        return report

    elif research_type == "competitor":
        report = f"""# 競合調査レポート: {query}

**調査日時**: {timestamp}
**信頼度**: ★★★☆☆ (要追加調査)

## 調査概要

競合チャンネル「{query}」について調査しました。

### 基本情報
- チャンネル名: {query}
- 推定登録者: [要調査]
- 主要コンテンツ: [要調査]

### 強み・弱み分析
[詳細調査が必要です]

### 金子さんとの差別化ポイント
[分析結果を追加予定]

---
*このレポートはAI「ケンジ」が作成しました*
*最終確認は金子さんが行います*
"""

    elif research_type == "trend":
        report = f"""# トレンド調査レポート: {query}

**調査日時**: {timestamp}
**信頼度**: ★★★☆☆

## 関連キーワード
- [キーワード1]
- [キーワード2]
- [キーワード3]

## トレンド傾向
現在のデータに基づく分析です。

## 推奨アクション
[提案を追加予定]

---
*このレポートはAI「ケンジ」が作成しました*
"""

    else:  # general
        # 一般調査でもCentral DBを検索してみる
        results = central_db.search_knowledge(query=query, limit=3)

        related_section = ""
        if results:
            related_section = "\n## Central DB関連ナレッジ\n\n"
            for r in results:
                related_section += f"- **{r.get('title', '無題')}** ({r.get('category', '-')}): {r.get('summary', '')[:100]}...\n"
            related_section += "\n詳細は `research_type: knowledge` で検索してください。\n"

        report = f"""# 調査レポート: {query}

**調査日時**: {timestamp}

## 調査内容

「{query}」について調査しました。

### 概要
[調査結果をここに記載]

### 詳細
[詳細分析を追加予定]
{related_section}
---
*このレポートはAI「ケンジ」が作成しました*
*最終確認は金子さんが行います*
"""

    return report


# =============================================================================
# ユウタ（クリエイティブ）- Central DB連携版
# =============================================================================

def _get_knowledge_context(topic: str, content_type: str) -> str:
    """トピックに関連するナレッジコンテキストを取得"""
    context_parts = []

    # メソッド・技法を検索
    methods = central_db.search_knowledge(
        query=f"{topic} 手法 テクニック",
        category="methods",
        limit=2
    )
    if methods:
        context_parts.append("【関連メソッド】")
        for m in methods:
            context_parts.append(f"- {m.get('title', '')}: {(m.get('summary', '') or m.get('content', ''))[:150]}")

    # 過去のコンテンツ・台本を検索
    if content_type == "script":
        scripts = central_db.search_knowledge(
            query=f"{topic} 台本 動画",
            category="content",
            limit=2
        )
        if scripts:
            context_parts.append("\n【参考コンテンツ】")
            for s in scripts:
                context_parts.append(f"- {s.get('title', '')}")

    # 質問パターンを検索
    questions = central_db.search_knowledge(
        query=topic,
        category="questions",
        limit=2
    )
    if questions:
        context_parts.append("\n【よくある質問】")
        for q in questions:
            context_parts.append(f"- {q.get('title', '')}")

    return "\n".join(context_parts) if context_parts else ""


@mcp.tool()
def yuta_create(
    topic: str,
    content_type: str = "script",
    use_knowledge: bool = True,
) -> str:
    """
    クリエイティブエージェント「ユウタ」によるコンテンツ作成

    台本下書き、フック文案、メルマガ下書きなどを作成します。
    Central DBから関連ナレッジを取得して参考情報として提示します。
    HSP配慮ガイドラインに従い、最終版は金子さんが完成させます。

    Args:
        topic: コンテンツのトピック
        content_type: コンテンツ種別 (script/hook/newsletter/thumbnail)
        use_knowledge: Central DBからナレッジを取得するか (デフォルト: True)

    Returns:
        作成したコンテンツ
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Central DBからナレッジコンテキストを取得
    knowledge_context = ""
    if use_knowledge:
        knowledge_context = _get_knowledge_context(topic, content_type)

    # ナレッジセクション生成
    knowledge_section = ""
    if knowledge_context:
        knowledge_section = f"""
---

## Central DBからの参考情報

{knowledge_context}

"""

    if content_type == "hook":
        content = f"""# フック文案: {topic}

**作成日時**: {timestamp}
**ナレッジ参照**: {"あり" if knowledge_context else "なし"}

## 好奇心型
1. 実は、{topic}には誰も教えてくれない「隠された理由」があります
2. {topic}を正しく理解している人は、実は10%もいません
3. 私が{topic}について気づいた、意外な真実をお話しします

## 共感型（HSP向け推奨）
1. 「{topic}」で悩んでいませんか？あなただけじゃないんです
2. もし{topic}がうまくいかないと感じているなら、この動画が役に立つかもしれません
3. 私も以前、{topic}で本当に苦しんでいました

## 問題提起型
1. なぜあなたの{topic}はうまくいかないのか？3つの原因
2. {topic}で失敗する人に共通する、たった1つの特徴
3. 「{topic}」を諦める前に、これだけは知っておいてください
{knowledge_section}
---
**推奨**: HSP向けには「共感型」が効果的です

*この案はAI「ユウタ」が作成しました（Central DB参照）*
*最終決定は金子さんで*
"""

    elif content_type == "thumbnail":
        content = f"""# サムネイルコピー案: {topic}

**作成日時**: {timestamp}
**ナレッジ参照**: {"あり" if knowledge_context else "なし"}

## インパクト重視
1. 知らないと損する{topic}の真実
2. {topic}で悩む人へ

## 共感重視（HSP向け推奨）
3. 私が{topic}で学んだこと
4. HSPさんのための{topic}講座

## シンプル
5. これだけは知っておいて｜{topic}
6. {topic}の「本当の意味」
{knowledge_section}
---
**デザイン推奨**:
- 背景: 落ち着いた色調（青・緑系）
- フォント: 読みやすい太めのゴシック
- 文字数: 15文字以内が理想

*この案はAI「ユウタ」が作成しました（Central DB参照）*
"""

    elif content_type == "newsletter":
        content = f"""# メルマガ下書き: {topic}

**作成日時**: {timestamp}
**ナレッジ参照**: {"あり" if knowledge_context else "なし"}

## 件名案（3案）
1. 「{topic}」について、ちょっとだけお話しさせてください
2. 【金子より】{topic}で大切なこと
3. ご質問いただいた「{topic}」についてお答えします

---

## 本文

こんにちは、金子です。

今日は「{topic}」について
少しだけお話しさせてください。

【ここに金子さんのパーソナルなエピソードを】

---

もしあなたも同じように感じていたら、
この考え方が少しでも参考になれば嬉しいです。

無理のない範囲で、
ご自身のペースで進んでくださいね。

それでは、また。

金子
{knowledge_section}
---
*この下書きはAI「ユウタ」が作成しました（Central DB参照）*
*最終版は金子さんが完成させます*
"""

    else:  # script
        content = f"""# 台本下書き: {topic}

**作成日時**: {timestamp}
**ステータス**: 下書き（金子さんの確認が必要）

---

## フック（導入15秒）

【3案から選択】
1. 「{topic}」で悩んでいませんか？
2. 実は、{topic}には隠された理由があります
3. 私が{topic}で気づいた大切なこと

---

## 導入部（30秒）

こんにちは、金子です。
今日は「{topic}」についてお話しします。

【ここに金子さんの実体験を入れてください】
例: 「実は私も以前、〇〇で悩んでいた時期がありました...」

---

## 本編

### 第1章: 〇〇とは（2分）
[ポイントを説明]

【金子さんの補足ポイント】
_ここに金子さんならではの視点を追加してください_

### 第2章: なぜ大切なのか（3分）
[具体例を交えて説明]

【金子さんの実体験エピソード】
_ここにクライアント事例（匿名化）を入れてください_

### 第3章: 実践のヒント（3分）

ご自身のペースで、無理のない範囲で
試してみてください。

---

## まとめ（1分）

今日は「{topic}」についてお話ししました。

もし参考になったら、
チャンネル登録していただけると嬉しいです。

---

## 確認事項（金子さんへ）
1. フック案のどれを採用しますか？
2. 実体験エピソードを追加してください
3. クライアント事例を1つ入れてください
{knowledge_section}
---
*この下書きはAI「ユウタ」が作成しました（Central DB参照）*
*最終版は金子さんが完成させます*
"""

    return content


# =============================================================================
# マコト（品質＆倫理）- Central DB連携版
# =============================================================================

def _get_quality_guidelines(content: str) -> str:
    """Central DBから品質ガイドラインを取得"""
    guidelines = []

    # methodsカテゴリからHSP関連の手法を検索
    methods = central_db.search_knowledge(
        query="HSP 配慮 コミュニケーション",
        category="methods",
        limit=2
    )
    if methods:
        guidelines.append("【HSP配慮のメソッド】")
        for m in methods:
            guidelines.append(f"・{m.get('title', '')}")

    # contentカテゴリからベストプラクティスを検索
    best_practices = central_db.search_knowledge(
        query="品質 ガイドライン 表現",
        category="content",
        limit=2
    )
    if best_practices:
        guidelines.append("\n【参考コンテンツ】")
        for b in best_practices:
            guidelines.append(f"・{b.get('title', '')}")

    return "\n".join(guidelines) if guidelines else ""


@mcp.tool()
def makoto_check(
    content: str,
    check_types: str = "all",
    use_knowledge: bool = True,
) -> str:
    """
    品質＆倫理エージェント「マコト」による品質チェック

    HSP共感度、倫理、技術品質、透明性をチェックします。
    Central DBからHSP配慮のガイドラインを取得して参照します。
    問題がある場合は修正提案を行います。

    Args:
        content: チェック対象のコンテンツ
        check_types: チェック種別 (hsp/ethics/technical/transparency/all)
        use_knowledge: Central DBからガイドラインを取得するか

    Returns:
        チェックレポート
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    issues = []
    suggestions = []
    scores = {}

    # HSPチェック
    if check_types in ["hsp", "all"]:
        hsp_issues = []
        for expr in HSP_AVOID:
            if expr in content:
                hsp_issues.append(f"「{expr}」はプレッシャーを与える可能性があります")

        hsp_score = max(1, 10 - len(hsp_issues) * 2)
        scores["HSP共感度"] = hsp_score

        if hsp_issues:
            issues.extend(hsp_issues)
            suggestions.append("安心感を与える表現（「ご自身のペースで」「無理のない範囲で」など）を使用してください")

    # 倫理チェック
    if check_types in ["ethics", "all"]:
        ethics_issues = []

        # 危険キーワード
        danger_keywords = ["自殺", "自傷", "死にたい"]
        for kw in danger_keywords:
            if kw in content:
                ethics_issues.append(f"危険キーワード検出: 「{kw}」")

        # 要注意キーワード
        warning_keywords = ["医療", "診断", "治療", "法律", "訴訟"]
        for kw in warning_keywords:
            if kw in content:
                ethics_issues.append(f"要注意: 「{kw}」- 専門家への相談を促してください")

        ethics_score = 1 if any("危険" in i for i in ethics_issues) else max(1, 10 - len(ethics_issues) * 2)
        scores["倫理"] = ethics_score

        if ethics_issues:
            issues.extend(ethics_issues)

    # 技術品質チェック
    if check_types in ["technical", "all"]:
        tech_score = 10

        if len(content) < 50:
            issues.append("内容が短すぎます")
            tech_score -= 2

        if len(content.split("\n\n")) < 2:
            suggestions.append("段落分けを追加すると読みやすくなります")
            tech_score -= 1

        scores["技術品質"] = max(1, tech_score)

    # 透明性チェック
    if check_types in ["transparency", "all"]:
        has_disclosure = any(pattern in content for pattern in
            ["AIです", "AI「", "自動返信", "AIアシスタント", "が作成しました"])

        if not has_disclosure:
            issues.append("AI開示ラベルがありません")
            suggestions.append("「このメッセージはAI自動返信です」などの開示を追加してください")

        scores["透明性"] = 10 if has_disclosure else 3

    # 総合判定
    overall_score = sum(scores.values()) / len(scores) if scores else 0
    overall_passed = all(s >= 7 for s in scores.values()) and not any("危険" in i for i in issues)

    status = "✅ 承認推奨" if overall_passed else "⚠️ 要修正"

    report = f"""# 品質チェックレポート

**総合判定**: {status}
**総合スコア**: {overall_score:.1f}/10
**チェック日時**: {timestamp}

---

## スコア詳細

"""
    for check_name, score in scores.items():
        icon = "✅" if score >= 7 else "❌"
        report += f"- {check_name}: {score}/10 {icon}\n"

    if issues:
        report += "\n## 問題点\n\n"
        for issue in issues:
            report += f"- {issue}\n"

    if suggestions:
        report += "\n## 改善提案\n\n"
        for suggestion in suggestions:
            report += f"- {suggestion}\n"

    # Central DBからガイドラインを取得
    if use_knowledge:
        guidelines = _get_quality_guidelines(content)
        if guidelines:
            report += f"\n## Central DBからの参考ガイドライン\n\n{guidelines}\n"

    db_note = "（Central DB参照）" if use_knowledge else ""
    report += f"""
---
*このレポートはAI「マコト」が作成しました{db_note}*
*最終判断は金子さんが行います*
"""

    return report


# =============================================================================
# ナオミ（学習＆分析）- Central DB連携版
# =============================================================================

def _get_analysis_context(analysis_type: str, query: str = "") -> str:
    """Central DBから分析に役立つコンテキストを取得"""
    context_parts = []

    if analysis_type == "progress":
        # 顧客育成メソッドを検索
        methods = central_db.search_knowledge(
            query="顧客育成 フォローアップ エンゲージメント",
            category="methods",
            limit=2
        )
        if methods:
            context_parts.append("【顧客育成メソッド】")
            for m in methods:
                context_parts.append(f"・{m.get('title', '')}")

    elif analysis_type == "video":
        # コンテンツ分析の知見を検索
        content_insights = central_db.search_knowledge(
            query="動画 パフォーマンス 分析",
            category="content",
            limit=2
        )
        if content_insights:
            context_parts.append("【参考コンテンツ】")
            for c in content_insights:
                context_parts.append(f"・{c.get('title', '')}")

    elif analysis_type == "churn":
        # 離脱防止メソッドを検索
        churn_methods = central_db.search_knowledge(
            query="離脱 防止 リテンション",
            category="methods",
            limit=2
        )
        if churn_methods:
            context_parts.append("【離脱防止メソッド】")
            for m in churn_methods:
                context_parts.append(f"・{m.get('title', '')}")

    # ビジネスインサイトを検索
    if query:
        business = central_db.search_knowledge(
            query=query,
            category="business",
            limit=2
        )
        if business:
            context_parts.append("\n【ビジネスインサイト】")
            for b in business:
                context_parts.append(f"・{b.get('title', '')}")

    return "\n".join(context_parts) if context_parts else ""


@mcp.tool()
def naomi_analyze(
    analysis_type: str = "progress",
    data: str = "{}",
    use_knowledge: bool = True,
) -> str:
    """
    学習エージェント「ナオミ」による分析

    動画パフォーマンス、顧客進捗、離脱リスクなどを分析します。
    Central DBから関連する分析メソッド・ビジネスインサイトを参照します。
    Premiumデータの分析は禁止されています。

    Args:
        analysis_type: 分析種別 (video/progress/churn/monthly/knowledge)
        data: 分析対象データ (JSON文字列)
        use_knowledge: Central DBからナレッジを取得するか

    Returns:
        分析レポート
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    try:
        parsed_data = json.loads(data) if data != "{}" else {}
    except json.JSONDecodeError:
        parsed_data = {}

    # Premium顧客チェック
    if parsed_data.get("tier") == "premium":
        return "【ブロック】Premium顧客の分析は金子さんが直接行います。"

    if analysis_type == "video":
        report = f"""# 動画パフォーマンス分析

**分析日時**: {timestamp}

## サマリー

- **対象動画数**: {parsed_data.get('video_count', '不明')}本
- **総視聴回数**: [データ連携後に表示]
- **平均CTR**: [データ連携後に表示]

## インサイト

1. [分析結果を追加予定]
2. [パターンを抽出予定]

## 推奨アクション

- [改善提案を追加予定]

---
*このレポートはAI「ナオミ」が作成しました*
"""

    elif analysis_type == "progress":
        customer_name = parsed_data.get("customer_name", "お客様")
        completion = parsed_data.get("completion_rate", 0)
        days_since = parsed_data.get("days_since_login", 0)

        risk = "高" if days_since >= 14 else "中" if days_since >= 7 else "低"

        report = f"""# 顧客進捗レポート

**分析日時**: {timestamp}

## {customer_name}さんの進捗

- **講座完了率**: {completion}%
- **最終ログイン**: {days_since}日前
- **離脱リスク**: {risk}

## インサイト

"""
        if days_since >= 14:
            report += "- ⚠️ 14日以上ログインがありません。フォローアップを推奨します。\n"
        elif completion >= 80:
            report += "- 講座進捗が順調です！\n"
        elif completion < 30:
            report += "- 講座進捗が停滞しています。励ましのメッセージを検討してください。\n"

        report += """
## 推奨アクション

"""
        if days_since >= 14:
            report += "- 【緊急】金子さんからの直接フォローアップを推奨\n"
        elif days_since >= 7:
            report += "- 励ましメッセージの送信を検討\n"

        report += """
---
*このレポートはAI「ナオミ」が作成しました*
"""

    elif analysis_type == "churn":
        report = f"""# 離脱リスク検知レポート

**検知日時**: {timestamp}

## 高リスク顧客（14日以上ログインなし）

[顧客データ連携後に表示]

## 中リスク顧客（7-13日ログインなし）

[顧客データ連携後に表示]

## 推奨アクション

- 高リスク顧客には金子さんからの直接フォローを
- 中リスク顧客には励ましメッセージを送信

---
*このレポートはAI「ナオミ」が作成しました*
"""

    else:  # monthly
        period = parsed_data.get("period", datetime.now().strftime("%Y年%m月"))

        report = f"""# 月次レポート: {period}

**作成日**: {timestamp}

## KPIサマリー

| 指標 | 数値 | 前月比 |
|-----|------|--------|
| 新規会員 | - | - |
| 退会 | - | - |
| 継続率 | - | - |

## AI活用状況

- **AI対応件数**: [集計予定]
- **人間対応件数**: [集計予定]

## 今月のハイライト

- [成功事例をここに]

## 来月の注力ポイント

- [金子さんに確認して記入]

---
*この下書きはAI「ナオミ」が作成しました*
*最終版は金子さんが確認・編集します*
"""

    # Central DBからコンテキストを取得
    if use_knowledge:
        query = parsed_data.get("customer_name", "") or parsed_data.get("topic", "")
        context = _get_analysis_context(analysis_type, query)
        if context:
            report += f"\n## Central DBからの参考情報\n\n{context}\n"
        report = report.replace("が作成しました", "が作成しました（Central DB参照）")

    return report


# =============================================================================
# メイン
# =============================================================================

if __name__ == "__main__":
    mcp.run()
