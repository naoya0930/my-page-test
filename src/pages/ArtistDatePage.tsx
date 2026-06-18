import { useEffect, useState } from 'react'

const ArtistDatePage = () => {
  const [wentOut, setWentOut] = useState(false)
  const [excited, setExcited] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await fetch('/api/artist-dates?week_number=current')
        if (!res.ok) throw new Error('データの取得に失敗しました。')
        const json = await res.json()
        setWentOut(Boolean(json.went_out))
        setExcited(Boolean(json.excited))
      } catch (e) {
        setError('今週の記録の取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [])

  const handleSave = async () => {
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/artist-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ went_out: wentOut, excited })
      })
      if (!res.ok) throw new Error('保存に失敗しました。')
      setSaved(true)
    } catch (e) {
      setError('保存に失敗しました。再度お試しください。')
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-semibold text-slate-900">アーティストデート</h2>
      {loading ? (
        <p className="mt-4 text-slate-600">読み込み中...</p>
      ) : (
        <div className="mt-6 space-y-5">
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {saved && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">保存しました。</p>}

          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={wentOut}
                onChange={(e) => setWentOut(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600"
              />
              <span>今週、アーティストデートに出かけた</span>
            </label>
            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={excited}
                onChange={(e) => setExcited(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600"
              />
              <span>今週、わくわくした出来事があった</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            保存
          </button>
        </div>
      )}
    </div>
  )
}

export default ArtistDatePage
