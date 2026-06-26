import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { artistDatesApi, progressApi } from '../api/client'

const ArtistDatePage = () => {
  const navigate = useNavigate()
  const [wentOut, setWentOut] = useState(false)
  const [excited, setExcited] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Get current week number from progress API
        const progressResponse = await progressApi.get()
        if (progressResponse.ok && progressResponse.data) {
          const weekNum = progressResponse.data.current_week
          setCurrentWeek(weekNum)

          // Fetch existing artist date data for current week
          const artistDateResponse = await artistDatesApi.get(weekNum)
          if (artistDateResponse.ok && artistDateResponse.data) {
            setWentOut(Boolean(artistDateResponse.data.went_out))
            setExcited(Boolean(artistDateResponse.data.excited))
          }
        }
      } catch (e) {
        setError('今週の記録の取得に失敗しました。ログインしているか確認してください。')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    if (!currentWeek) {
      setError('週次情報の取得に失敗しました。ページを再読み込みしてください。')
      return
    }

    setError('')
    setSaved(false)
    setSaving(true)

    try {
      const response = await artistDatesApi.create(currentWeek, wentOut, excited)

      if (response.ok) {
        setSaved(true)
        // Auto-redirect to home after successful save
        setTimeout(() => {
          navigate('/home')
        }, 1000) // Brief delay to show success message
      } else {
        setError(response.message || '保存に失敗しました。再度お試しください。')
      }
    } catch (e) {
      setError('保存に失敗しました。再度お試しください。')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">アーティストデート</h2>
          <p className="mt-2 text-sm text-slate-600">
            {currentWeek ? `第${currentWeek}週目のアーティストデート記録` : '今週のアーティストデート記録'}
          </p>
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
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success Message */}
          {saved && (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✓ 保存しました。
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-indigo-50/50">
              <input
                type="checkbox"
                checked={wentOut}
                onChange={(e) => setWentOut(e.target.checked)}
                disabled={saving}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex-1">
                <span className="block text-base font-medium text-slate-900">
                  今週、アーティストデートに出かけた
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  一人で美術館、カフェ、散歩など、創造性を刺激する活動をしましたか？
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-indigo-50/50">
              <input
                type="checkbox"
                checked={excited}
                onChange={(e) => setExcited(e.target.checked)}
                disabled={saving}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex-1">
                <span className="block text-base font-medium text-slate-900">
                  今週、わくわくした出来事があった
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  新しい発見や、心が躍るような体験がありましたか？
                </span>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </button>
          </div>

          {/* Info Note */}
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              💡 どちらも未選択でも保存できます。正直に記録することが大切です。
            </p>
          </div>

          {/* Tips */}
          <div className="rounded-2xl bg-indigo-50 p-4">
            <h3 className="text-sm font-semibold text-indigo-900">💡 アーティストデートとは</h3>
            <ul className="mt-2 space-y-1 text-sm text-indigo-800">
              <li>• 週に一度、自分一人のために時間を作る特別な時間です</li>
              <li>• 美術館、映画、散歩、カフェなど、創造性を刺激する活動を選びます</li>
              <li>• 完璧である必要はありません。小さな外出でもOK</li>
              <li>• 自分の内なるアーティストを育てる大切な習慣です</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtistDatePage
