import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { progressApi, Progress } from '../api/client'
import { useAuth } from '../auth/AuthProvider'

const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await progressApi.get()
        if (response.ok && response.data) {
          setProgress(response.data)
        } else {
          setError(response.message || '進捗の取得に失敗しました。')
        }
      } catch (e) {
        setError('進捗の取得に失敗しました。ログインしているか確認してください。')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">ホーム</h2>
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          再読み込み
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with user info */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">ホーム</h2>
          <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ログアウト
        </button>
      </div>

      {/* Current Week Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-sm">
        <p className="text-sm font-medium opacity-90">The Artist's Way プログラム</p>
        <p className="mt-3 text-5xl font-bold">第{progress?.current_week ?? 1}週目</p>
        <p className="mt-2 text-sm opacity-80">全12週間のうち {progress?.current_week ?? 1} 週目を実施中</p>
      </div>

      {/* Progress Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">モーニングページ</h3>
            {progress?.morning_page_done ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">完了</span>
            ) : (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">未完了</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            今週: {progress?.morning_pages_this_week ?? 0} / 7 ページ
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(((progress?.morning_pages_this_week ?? 0) / 7) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">アーティストデート</h3>
            {progress?.artist_date_done ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">完了</span>
            ) : (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">未完了</span>
            )}
          </div>
          {progress?.artist_date_details ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>✓ 外出: {progress.artist_date_details.went_out ? 'はい' : 'いいえ'}</p>
              <p>✓ わくわく: {progress.artist_date_details.excited ? 'はい' : 'いいえ'}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">今週の記録はまだありません</p>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/morning-page"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">モーニングページ</h3>
            <svg className="h-6 w-6 text-slate-400 transition group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {progress?.morning_page_done
              ? '今週は7ページ達成しました！'
              : '今日の思考を記録しましょう'}
          </p>
        </Link>

        <Link
          to="/artist-date"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">アーティストデート</h3>
            <svg className="h-6 w-6 text-slate-400 transition group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {progress?.artist_date_done
              ? '今週の記録は完了しています'
              : '今週のクリエイティブな時間を記録'}
          </p>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
