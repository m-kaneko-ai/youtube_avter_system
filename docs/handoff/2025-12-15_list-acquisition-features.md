# 引き継ぎ書：リスト獲得機能実装

**作成日**: 2025-12-15
**次回開始タスク**: リスト獲得機能の要件定義・実装
**推奨エージェント**: 拡張要件定義エージェント

---

## 1. プロジェクト現状サマリー

### Creator Studio AI - 完成度

| 機能領域 | 完成度 | 状況 |
|----------|--------|------|
| 動画制作・公開ワークフロー | 95% | ほぼ完成 |
| AI生成機能（台本・メタデータ） | 90% | OK |
| 分析機能 | 60% | パフォーマンス分析OK |
| **リスト獲得機能** | **10%** | 大幅に欠落 ← **次回実装対象** |

### 本日完了した作業
1. 編集タブからVrewブランディング削除、素材ダウンロードセクション追加
2. 編集タブにプレビュー機能追加（音声/アバター/統合の3モード）
3. 台本ページにビジュアル設定機能追加（画像/スライド/アバターのみ）
4. YouTube→リスト獲得フローの詳細分析

---

## 2. 問題分析：リスト獲得フローの欠落

### 現状のフロー（問題あり）
```
YouTube公開 → ✅ OK
    ↓
視聴者が見る → ✅ OK
    ↓
説明欄にLINE/LPリンク → ❌ 手動入力が必要
    ↓
リスト獲得数の計測 → ❌ できない
    ↓
LINE/メール連携 → ❌ なし
```

### 欠けている重要機能

| 機能 | 説明 | 現状 |
|------|------|------|
| CTA管理 | リスト誘導の文言とリンクをテンプレート管理 | なし |
| 説明欄リンク自動挿入 | LINE/LP/リードマグネットURLを自動挿入 | なし |
| リードマグネット管理 | 無料PDF等のファイル管理・リンク生成 | なし |
| LINE連携 | LINE公式アカウントとのOAuth連携 | なし |
| リスト獲得トラッキング | どの動画から何人獲得したか計測 | なし |

---

## 3. 実装ロードマップ（推奨）

### Phase 1: MVP（最優先）- 約1週間

#### 3.1 CTA管理機能（2-3日）

**新規ファイル**:
```
frontend/src/pages/admin/components/CTAManagementTab.tsx
frontend/src/services/cta.ts
frontend/src/types/cta.ts
```

**型定義案**:
```typescript
interface CTATemplate {
  id: string;
  name: string;                    // 例: "LINE友達追加"
  type: 'line' | 'email' | 'download' | 'custom';
  text: string;                    // 例: "【無料】LINE登録で特典GET"
  url: string;                     // リンクURL
  utmParams?: {
    source: string;
    medium: string;
    campaign: string;
  };
  isDefault: boolean;
  createdAt: string;
}

interface VideoCTAMapping {
  videoId: string;
  ctaIds: string[];
  insertPosition: 'top' | 'middle' | 'bottom';
}
```

**UI設計**:
- 管理ページ（/admin）に「CTA管理」タブ追加
- CTAテンプレート一覧表示
- 新規作成/編集/削除
- デフォルトCTA設定

#### 3.2 説明欄リンク自動挿入（1-2日）

**修正ファイル**:
```
frontend/src/services/script.ts  - generateDescription()にCTA挿入ロジック追加
frontend/src/pages/script/components/SEOTab.tsx - CTA選択UI追加
```

**実装内容**:
- 説明文生成時にCTAテンプレートを選択可能に
- UTMパラメータ自動付加
- プレビューで確認可能

#### 3.3 リスト獲得メトリクス表示（1日）

**修正ファイル**:
```
frontend/src/services/analytics.ts - leadsCount追加
frontend/src/pages/dashboard/DashboardPage.tsx - KPI表示追加
```

**実装内容**:
- ダッシュボードに「リスト獲得数」KPI追加
- 日次/週次/月次のグラフ表示
- 動画別リスト獲得数ランキング

### Phase 2: LINE/リードマグネット（2週目）

#### 3.4 LINE公式アカウント連携（3-4日）

**新規ファイル**:
```
frontend/src/pages/admin/components/IntegrationTab.tsx
frontend/src/services/integration.ts
```

**実装内容**:
- LINE Messaging API OAuth連携
- 友達追加数の取得
- Webhook設定（友達追加イベント受信）

#### 3.5 リードマグネット管理（2-3日）

**新規ファイル**:
```
frontend/src/pages/admin/components/LeadMagnetTab.tsx
frontend/src/services/leadMagnet.ts
```

**実装内容**:
- PDFアップロード（GCS連携）
- ダウンロードリンク自動生成
- ダウンロード数トラッキング

### Phase 3: 高度な分析（3週目以降）

- コンバージョンファネル分析
- A/Bテスト機能
- 自動化フロー（Zapier/Make連携）

---

## 4. 技術的詳細

### 4.1 変更が必要なファイル一覧

**新規作成**:
```
frontend/src/pages/admin/components/CTAManagementTab.tsx
frontend/src/pages/admin/components/LeadMagnetTab.tsx
frontend/src/pages/admin/components/IntegrationTab.tsx
frontend/src/services/cta.ts
frontend/src/services/leadMagnet.ts
frontend/src/services/integration.ts
frontend/src/types/cta.ts
frontend/src/types/leadMagnet.ts
```

**修正**:
```
frontend/src/constants/pages.tsx - 管理ページにタブ追加
frontend/src/pages/admin/AdminPage.tsx - 新タブ読み込み
frontend/src/services/script.ts - 説明文生成にCTA挿入
frontend/src/services/analytics.ts - リスト獲得メトリクス追加
frontend/src/pages/dashboard/DashboardPage.tsx - KPI表示
```

### 4.2 バックエンドAPI（将来必要）

```
POST   /api/v1/ctas                    # CTA作成
GET    /api/v1/ctas                    # CTA一覧
PUT    /api/v1/ctas/:id                # CTA更新
DELETE /api/v1/ctas/:id                # CTA削除
POST   /api/v1/videos/:id/ctas         # 動画にCTA割り当て

POST   /api/v1/lead-magnets            # リードマグネット作成
GET    /api/v1/lead-magnets            # 一覧
GET    /api/v1/lead-magnets/:id/download-link  # DLリンク生成

GET    /api/v1/integrations/line/oauth # LINE OAuth開始
POST   /api/v1/integrations/line/callback  # OAuth コールバック
GET    /api/v1/analytics/leads         # リスト獲得数
```

### 4.3 データベーススキーマ（将来必要）

```sql
-- CTAテンプレート
CREATE TABLE cta_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  url VARCHAR(500) NOT NULL,
  utm_source VARCHAR(50),
  utm_medium VARCHAR(50),
  utm_campaign VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 動画-CTA紐付け
CREATE TABLE video_ctas (
  video_id UUID REFERENCES videos(id),
  cta_id UUID REFERENCES cta_templates(id),
  insert_position VARCHAR(20),
  PRIMARY KEY (video_id, cta_id)
);

-- リードマグネット
CREATE TABLE lead_magnets (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- リスト獲得イベント
CREATE TABLE lead_events (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  source VARCHAR(50),  -- 'line', 'email', 'download'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. 次回セッション開始手順

### 推奨フロー

1. **要件定義の詳細化**
   - CTA管理のUI/UX詳細設計
   - 説明欄テンプレートの具体的フォーマット
   - LINE連携の認証フロー確認

2. **Phase 1実装開始**
   - CTAManagementTab.tsx 作成
   - cta.ts サービス作成
   - pages.tsx にタブ追加
   - AdminPage.tsx でタブ読み込み

3. **動作確認**
   - CTAテンプレート作成・編集・削除
   - 説明文生成時のCTA挿入確認
   - ダッシュボードKPI表示確認

---

## 6. 参考：競合比較

| 機能 | Vidyo.ai | Opus Clip | 本システム（現状） | 本システム（実装後） |
|------|----------|----------|------------------|-------------------|
| CTA管理 | ✅ | ✅ | ❌ | ✅ |
| 説明欄リンク自動挿入 | ✅ | ✅ | ❌ | ✅ |
| リードマグネット | ✅ | ✅ | ❌ | ✅ |
| LINE連携 | ✅ | ❌ | ❌ | ✅ |
| リスト獲得トラッキング | ✅ | ✅ | ❌ | ✅ |

---

## 7. 補足：本日見送った機能

以下は「動画品質向上」のための機能で、リスト獲得機能の後に実装推奨：

- 画像ライブラリ（過去画像の再利用）
- AI画像提案（台本から自動で画像提案）
- スライドテンプレート
- ドラッグ&ドロップ画像アップロード

---

**作成者**: Claude Code
**最終更新**: 2025-12-15 03:50 JST
