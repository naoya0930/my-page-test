import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { statisticsApi } from '../api/client'

interface StatisticsData {
  summary: {
    total_days: number
    total_days_possible: number
    total_characters: number
    artist_date_weeks: number
    artist_date_weeks_possible: number
  }
  weekly_stats: Array<{
    week_number: number
    total_characters: number
    days_written: number
  }>
  daily_activity: Array<{
    date: string
    character_count: number
    week_number: number
    day_of_week: number
  }>
  artist_date_history: Array<{
    week_number: number
    went_out: boolean
    excited: boolean
  }>
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatisticsData | null>(null)
  // Single-selected day in the heatmap (radio-like). Null when nothing selected.
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await statisticsApi.get()
      
      if (response.ok && response.data) {
        setStats(response.data)
      } else {
        setError(response.message || '統計データの取得に失敗しました')
      }
    } catch (err) {
      setError('統計データの取得中にエラーが発生しました')
      console.error('Failed to fetch statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">統計</h1>
          <Link
            to="/home"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← ホームに戻る
          </Link>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchStatistics}
            className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const { summary, weekly_stats, daily_activity, artist_date_history } = stats

  // Calculate max characters for scaling the weekly chart
  const maxWeeklyChars = Math.max(...weekly_stats.map(w => w.total_characters), 1)

  // Get intensity color for heatmap
  const getHeatmapColor = (charCount: number): string => {
    if (charCount === 0) return 'bg-slate-100'
    if (charCount < 500) return 'bg-teal-200'
    if (charCount < 1000) return 'bg-teal-400'
    if (charCount < 1500) return 'bg-teal-600'
    return 'bg-teal-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">統計</h1>
          <p className="mt-1 text-slate-600">あなたの12週間の軌跡</p>
        </div>
        <Link
          to="/home"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← ホームに戻る
        </Link>
      </div>

      {/* Summary Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-sm">
        <h2 className="text-xl font-semibold">12週間総合サマリー</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-indigo-100">総執筆日数</p>
            <p className="mt-2 text-4xl font-bold">
              {summary.total_days}
              <span className="text-xl font-normal text-indigo-100"> / {summary.total_days_possible}日</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-100">累計総文字数</p>
            <p className="mt-2 text-4xl font-bold">{summary.total_characters.toLocaleString()}</p>
            <p className="text-sm text-indigo-100">文字</p>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-100">アーティストデート達成</p>
            <p className="mt-2 text-4xl font-bold">
              {summary.artist_date_weeks}
              <span className="text-xl font-normal text-indigo-100"> / {summary.artist_date_weeks_possible}週</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Character Count Chart */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">週次文字数推移</h2>
        <p className="mt-1 text-sm text-slate-600">各週の合計文字数</p>
        <div className="mt-6 space-y-3">
          {weekly_stats.map((week) => (
            <div key={week.week_number} className="flex items-center gap-4">
              <div className="w-16 text-sm font-medium text-slate-700">
                Week {week.week_number}
              </div>
              <div className="flex-1">
                <div className="relative h-8 rounded-full bg-slate-100">
                  {week.total_characters > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${(week.total_characters / maxWeeklyChars) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="w-32 text-right text-sm font-medium text-slate-700">
                {week.total_characters.toLocaleString()} 文字
              </div>
              <div className="w-20 text-right text-sm text-slate-500">
                {week.days_written} / 7日
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Activity Heatmap */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">日次アクティビティヒートマップ</h2>
        <p className="mt-1 text-sm text-slate-600">
          12週間×7日間（84日間）の執筆状況 — 日付を選択して詳細を確認できます
        </p>
        <div className="mt-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2">
            {daily_activity.map((day, index) => {
              const isSelected = selectedDate === day.date
              return (
              <button
                key={index}
                type="button"
                // Radio-like single select: clicking the selected day deselects it.
                onClick={() => setSelectedDate(isSelected ? null : day.date)}
                aria-pressed={isSelected}
                className={`group relative h-12 w-full rounded-lg ${getHeatmapColor(day.character_count)} transition-all hover:scale-105 hover:ring-2 hover:ring-indigo-400 ${
                  isSelected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                }`}
                title={`${day.date}: ${day.character_count} 文字`}
              >
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  <p className="whitespace-nowrap font-medium">{day.date}</p>
                  <p className="whitespace-nowrap">{day.character_count.toLocaleString()} 文字</p>
                  <p className="whitespace-nowrap text-slate-300">Week {day.week_number}, Day {day.day_of_week}</p>
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900"></div>
                </div>
              </button>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span>少ない</span>
            <div className="h-4 w-4 rounded bg-slate-100"></div>
            <div className="h-4 w-4 rounded bg-teal-200"></div>
            <div className="h-4 w-4 rounded bg-teal-400"></div>
            <div className="h-4 w-4 rounded bg-teal-600"></div>
            <div className="h-4 w-4 rounded bg-teal-700"></div>
            <span>多い</span>
          </div>

          {/* Detail panel for the selected day */}
          {selectedDate && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 px-5 py-4">
              <div className="text-sm text-indigo-900">
                <span className="font-semibold">{selectedDate}</span> の記録
                <span className="ml-2 text-indigo-700">
                  {daily_activity
                    .find((d) => d.date === selectedDate)
                    ?.character_count.toLocaleString() ?? 0}{' '}
                  文字
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/morning-page?date=${selectedDate}`)}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                詳細
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Artist Date History */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">アーティストデート軌跡</h2>
        <p className="mt-1 text-sm text-slate-600">各週の達成状況</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artist_date_history.map((week) => (
            <div
              key={week.week_number}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Week {week.week_number}</span>
                <div className="flex gap-2">
                  {week.went_out ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700" title="外出した">
                      〇 外出
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-400" title="外出していない">
                      ✕ 外出
                    </span>
                  )}
                  {week.excited ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700" title="わくわくした">
                      〇 わくわく
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-400" title="わくわくしていない">
                      ✕ わくわく
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
