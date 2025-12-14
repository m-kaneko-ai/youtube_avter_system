# システムプロンプト設計

## 概要
各機能で使用するAIプロンプトの設計書。
ナレッジDBから動的に情報を注入して使用する。

## プロンプト一覧

| ID | 機能 | 用途 | モデル推奨 |
|----|------|------|-----------|
| P001 | ナレッジ解析 | PDF/テキストから情報抽出 | Claude |
| P002 | ヒアリング | 不足情報の深掘り質問 | Claude |
| P003 | 競合分析 | YouTube競合チャンネル分析 | Gemini |
| P004 | 企画生成 | 動画企画アイデア生成 | Claude |
| P005 | 台本生成A | Claude版台本 | Claude |
| P006 | 台本生成B | Gemini版台本 | Gemini |
| P007 | タイトル生成 | SEO最適化タイトル | Claude |
| P008 | サムネイル指示 | サムネイル生成プロンプト | Claude |
| P009 | 分析レポート | パフォーマンス分析 | Claude |

## ナレッジ注入パターン

```
{knowledge.mainTarget.attributes}  → ターゲット属性
{knowledge.mainTarget.painPoints}  → 悩み
{knowledge.ahaConcept.insight}     → インサイト
{knowledge.ahaConcept.naming}      → コンセプト名
{knowledge.conceptStory.character} → キャラクター
```

## ファイル構成

```
docs/prompts/
├── README.md（この文書）
├── P001_knowledge_analysis.md
├── P002_hearing.md
├── P003_competitor_analysis.md
├── P004_planning.md
├── P005_script_claude.md
├── P006_script_gemini.md
├── P007_title_generation.md
├── P008_thumbnail.md
└── P009_analytics_report.md
```
