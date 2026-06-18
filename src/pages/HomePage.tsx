import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<{ week: number; morningDone: boolean; artistDone: boolean } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true)
        const data = await fetch('/api/progress')
        if (!data.ok) throw new Error('進捗の取得に失敗しました。')
        const json = await data.json()
        setProgress(json)
      } catch (e) {
        setError('進捗の取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-semibold text-slate-900">ホーム</h2>
      {loading ? (
        <p className="mt-4 text-slate-600">読み込み中...</p>
      ) : error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">現在の週次</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">第{progress?.week ?? 1}週目</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/morning-page"
              className="rounded-3xl border border-slate-200 bg-indigo-600 px-5 py-6 text-left text-white transition hover:bg-indigo-700"
            >
              <h3 className="mb-2 text-xl font-semibold">モーニングページ</h3>
              <p>{progress?.morningDone ? '今日の入力は保存済みです' : '今日の入力を記録しましょう'}</p>
            </Link>
            <Link
              to="/artist-date"
              className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-left text-slate-900 transition hover:bg-slate-100"
            >
              <h3 className="mb-2 text-xl font-semibold">アーティストデート</h3>
              <p>{progress?.artistDone ? '今週の記録は保存済みです' : '今週の記録を行いましょう'}</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
