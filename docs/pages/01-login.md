# 1. ログインページ

## 基本情報

| 項目 | 内容 |
|-----|------|
| パス | `/login` |
| 認証 | 不要 |
| ロール | 全員 |

## ワイヤーフレーム

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Creator Studio AI                        │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │                         │                   │
│              │      [Logo/Icon]        │                   │
│              │                         │                   │
│              │  ───────────────────    │                   │
│              │  Email                  │                   │
│              │  [                    ] │                   │
│              │                         │                   │
│              │  Password               │                   │
│              │  [                    ] │                   │
│              │                         │                   │
│              │  [    ログイン     ]    │                   │
│              │                         │                   │
│              │  ─────── or ──────      │                   │
│              │                         │                   │
│              │  [G] Googleでログイン   │                   │
│              │                         │                   │
│              └─────────────────────────┘                   │
│                                                             │
│                   © 2025 Creator Studio AI                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 機能要件

### 認証方法
1. **メール/パスワード認証**
   - メールアドレス入力
   - パスワード入力
   - バリデーション

2. **Google OAuth**
   - Googleアカウントでのシングルサインオン

### バリデーション
| フィールド | ルール |
|-----------|-------|
| Email | 必須、メール形式 |
| Password | 必須、8文字以上 |

### エラーハンドリング
| エラー | メッセージ |
|-------|----------|
| 認証失敗 | メールアドレスまたはパスワードが正しくありません |
| アカウントロック | アカウントがロックされています。管理者にお問い合わせください |
| サーバーエラー | システムエラーが発生しました。しばらくしてから再度お試しください |

## 状態管理

```typescript
interface LoginState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

## API連携

### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}
```

### GET /api/auth/google
OAuth認証フロー開始

## コンポーネント構成

```
LoginPage/
├── LoginForm/
│   ├── EmailInput
│   ├── PasswordInput
│   └── SubmitButton
├── GoogleLoginButton/
└── ErrorMessage/
```
