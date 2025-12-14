# MCPオーケストレーター設計

## 概要

各ページ/機能がナレッジを参照する際の統一インターフェース。
Claude Codeで使用しているMCPサーバーをバックエンドAPIでも活用。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ResearchPage  │ PlanningPage │ ScriptPage │ ProductionPage │
└───────┬────────┴──────┬───────┴─────┬──────┴───────┬────────┘
        │               │             │              │
        ▼               ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         KnowledgeOrchestrator Service               │   │
│  │                                                     │   │
│  │  get_knowledge_context(client_id, purpose)          │   │
│  │  → ナレッジ取得 + プロンプト構築 + AI呼び出し       │   │
│  │                                                     │   │
│  │  inject_knowledge_to_prompt(prompt_template, data)  │   │
│  │  → テンプレートにナレッジを注入                     │   │
│  │                                                     │   │
│  │  update_knowledge_from_feedback(analytics_data)     │   │
│  │  → 分析結果からナレッジを改善                       │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │central-db  │  │  Claude    │  │  Gemini    │           │
│  │   (MCP)    │  │    API     │  │    API     │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 主要フロー

### 1. 台本生成フロー

```python
# backend/app/services/knowledge_orchestrator.py

class KnowledgeOrchestrator:

    async def generate_script(
        self,
        client_id: str,
        planning_id: str,
        video_type: str  # "short" | "long"
    ) -> ScriptResult:

        # 1. ナレッジ取得（central-db MCP経由）
        knowledge = await self.mcp_client.search_knowledge(
            query=f"client:{client_id}",
            category="clients"
        )

        # 2. プロンプトテンプレート取得
        prompt_template = self.load_prompt("P005_script_claude")

        # 3. ナレッジ注入
        filled_prompt = self.inject_knowledge(
            template=prompt_template,
            knowledge=knowledge,
            planning=await self.get_planning(planning_id)
        )

        # 4. Claude API呼び出し
        script = await self.claude_client.generate(
            system=filled_prompt["system"],
            user=filled_prompt["user"]
        )

        # 5. 結果を保存
        await self.save_script(planning_id, script)

        return script
```

### 2. ナレッジ検索フロー

```python
async def get_knowledge_context(
    self,
    client_id: str,
    purpose: str  # "research" | "planning" | "script" | "production"
) -> KnowledgeContext:

    # 目的に応じて必要なセクションを選択
    required_sections = {
        "research": ["mainTarget", "competitor"],
        "planning": ["mainTarget", "ahaConcept", "competitor"],
        "script": ["mainTarget", "ahaConcept", "conceptStory", "company"],
        "production": ["conceptStory", "company"],
    }

    sections = required_sections.get(purpose, [])

    # central-dbからナレッジ取得
    knowledge = await self.mcp_client.search_knowledge(
        query=f"client:{client_id}",
        limit=10
    )

    # 必要なセクションのみフィルタリング
    filtered = self.filter_sections(knowledge, sections)

    return KnowledgeContext(
        client_id=client_id,
        purpose=purpose,
        data=filtered
    )
```

## central-db スキーマ拡張

現在のcentral-db MCPに以下のカテゴリを追加：

```
categories:
  - clients      # クライアント別ナレッジ（NEW）
  - methods      # 金子式メソッド
  - questions    # 質問パターン
  - business     # 営業ナレッジ
  - content      # コンテンツ
  - tech         # 技術ドキュメント
```

### クライアントナレッジの保存形式

```json
{
  "title": "ミツえもん - メインターゲット",
  "category": "clients",
  "subcategory": "main_target",
  "tags": ["client:mitsuemon", "section:main_target"],
  "content": {
    "attributes": "30-40代の起業家",
    "situation": "...",
    "painPoints": "...",
    "desires": "...",
    "insights": "..."
  },
  "source_type": "chatbot",
  "source": "knowledge_chat_session_123"
}
```

## フロントエンド連携

### ナレッジ参照フック

```typescript
// frontend/src/hooks/useKnowledge.ts

export const useKnowledge = (clientId: string, purpose: KnowledgePurpose) => {
  return useQuery({
    queryKey: ['knowledge', clientId, purpose],
    queryFn: () => knowledgeService.getContext(clientId, purpose),
  });
};

// 使用例: 台本ページ
const ScriptPage = () => {
  const { clientId } = useParams();
  const { data: knowledge } = useKnowledge(clientId, 'script');

  // ナレッジを台本生成に使用
  const generateScript = () => {
    scriptService.generate({
      clientId,
      planningId,
      knowledgeContext: knowledge
    });
  };
};
```

## 実装優先順位

1. **Phase 1**: KnowledgeOrchestrator基本実装
   - central-db連携
   - プロンプト注入

2. **Phase 2**: 各ページ連携
   - Script Page（最重要）
   - Planning Page
   - Research Page

3. **Phase 3**: フィードバックループ
   - Analytics → Knowledge改善
   - A/Bテスト結果の学習
