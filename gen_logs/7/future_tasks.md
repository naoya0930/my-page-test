# 将来のタスクとIssue切り出し

## 作成日時
2026年6月24日

## 目的
MVP完成後の拡張機能や改善点を、優先度別に整理し、GitHub Issueとして切り出せる形式にまとめる。

---

## タスク分類

### 🟢 Priority: High（必須改善）
すぐに対応すべき、または本番運用に影響する項目

### 🟡 Priority: Medium（推奨改善）
ユーザー体験向上のために早期実装が望ましい項目

### 🔵 Priority: Low（拡張機能）
将来的に実装したい機能、MVP後の追加価値

---

## 🟢 Priority: High - 必須改善

### なし

**現状:** MVPとして必要な機能はすべて実装済み。本番デプロイ可能な状態。

---

## 🟡 Priority: Medium - 推奨改善

### Issue #1: LPの通知機能説明文を強化

**カテゴリ:** UI/UX改善

**現状の問題:**
- LP（ランディングページ）に通知機能の簡易メンションのみ
- ユーザーに将来実装予定の機能が不明確

**期待される改善:**
```tsx
// LandingPage.tsx に追加
<section className="notification-feature">
  <h2>📬 リマインダー機能（近日公開予定）</h2>
  <ul>
    <li>毎朝のモーニングページ記入リマインダー</li>
    <li>週次のアーティストデート通知</li>
    <li>ブラウザ通知またはメール配信</li>
  </ul>
</section>
```

**工数見積もり:** 1時間

**担当者:** Frontend Developer

**関連ファイル:**
- `src/pages/LandingPage.tsx`

**受け入れ条件:**
- [ ] 通知機能の説明文を追加
- [ ] 「近日公開予定」と明示
- [ ] リマインダーの種類を箇条書きで表示

---

### Issue #2: モーニングページの文字数上限を設定

**カテゴリ:** 機能改善

**現状の問題:**
- 文字数制限なし
- D1の`TEXT`型は最大1GBだが、実用上問題の可能性

**期待される改善:**
1. 上限を10,000文字に設定
2. 上限に近づいたら警告表示（例: 9,500文字で黄色表示）
3. 上限に達したら保存時にエラーメッセージ

**実装例:**
```tsx
const MAX_CHARS = 10000;
const WARN_THRESHOLD = 9500;

const charCountColor = () => {
  if (charCount >= MAX_CHARS) return 'text-red-600';
  if (charCount >= WARN_THRESHOLD) return 'text-yellow-600';
  return 'text-gray-600';
};

const handleSave = () => {
  if (content.length > MAX_CHARS) {
    setError(`文字数が上限（${MAX_CHARS.toLocaleString()}文字）を超えています`);
    return;
  }
  // 保存処理
};
```

**工数見積もり:** 2時間

**担当者:** Frontend Developer

**関連ファイル:**
- `src/pages/MorningPage.tsx`

**受け入れ条件:**
- [ ] 文字数上限を10,000文字に設定
- [ ] 9,500文字以上で警告色表示
- [ ] 上限超過時に保存を防ぐ
- [ ] エラーメッセージ表示

---

### Issue #3: Rate Limiting実装（API保護）

**カテゴリ:** セキュリティ改善

**現状の問題:**
- API呼び出し頻度制限なし
- 悪意あるユーザーによる大量リクエストの可能性

**期待される改善:**
Cloudflare Workers の Rate Limiting機能を使用

**実装方針:**
1. Workers KVを使ってリクエスト数をカウント
2. IP単位またはユーザー単位で制限
3. 制限超過時は429エラーを返す

**実装例:**
```javascript
// workers/index.js
async function rateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate_limit:${ip}`;
  
  const count = await env.KV.get(key);
  const currentCount = count ? parseInt(count) : 0;
  
  if (currentCount > 100) { // 100回/分
    return new Response('Too Many Requests', { status: 429 });
  }
  
  await env.KV.put(key, (currentCount + 1).toString(), { expirationTtl: 60 });
  return null; // 制限内
}
```

**工数見積もり:** 4時間

**担当者:** Backend Developer

**関連ファイル:**
- `workers/index.js`
- `wrangler.toml` (KV設定)

**受け入れ条件:**
- [ ] Workers KV設定
- [ ] Rate Limitロジック実装
- [ ] 429エラーレスポンス
- [ ] フロントエンドで429エラー処理

---

## 🔵 Priority: Low - 拡張機能

### Issue #4: 通知機能の実装

**カテゴリ:** 新機能

**概要:**
ユーザーにリマインダーを送信する機能

**実装方針:**

#### 方式1: Webプッシュ通知（推奨）

**必要な実装:**
1. Service Worker登録
2. Push APIによる通知許可リクエスト
3. Cloudflare Workers Cron でスケジュール実行
4. Durable Objectsでサブスクリプション管理

**手順:**
```javascript
// 1. Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// 2. 通知許可
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // プッシュ通知サブスクリプション
  }
});

// 3. Workers Cron設定
// wrangler.toml
[triggers]
crons = ["0 8 * * *"] // 毎朝8時
```

#### 方式2: メール通知（代替案）

**必要な実装:**
1. Cloudflare Email Workers設定
2. SendGrid または Mailgun統合
3. 週次レポートメール生成

**工数見積もり:** 2-3週間

**担当者:** Full-stack Developer

**関連技術:**
- Service Worker
- Push API
- Cloudflare Workers Cron
- Cloudflare Durable Objects

**受け入れ条件:**
- [ ] 通知許可のUI実装
- [ ] モーニングページリマインダー（毎朝8時）
- [ ] アーティストデートリマインダー（週末）
- [ ] 通知設定画面（オン/オフ切り替え）
- [ ] ユーザーごとの通知設定保存

**参考リンク:**
- https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
- https://developers.google.com/web/fundamentals/push-notifications

---

### Issue #5: モーニングページの過去履歴閲覧

**カテゴリ:** 新機能

**概要:**
過去のモーニングページをカレンダー形式で閲覧・検索

**実装方針:**

#### フロントエンド
1. カレンダーコンポーネント（react-calendar）
2. 日付選択UI
3. モーダルで過去データ表示
4. キーワード検索機能（オプション）

#### バックエンド
1. `GET /api/morning-pages/history?from=2024-01-01&to=2024-12-31`
2. 範囲指定クエリ
3. ページネーション（必要に応じて）

**実装例:**
```typescript
// フロントエンド
const HistoryPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<MorningPageEntry[]>([]);
  
  const fetchHistory = async (from: string, to: string) => {
    const response = await fetch(`/api/morning-pages/history?from=${from}&to=${to}`);
    setEntries(await response.json());
  };
  
  return (
    <div>
      <Calendar onChange={setSelectedDate} />
      <EntryList entries={entries} />
    </div>
  );
};

// バックエンド
router.get('/api/morning-pages/history', async (request, env) => {
  const { from, to } = request.query;
  const results = await env.DB.prepare(
    'SELECT * FROM MorningPages WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date DESC'
  ).bind(userId, from, to).all();
  
  return Response.json(results);
});
```

**工数見積もり:** 1週間

**担当者:** Full-stack Developer

**関連ファイル:**
- `src/pages/HistoryPage.tsx`（新規）
- `src/components/Calendar.tsx`（新規）
- `workers/index.js`（エンドポイント追加）

**受け入れ条件:**
- [ ] カレンダーUI実装
- [ ] 過去データ取得API実装
- [ ] 日付選択で該当データ表示
- [ ] 読み取り専用モード（編集不可）
- [ ] ページネーション（100件以上の場合）

**依存ライブラリ:**
- `react-calendar`: カレンダーUI
- または独自実装

---

### Issue #6: アーティストデートメモ機能

**カテゴリ:** 機能拡張

**概要:**
チェックボックスに加えて、具体的な活動内容をメモできる機能

**実装方針:**

#### データベース変更
```sql
-- マイグレーション
ALTER TABLE ArtistDates ADD COLUMN memo TEXT;
```

#### フロントエンド
```tsx
<textarea
  value={memo}
  onChange={(e) => setMemo(e.target.value)}
  placeholder="今週のアーティストデートの内容を記録..."
  className="w-full h-32 p-3 border rounded"
/>
```

#### バックエンド
```javascript
// POST /api/artist-dates
const { went_out, excited, memo } = await request.json();
await env.DB.prepare(
  'INSERT INTO ArtistDates (user_id, week_number, went_out, excited, memo, ...) VALUES (?, ?, ?, ?, ?, ...)'
).bind(userId, weekNumber, went_out, excited, memo || '').run();
```

**工数見積もり:** 3日

**担当者:** Full-stack Developer

**関連ファイル:**
- `migrations/002_add_artist_date_memo.sql`（新規）
- `src/pages/ArtistDatePage.tsx`
- `workers/index.js`

**受け入れ条件:**
- [ ] データベースマイグレーション
- [ ] メモ入力フィールド追加
- [ ] API更新（memo保存・取得）
- [ ] 既存データとの互換性維持
- [ ] メモの文字数制限（例: 1,000文字）

---

### Issue #7: 週次達成率ダッシュボード

**カテゴリ:** 新機能

**概要:**
過去12週間の達成率をグラフで可視化

**実装方針:**

#### UI設計
1. 折れ線グラフ: 週ごとのモーニングページ完了率
2. 棒グラフ: アーティストデート実施状況
3. 統計サマリー:
   - 総合達成率
   - 連続達成日数
   - 最も生産的な週

#### データ取得
```javascript
// GET /api/progress/history
router.get('/api/progress/history', async (request, env) => {
  const results = await env.DB.prepare(`
    SELECT 
      week_number,
      COUNT(DISTINCT entry_date) as morning_pages_count,
      MAX(ad.went_out) as artist_date_done
    FROM MorningPages mp
    LEFT JOIN ArtistDates ad ON mp.user_id = ad.user_id AND mp.week_number = ad.week_number
    WHERE mp.user_id = ?
    GROUP BY week_number
    ORDER BY week_number ASC
    LIMIT 12
  `).bind(userId).all();
  
  return Response.json(results);
});
```

#### グラフライブラリ
- **Chart.js**: 軽量、簡単
- **Recharts**: React専用、カスタマイズ性高い

**実装例:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/progress/history')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="week_number" />
      <YAxis />
      <CartesianGrid stroke="#eee" />
      <Line type="monotone" dataKey="morning_pages_count" stroke="#8884d8" />
    </LineChart>
  );
};
```

**工数見積もり:** 1週間

**担当者:** Frontend Developer + Backend Developer

**関連ファイル:**
- `src/pages/DashboardPage.tsx`（新規）
- `workers/index.js`（エンドポイント追加）

**受け入れ条件:**
- [ ] 過去12週間のデータ取得API
- [ ] 折れ線グラフ実装
- [ ] 棒グラフ実装
- [ ] 統計サマリー表示
- [ ] レスポンシブデザイン

**依存ライブラリ:**
- `recharts` または `chart.js`

---

### Issue #8: 12週間完了時のサマリー表示

**カテゴリ:** 新機能

**概要:**
12週間プログラムを完了したユーザーに祝福メッセージと統計サマリーを表示

**実装方針:**

#### 完了検知ロジック
```javascript
// workers/index.js
async function check12WeekCompletion(env, userId) {
  const result = await env.DB.prepare(`
    SELECT COUNT(DISTINCT week_number) as completed_weeks
    FROM Progress
    WHERE user_id = ? AND morning_page_done = 1 AND artist_date_done = 1
  `).bind(userId).first();
  
  return result.completed_weeks >= 12;
}
```

#### サマリー内容
1. **お祝いメッセージ**
   - "🎉 おめでとうございます！12週間プログラム完了！"
   
2. **統計情報**
   - 総モーニングページ数
   - 総文字数
   - アーティストデート実施回数
   - 最長連続記録日数
   
3. **振り返り**
   - 週ごとの達成率グラフ
   - 印象的なモーニングページ（文字数トップ3）

#### PDF出力（オプション）
- jsPDFライブラリ
- サマリーをPDF化してダウンロード

**実装例:**
```tsx
const CompletionPage: React.FC = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('/api/completion-summary')
      .then(res => res.json())
      .then(setStats);
  }, []);
  
  return (
    <div className="completion-celebration">
      <h1>🎉 12週間プログラム完了おめでとうございます！</h1>
      <div className="stats">
        <p>総モーニングページ: {stats.totalPages}ページ</p>
        <p>総文字数: {stats.totalChars.toLocaleString()}文字</p>
        <p>アーティストデート: {stats.artistDates}回</p>
      </div>
      <button onClick={downloadPDF}>PDFダウンロード</button>
    </div>
  );
};
```

**工数見積もり:** 3日

**担当者:** Full-stack Developer

**関連ファイル:**
- `src/pages/CompletionPage.tsx`（新規）
- `workers/index.js`（エンドポイント追加）

**受け入れ条件:**
- [ ] 12週間完了検知ロジック
- [ ] 統計サマリーAPI実装
- [ ] お祝いページUI実装
- [ ] PDF出力機能（オプション）
- [ ] ホーム画面に完了バッジ表示

---

## 技術的改善項目

### Issue #9: エラートラッキング（Sentry統合）

**カテゴリ:** 監視・運用

**概要:**
本番環境でのエラーを自動追跡・通知

**実装方針:**
1. Sentry アカウント作成
2. フロントエンドにSentry SDK統合
3. Workers にもSentry統合（オプション）
4. エラー発生時の自動通知

**実装例:**
```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**工数見積もり:** 2時間

**担当者:** DevOps / Full-stack Developer

**受け入れ条件:**
- [ ] Sentryアカウント作成
- [ ] フロントエンドSDK統合
- [ ] エラー発生時の通知設定
- [ ] パフォーマンス監視設定

---

### Issue #10: CI/CDパイプライン構築

**カテゴリ:** DevOps

**概要:**
GitHub Actionsで自動テスト・デプロイを構築

**実装方針:**

#### Workflow設計
1. **Pull Request時:**
   - Lint実行
   - 型チェック
   - ビルド確認
   
2. **mainブランチマージ時:**
   - Workersデプロイ
   - Pagesデプロイ
   - 統合テスト実行

**実装例:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  
  deploy-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx wrangler pages deploy dist
```

**工数見積もり:** 1日

**担当者:** DevOps / Backend Developer

**受け入れ条件:**
- [ ] GitHub Actions設定
- [ ] Lint/型チェック自動化
- [ ] 自動デプロイ設定
- [ ] デプロイ成功/失敗通知

---

## まとめ

### タスク優先度マトリックス

| Issue | 優先度 | 工数 | 影響度 | 推奨実装時期 |
|-------|-------|------|--------|------------|
| #1 LP説明文強化 | 🟡 Medium | 1h | 低 | Phase 3 |
| #2 文字数上限 | 🟡 Medium | 2h | 中 | Phase 3 |
| #3 Rate Limiting | 🟡 Medium | 4h | 高 | Phase 3 |
| #4 通知機能 | 🔵 Low | 2-3w | 高 | Phase 4 |
| #5 過去履歴閲覧 | 🔵 Low | 1w | 中 | Phase 4 |
| #6 メモ機能 | 🔵 Low | 3d | 低 | Phase 4 |
| #7 ダッシュボード | 🔵 Low | 1w | 中 | Phase 4 |
| #8 完了サマリー | 🔵 Low | 3d | 低 | Phase 4 |
| #9 Sentry統合 | 🟡 Medium | 2h | 中 | Phase 3 |
| #10 CI/CD構築 | 🟡 Medium | 1d | 高 | Phase 3 |

### 推奨実装順序

**Phase 2: 本番デプロイ（現在）**
- Cloudflare Workersデプロイ
- Cloudflare Pagesデプロイ
- 本番環境動作確認

**Phase 3: マイナー改善（デプロイ後1-2週間）**
1. Issue #3: Rate Limiting
2. Issue #9: Sentry統合
3. Issue #10: CI/CD構築
4. Issue #2: 文字数上限
5. Issue #1: LP説明文強化

**Phase 4: 拡張機能（運用安定後）**
1. Issue #4: 通知機能（最優先拡張）
2. Issue #7: ダッシュボード
3. Issue #5: 過去履歴閲覧
4. Issue #6: メモ機能
5. Issue #8: 完了サマリー

---

## GitHub Issue テンプレート

各Issueを作成する際のテンプレート：

```markdown
## 概要
[機能の概要を記載]

## 目的
[なぜこの機能が必要か]

## 実装方針
[技術的なアプローチ]

## 受け入れ条件
- [ ] 条件1
- [ ] 条件2
- [ ] 条件3

## 工数見積もり
[所要時間]

## 優先度
🟢 High / 🟡 Medium / 🔵 Low

## 関連ファイル
- ファイル1
- ファイル2

## 参考リンク
[関連ドキュメントやライブラリ]
```

---

**作成者:** AI Assistant  
**レビュー:** 開発チーム  
**更新日:** 2026年6月24日
