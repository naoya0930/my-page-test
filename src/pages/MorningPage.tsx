import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { morningPagesApi } from '../api/client'

const todayStr = () => new Date().toISOString().split('T')[0]

// Build a human-readable title for the target date.
const formatTitle = (date: string): string => {
  if (date === todayStr()) return '今日のモーニングページ'
  const [y, m, d] = date.split('-').map(Number)
  return `${y}年${m}月${d}日の記録`
}

const MorningPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Target date from the ?date= query (set when editing a specific day from the
  // home grid). Falls back to today for a malformed or missing value.
  const dateParam = searchParams.get('date') || ''
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr()

  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await morningPagesApi.get(targetDate)

        if (response.ok && response.data) {
          setContent(response.data.content || '')
        } else {
          setContent('')
        }
      } catch (e) {
        setError('保存データの取得に失敗しました。ログインしているか確認してください。')
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [targetDate])

  const handleSave = async () => {
    // Validation: Check if content is empty
    if (!content.trim()) {
      setError('入力が空です。メッセージを入力してください。')
      return
    }

    setError('')
    setSaving(true)

    try {
      const response = await morningPagesApi.create(content, targetDate)

      if (response.ok) {
        // On a successful write, leave the screen and return to the home page.
        // Pass a toast message via navigation state so /home can show a
        // transient "saved" confirmation after the redirect.
        navigate('/home', { state: { toast: 'モーニングページを保存しました' } })
      } else {
        setError(response.message || '保存に失敗しました。再度お試しください。')
        setSaving(false)
      }
    } catch (e) {
      setError('保存に失敗しました。再度お試しください。')
      setSaving(false)
    }
  }

  const charCount = content.length

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">{formatTitle(targetDate)}</h2>
          <p className="mt-2 text-sm text-slate-600">その日の思いを自由に書いてください</p>
        </div>
        <Link
          to="/home"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← ホームに戻る
        </Link>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Text Area */}
          <div>
            <textarea
              className="h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例：今日は早起きできた。朝の空気が気持ちいい。最近考えていることは..."
              disabled={saving}
            />
          </div>

          {/* Footer: Character Count & Save Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{charCount.toLocaleString()}</span> 文字
              {charCount > 0 && (
                <span className="ml-2 text-slate-400">
                  （目安: 750文字以上）
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  保存中...
                </>
              ) : (
                '保存する'
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="rounded-2xl bg-indigo-50 p-4">
            <h3 className="text-sm font-semibold text-indigo-900">💡 モーニングページのコツ</h3>
            <ul className="mt-2 space-y-1 text-sm text-indigo-800">
              <li>• 毎朝、起きてすぐに書くのが効果的です</li>
              <li>• 思いつくままに、何でも書いてOK</li>
              <li>• 完璧な文章である必要はありません</li>
              <li>• A4サイズ3ページ分（約750文字）が目安です</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MorningPage
