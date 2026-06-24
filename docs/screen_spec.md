# 画面仕様書 - The Artist's Way Support

> 現在の実装コード（`src/pages/`, `src/components/`）から生成

---

## 目次

- [画面仕様書 - The Artist's Way Support](#画面仕様書---the-artists-way-support)
  - [目次](#目次)
  - [1. 共通レイアウト (Layout)](#1-共通レイアウト-layout)
    - [構造](#構造)
    - [スタイル仕様](#スタイル仕様)
  - [2. ランディングページ (/)](#2-ランディングページ-)
    - [レイアウト](#レイアウト)
    - [要素仕様](#要素仕様)
  - [3. ログインページ (/login)](#3-ログインページ-login)
    - [レイアウト](#レイアウト-1)
    - [要素仕様](#要素仕様-1)
    - [状態](#状態)
  - [4. ホームページ (/home)](#4-ホームページ-home)
    - [レイアウト](#レイアウト-2)
    - [要素仕様](#要素仕様-2)
    - [状態](#状態-1)
  - [5. モーニングページ (/morning-page)](#5-モーニングページ-morning-page)
    - [レイアウト](#レイアウト-3)
    - [要素仕様](#要素仕様-3)
    - [状態](#状態-2)
  - [6. アーティストデートページ (/artist-date)](#6-アーティストデートページ-artist-date)
    - [レイアウト](#レイアウト-4)
    - [要素仕様](#要素仕様-4)
    - [状態](#状態-3)
  - [7. ルーティング \& 認証フロー](#7-ルーティング--認証フロー)
    - [ルート一覧](#ルート一覧)
    - [認証フロー](#認証フロー)
    - [認証プロバイダー](#認証プロバイダー)
  - [共通デザイントークン](#共通デザイントークン)

---

## 1. 共通レイアウト (Layout)

**ファイル**: `src/components/Layout.tsx`

全ページで共通して使われる外枠コンポーネント。

### 構造

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│  [The Artist's Way Support] (indigo)    │
│  日々のモーニングページと週次アーティスト  │
│  デート                                 │
├─────────────────────────────────────────┤
│ MAIN (各ページのコンテンツ)              │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ FOOTER                                  │
│ 開発中のローカル環境です。...             │
└─────────────────────────────────────────┘
```

### スタイル仕様

| 要素 | クラス / 仕様 |
|------|------------|
| 背景 | `bg-slate-50` |
| 最大幅 | `max-w-5xl`、中央揃え |
| パディング | `px-4 py-8` (sm: `px-6`, lg: `px-8`) |
| ヘッダー | `rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm` |
| ヘッダーサブタイトル | `text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600` |
| ヘッダータイトル | `text-3xl font-semibold text-slate-900` |
| フッター | `rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm` |

---

## 2. ランディングページ (/)

**ファイル**: `src/pages/LandingPage.tsx`  
**認証**: 不要（公開）

### レイアウト

```
┌─────────────────────────────────────┐
│ The Artist's Way Support            │
│                                     │
│ 12週間のモーニングページとアーティスト  │
│ デートを習慣化するサポートアプリです。  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 主な機能                         │ │
│ │ • 毎日のモーニングページ保存       │ │
│ │ • 今週のアーティストデート記録     │ │
│ │ • ホームで週次進捗を確認           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ログインへ →]                       │
└─────────────────────────────────────┘
```

### 要素仕様

| 要素 | 仕様 |
|------|------|
| カード | `rounded-3xl border border-slate-200 bg-white p-8 shadow-sm` |
| タイトル | `text-3xl font-semibold text-slate-900` |
| 説明文 | `mt-4 text-slate-600` |
| 機能リストカード | `rounded-2xl bg-slate-50 p-5` |
| ログインボタン | `rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white` / hover: `bg-indigo-700` |

---

## 3. ログインページ (/login)

**ファイル**: `src/pages/LoginPage.tsx`  
**認証**: 不要（認証済みなら `/home` へリダイレクト）

### レイアウト

```
┌───────────────────────────────────┐
│ ログイン                           │
│ サービスを利用するにはログインが必要  │
│                                   │
│ [エラーメッセージ] (条件表示)        │
│                                   │
│ メールアドレス                      │
│ ┌─────────────────────────────┐   │
│ │ your@email.com              │   │
│ └─────────────────────────────┘   │
│                                   │
│ パスワード                          │
│ ┌─────────────────────────────┐   │
│ │ ••••••••                    │   │
│ └─────────────────────────────┘   │
│                                   │
│ [メールアドレスでログイン]           │
│                                   │
│ ──────── または ────────           │
│                                   │
│ [G Googleでログイン]               │
└───────────────────────────────────┘
```

### 要素仕様

| 要素 | 仕様 |
|------|------|
| カード | `rounded-3xl border border-slate-200 bg-white p-8 shadow-sm max-w-md mx-auto` |
| タイトル | `text-3xl font-semibold text-slate-900` |
| エラーメッセージ | `rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700` |
| input | `w-full rounded-lg border border-slate-300 px-4 py-2` / focus: `border-indigo-500 ring-2 ring-indigo-500` |
| メールログインボタン | `w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white` |
| Googleログインボタン | `w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700` / Googleカラーのロゴ付き |
| ローディング時 | ボタンテキストが「ログイン中...」に変わり、`disabled` + `opacity-60` |

### 状態

| 状態 | 挙動 |
|------|------|
| 初期表示 | 認証済みなら自動で `/home` へリダイレクト |
| ローディング中 | 両ボタンが `disabled`、テキスト「ログイン中...」 |
| エラー | 赤いエラーバナーを表示 |
| ログイン成功 | `/home` へナビゲート |

---

## 4. ホームページ (/home)

**ファイル**: `src/pages/HomePage.tsx`  
**認証**: 必要（未認証なら `/login` へリダイレクト）  
**API**: `GET /progress`

### レイアウト

```
┌────────────────────────────────────────┐
│ ホーム                  [ログアウト]    │
│ user@example.com                       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ The Artist's Way プログラム            │
│                                        │
│ 第N週目                                │
│ (indigo→purple グラデーション)          │
│ 全12週間のうち N 週目を実施中           │
└────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ モーニングページ  │ │ アーティストデート │
│         [完了/   │ │           [完了/  │
│          未完了] │ │            未完了]│
│ 今週: N / 7      │ │ ✓ 外出: はい/いいえ│
│ [========  ]     │ │ ✓ わくわく: はい/ │
│                  │ │   いいえ         │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ モーニングページ→ │ │ アーティストデート→│
│ 今日の思考を記録  │ │ 今週のクリエイティ │
│                  │ │ ブな時間を記録    │
└──────────────────┘ └──────────────────┘
```

### 要素仕様

| 要素 | 仕様 |
|------|------|
| ヘッダーカード | `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` |
| ログアウトボタン | `rounded-full border border-slate-300 bg-white px-4 py-2 text-sm` |
| 週次カード | `rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-sm` |
| 週番号 | `text-5xl font-bold` |
| 進捗カード | `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` / 2カラム grid |
| 完了バッジ | `rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700` |
| 未完了バッジ | `rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700` |
| プログレスバー | `h-2 rounded-full bg-slate-100` / 塗り `bg-indigo-600` / 幅は `(pages/7)*100%` |
| アクションカード | `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` / hover: `border-indigo-300 shadow-md` |
| 矢印アイコン | `h-6 w-6 text-slate-400` / hover: `text-indigo-600` |

### 状態

| 状態 | 挙動 |
|------|------|
| ローディング | スピナー + 「読み込み中...」 |
| エラー | 赤いエラーバナー + 「再読み込み」ボタン |
| morning_page_done = true | 完了バッジ、アクションカードに「今週は7ページ達成！」 |
| artist_date_done = true | 完了バッジ、外出・わくわくの状態を表示 |

---

## 5. モーニングページ (/morning-page)

**ファイル**: `src/pages/MorningPage.tsx`  
**認証**: 必要  
**API**: `GET /morning-pages/:date`, `POST /morning-pages`

### レイアウト

```
モーニングページ          [← ホームに戻る]
今日の思いを自由に書いてください

┌──────────────────────────────────────┐
│                                      │
│ [エラーメッセージ] (条件表示)          │
│ [成功メッセージ] (条件表示)            │
│                                      │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │  (テキストエリア h-96)          │   │
│ │  例：今日は早起きできた...       │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                      │
│ N 文字（目安: 750文字以上）   [保存]   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ 💡 モーニングページのコツ        │   │
│ │ • 毎朝、起きてすぐに書くのが効果的 │  │
│ │ • 思いつくままに、何でも書いてOK  │  │
│ │ • 完璧な文章である必要はありません │  │
│ │ • A4サイズ3ページ分（約750文字）  │  │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 要素仕様

| 要素 | 仕様 |
|------|------|
| ヘッダー | 見出し + 戻るボタン（横並び） |
| 戻るボタン | `rounded-full border border-slate-300 bg-white px-4 py-2 text-sm` |
| メインカード | `rounded-3xl border border-slate-200 bg-white p-8 shadow-sm` |
| エラー | `rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700` |
| 成功 | `rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700` / 3秒後に自動消去 |
| テキストエリア | `h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4` / focus: `border-indigo-500 bg-white ring-2 ring-indigo-100` |
| 文字数 | `text-sm text-slate-500` / 数字は `font-medium text-slate-700` / 750字超なら目安テキスト表示 |
| 保存ボタン | `rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white` / 空文字 or 保存中は `disabled + opacity-50` |
| 保存中ボタン | スピナー + 「保存中...」 |
| ヒントカード | `rounded-2xl bg-indigo-50 p-4` |

### 状態

| 状態 | 挙動 |
|------|------|
| 初期ロード | 当日の日付 (`YYYY-MM-DD`) で既存データを取得、あればテキストエリアに表示 |
| ローディング | スピナー + 「読み込み中...」 |
| 保存成功 | 成功バナー表示（3秒後に自動消去） |
| エラー | エラーバナー表示 |
| 空文字 | 保存ボタン `disabled` |

---

## 6. アーティストデートページ (/artist-date)

**ファイル**: `src/pages/ArtistDatePage.tsx`  
**認証**: 必要  
**API**: `GET /progress`, `GET /artist-dates/:week`, `POST /artist-dates`

### レイアウト

```
アーティストデート        [← ホームに戻る]
第N週目のアーティストデート記録

┌────────────────────────────────────────┐
│                                        │
│ [エラーメッセージ] (条件表示)            │
│ [成功メッセージ] (条件表示)              │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ☐ 今週、アーティストデートに出かけた│   │
│ │   一人で美術館、カフェ、散歩など...  │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ☐ 今週、わくわくした出来事があった  │   │
│ │   新しい発見や、心が躍るような...   │   │
│ └──────────────────────────────────┘   │
│                                        │
│                              [保存]    │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 💡 どちらも未選択でも保存できます。 │   │
│ │   正直に記録することが大切です。    │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 💡 アーティストデートとは          │   │
│ │ • 週に一度、自分一人のために...    │   │
│ │ • 美術館、映画、散歩、カフェなど... │   │
│ │ • 完璧である必要はありません。      │   │
│ │ • 自分の内なるアーティストを...    │   │
│ └──────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

### 要素仕様

| 要素 | 仕様 |
|------|------|
| ヘッダー | 見出し（現在週番号を動的表示）+ 戻るボタン |
| メインカード | `rounded-3xl border border-slate-200 bg-white p-8 shadow-sm` |
| チェックボックスラベル | `flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5` / hover: `border-indigo-300 bg-indigo-50/50` |
| チェックボックス | `h-5 w-5 rounded border-slate-300 text-indigo-600` / focus: `ring-2 ring-indigo-500` |
| 保存ボタン | `rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white` / 右寄せ |
| 注意カード | `rounded-2xl bg-amber-50 p-4 text-sm text-amber-900` |
| ヒントカード | `rounded-2xl bg-indigo-50 p-4` |

### 状態

| 状態 | 挙動 |
|------|------|
| 初期ロード | `GET /progress` で現在週を取得 → `GET /artist-dates/:week` で既存データを取得し各チェックボックスに反映 |
| ローディング | スピナー + 「読み込み中...」 |
| 保存成功 | 成功バナー（3秒後に自動消去） |
| エラー | エラーバナー表示 |
| 保存中 | スピナー + 「保存中...」、チェックボックスも `disabled` |
| どちらも未選択 | 保存可能（バリデーションなし） |

---

## 7. ルーティング & 認証フロー

**ファイル**: `src/App.tsx`, `src/auth/AuthProvider.tsx`

### ルート一覧

| パス | ページ | 認証 |
|------|--------|------|
| `/` | LandingPage | 不要 |
| `/login` | LoginPage | 不要（認証済みなら `/home` へ） |
| `/home` | HomePage | **必要** |
| `/morning-page` | MorningPage | **必要** |
| `/artist-date` | ArtistDatePage | **必要** |

### 認証フロー

```
未認証ユーザー
    ↓ 保護ルート(/home 等)へアクセス
    → /login へリダイレクト (ProtectedRoute)

ログイン成功
    ↓ メール認証 or Google OAuth
    → /home へリダイレクト

認証済みユーザー
    ↓ /login へアクセス
    → /home へリダイレクト (LoginPage の useEffect)

ログアウト
    ↓ HomePage のログアウトボタン
    → /login へリダイレクト
```

### 認証プロバイダー

- **Supabase** を使用 (`src/auth/supabaseClient.ts`)
- `useAuth()` フックで `user`, `isAuthenticated`, `signInWithEmail`, `signInWithGoogle`, `signOut` を提供
- JWT は Cloudflare Workers (`workers/index.js`) で検証

---

## 共通デザイントークン

| トークン | 値 |
|---------|-----|
| プライマリカラー | `indigo-600` (#4F46E5) |
| ホバー | `indigo-700` |
| 背景 | `slate-50` |
| カード背景 | `white` |
| カード角丸 | `rounded-3xl` |
| カードボーダー | `border border-slate-200` |
| カードシャドウ | `shadow-sm` |
| テキスト（メイン） | `slate-900` |
| テキスト（サブ） | `slate-600` |
| テキスト（補足） | `slate-500` |
| エラー背景 | `red-50` / テキスト `red-700` |
| 成功背景 | `emerald-50` / テキスト `emerald-700` |
| ヒント背景 | `indigo-50` / テキスト `indigo-800` |
| 注意背景 | `amber-50` / テキスト `amber-900` |
| ボタン角丸 | `rounded-full` |
