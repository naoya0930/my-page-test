import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-semibold text-slate-900">The Artist&apos;s Way Support</h2>
      <p className="mt-4 text-slate-600">
        12週間のモーニングページとアーティストデートを習慣化するサポートアプリです。
      </p>
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-xl font-semibold text-slate-900">主な機能</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
            <li>毎日のモーニングページ保存</li>
            <li>今週のアーティストデート記録</li>
            <li>ホームで週次進捗を確認</li>
          </ul>
        </div>
        <Link
          to="/login"
          className="inline-flex rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          ログインへ
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
