import { useEffect, useState } from 'react'

const MorningPage = () => {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await fetch('/api/morning-pages?date=today')
        if (!res.ok) throw new Error('データの取得に失敗しました。')
        const json = await res.json()
        setContent(json.content || '')
      } catch (e) {
        setError('当日の保存データの取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    }

    fetchToday()
  }, [])

  const handleSave = async () => {
    if (!content.trim()) {
      setError('入力が空です。メッセージを入力してください。')
      return
    }

    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/morning-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('保存に失敗しました。')
      setSaved(true)
    } catch (e) {
      setError('保存に失敗しました。再度お試しください。')
    }
  }

  const charCount = content.length

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-semibold text-slate-900">モーニングページ</h2>
      {loading ? (
        <p className="mt-4 text-slate-600">読み込み中...</p>
      ) : (
        <div className="mt-6 space-y-5">
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {saved && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">保存しました。</p>}

          <textarea
            className="h-72 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今日の思いを自由に書いてください..."
          />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{charCount}文字</span>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MorningPage
