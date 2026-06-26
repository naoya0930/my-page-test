import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-12 text-white shadow-lg">
        <h1 className="text-5xl font-bold">The Artist&apos;s Way Support</h1>
        <p className="mt-4 text-xl opacity-90">
          12週間のモーニングページとアーティストデートを習慣化するサポートアプリ
        </p>
        <p className="mt-3 text-lg opacity-80">
          Julia Cameronの「ずっとやりたかったことを、やりなさい。」を実践するあなたを応援します
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-full bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg transition hover:bg-slate-50"
        >
          今すぐ始める →
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">モーニングページ</h3>
          <p className="mt-2 text-sm text-slate-600">
            毎朝の思考を自由に書き留める習慣をサポート。文字数カウントで進捗を可視化します。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">アーティストデート</h3>
          <p className="mt-2 text-sm text-slate-600">
            週に一度、自分のための特別な時間を記録。創造性を育む習慣を定着させます。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">週次進捗管理</h3>
          <p className="mt-2 text-sm text-slate-600">
            7日間の実施状況をドットグリッドで確認。達成感を視覚的に体験できます。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">週次タイムトラベル</h3>
          <p className="mt-2 text-sm text-slate-600">
            過去の週を振り返り、未来の週を見据える。12週間の旅を自由に行き来できます。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">統計ダッシュボード</h3>
          <p className="mt-2 text-sm text-slate-600">
            12週間の軌跡を可視化。文字数推移、ヒートマップ、達成状況を一目で把握。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">通知機能（準備中）</h3>
          <p className="mt-2 text-sm text-slate-600">
            毎朝のリマインダーで習慣化をサポート。継続のモチベーションを保ちます。
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">使い方</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
              1
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">アカウント作成</h3>
            <p className="mt-2 text-sm text-slate-600">
              メールアドレスまたはGoogleアカウントでログイン
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              2
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">毎日記録</h3>
            <p className="mt-2 text-sm text-slate-600">
              モーニングページを書き、アーティストデートを実践
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-600">
              3
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">成長を実感</h3>
            <p className="mt-2 text-sm text-slate-600">
              統計画面で12週間の変化を振り返る
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          今日から始める、あなたの創造性の旅
        </h2>
        <p className="mt-3 text-slate-600">
          12週間で人生が変わる。The Artist&apos;s Way を一緒に実践しましょう。
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-700"
        >
          無料で始める
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
