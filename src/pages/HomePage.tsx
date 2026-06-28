import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { progressApi } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import Toast from '../components/Toast'
import CompletionModal from '../components/CompletionModal'

// Total number of days in the 12-week program (12 weeks × 7 days).
const TOTAL_DAYS = 84

interface DailyStatus {
  day: number
  date: string
  done: boolean
  character_count: number
}

interface WeekProgress {
  current_week: number
  current_day: number
  selected_week: number
  morning_pages_this_week: number
  morning_page_done: boolean
  artist_date_done: boolean
  artist_date_details: {
    went_out: boolean
    excited: boolean
  } | null
  daily_status: DailyStatus[]
}

const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<WeekProgress | null>(null)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [toast, setToast] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Show a toast when redirected here with a `toast` navigation state
  // (e.g. after saving a morning page). Clear the state afterwards so the
  // toast does not reappear on reload or back navigation.
  useEffect(() => {
    const state = location.state as { toast?: string } | null
    if (state?.toast) {
      setToast(state.toast)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  // Heuristic: does this error mean the session/auth is invalid (so retrying
  // is pointless and the user must re-authenticate)?
  const isAuthError = (message: string) => {
    const m = message.toLowerCase()
    return (
      m.includes('not authenticated') ||
      m.includes('authorization') ||
      m.includes('token') ||
      m.includes('unauthorized') ||
      m.includes('401')
    )
  }

  const fetchProgress = async (weekNumber?: number) => {
    try {
      setLoading(true)
      setError('')
      setAuthFailed(false)
      const response = await progressApi.get(weekNumber)
      if (response.ok && response.data) {
        const data = response.data as any
        setProgress({
          current_week: data.current_week,
          current_day: data.current_day ?? 1,
          selected_week: weekNumber || data.current_week,
          morning_pages_this_week: data.morning_pages_this_week || 0,
          morning_page_done: data.morning_page_done,
          artist_date_done: data.artist_date_done,
          artist_date_details: data.artist_date_details,
          daily_status: data.daily_status || []
        })
        // Set initial selected week if not set
        if (!weekNumber) {
          setSelectedWeek(data.current_week)
          // On initial load, celebrate program completion (Day 84 reached).
          if ((data.current_day ?? 0) >= TOTAL_DAYS) {
            setShowCompletion(true)
          }
        }
      } else {
        const message = response.message || '進捗の取得に失敗しました。'
        setError(message)
        setAuthFailed(isAuthError(message))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      if (isAuthError(message)) {
        setAuthFailed(true)
        setError('セッションの取得に失敗しました。再度ログインしてください。')
      } else {
        setError('進捗の取得に失敗しました。ログインしているか確認してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? selectedWeek - 1 : selectedWeek + 1
    if (newWeek >= 1 && newWeek <= 12) {
      setSelectedWeek(newWeek)
      fetchProgress(newWeek)
    }
  }

  // Today's date as YYYY-MM-DD, used to classify each day dot.
  const today = new Date().toISOString().split('T')[0]

  // Clicking a day dot opens that day's morning page for editing. Future days
  // are locked; past days require a confirmation before editing.
  const handleDayClick = (date: string) => {
    if (date > today) {
      return // future day — locked
    }
    if (date < today) {
      const ok = window.confirm('過去のページです。編集を開始してよろしいですか？')
      if (!ok) return
    }
    navigate(`/morning-page?date=${date}`)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Discard the (failed/stale) login session and send the user back to login.
  const handleReturnToLogin = async () => {
    await signOut()
    navigate('/login', { replace: true })
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
        <div className="mt-4 flex flex-wrap gap-3">
          {authFailed ? (
            <button
              onClick={handleReturnToLogin}
              className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              ログイン画面に戻る
            </button>
          ) : (
            <>
              <button
                onClick={() => fetchProgress()}
                className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                再読み込み
              </button>
              <button
                onClick={handleReturnToLogin}
                className="rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ログイン画面に戻る
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const currentWeek = progress?.current_week ?? 1
  const isPast = selectedWeek < currentWeek
  const isFuture = selectedWeek > currentWeek
  const isCurrent = selectedWeek === currentWeek

  // Visual styling based on time period
  const weekCardClass = isPast
    ? 'rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-400 to-slate-500 p-8 text-white shadow-sm grayscale'
    : isFuture
    ? 'rounded-3xl border border-slate-300 bg-gradient-to-br from-blue-300 to-blue-400 p-8 text-white shadow-sm opacity-60'
    : 'rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-sm'

  const actionButtonClass = isPast || isFuture
    ? 'opacity-50 pointer-events-none cursor-not-allowed'
    : ''

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

      {/* Overall progress indicator: 本日: Day X / 84 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">12週間プログラムの進捗</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          本日: Day <span className="text-indigo-600">{progress?.current_day ?? 1}</span>
          <span className="text-slate-400"> / {TOTAL_DAYS}</span>
        </p>
      </div>

      {/* Week Navigation Card with Time Travel */}
      <div className={weekCardClass}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleWeekChange('prev')}
            disabled={selectedWeek <= 1}
            className="rounded-full bg-white/25 p-3 text-white shadow-sm ring-1 ring-white/40 transition hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
            title="前の週"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-sm font-medium opacity-90">
              {isPast && '📖 過去の記録'}
              {isCurrent && '✨ 現在実施中'}
              {isFuture && '🔒 未来の週'}
            </p>
            <p className="mt-3 text-5xl font-bold">第{selectedWeek}週目</p>
            <p className="mt-2 text-sm opacity-80">
              全12週間のうち {selectedWeek} 週目
              {!isCurrent && ` (現在は第${currentWeek}週目)`}
            </p>
          </div>

          <button
            onClick={() => handleWeekChange('next')}
            disabled={selectedWeek >= 12}
            className="rounded-full bg-white/25 p-3 text-white shadow-sm ring-1 ring-white/40 transition hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
            title="次の週"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Shown only while viewing a past/future week. Uses a high-contrast
            white-on-card style so it stands out as the primary action. */}
        {!isCurrent && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setSelectedWeek(currentWeek)
                fetchProgress(currentWeek)
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              現在の週に戻る
            </button>
          </div>
        )}
      </div>

      {/* Daily Status Grid - Morning Pages */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">モーニングページ（今週の実行状況）</h3>
          {/* X/7 progress as a clear fraction text */}
          <span className="text-lg font-bold text-indigo-600">
            {progress?.morning_pages_this_week ?? 0}/7
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-7 gap-2">
          {progress?.daily_status.map((day) => {
            const isFutureDay = day.date > today
            return (
            <button
              key={day.day}
              type="button"
              onClick={() => handleDayClick(day.date)}
              disabled={isFutureDay}
              className={`group relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition ${
                day.done
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-dashed border-slate-300 bg-slate-50'
              } ${
                isFutureDay
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:border-indigo-400 hover:shadow-sm'
              }`}
              title={
                isFutureDay
                  ? `${day.date}: まだ記録できません`
                  : `${day.date}: ${day.character_count}文字（クリックで編集）`
              }
            >
              <div className="text-xs font-medium text-slate-600">Day {day.day}</div>
              {day.done ? (
                <>
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {day.character_count.toLocaleString()}字
                  </div>
                </>
              ) : (
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                <p className="whitespace-nowrap font-medium">{day.date}</p>
                <p className="whitespace-nowrap">{day.character_count.toLocaleString()} 文字</p>
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900"></div>
              </div>
            </button>
            )
          })}
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${Math.min(((progress?.morning_pages_this_week ?? 0) / 7) * 100, 100)}%` }}
          ></div>
        </div>
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
            第{selectedWeek}週: {progress?.morning_pages_this_week ?? 0} / 7 ページ
          </p>
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
            <p className="mt-2 text-sm text-slate-600">第{selectedWeek}週の記録はまだありません</p>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className={`grid gap-4 sm:grid-cols-2 ${actionButtonClass}`}>
        <Link
          to="/morning-page"
          className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md ${
            isPast || isFuture ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              モーニングページ
              {(isPast || isFuture) && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {isPast ? '（閲覧のみ）' : '（ロック中）'}
                </span>
              )}
            </h3>
            <svg className="h-6 w-6 text-slate-400 transition group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {isPast
              ? '過去の記録を閲覧できます'
              : isFuture
              ? 'まだ記録できません'
              : progress?.morning_page_done
              ? '今週は7ページ達成しました！'
              : '今日の思考を記録しましょう'}
          </p>
        </Link>

        <Link
          to="/artist-date"
          className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md ${
            isPast || isFuture ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              アーティストデート
              {(isPast || isFuture) && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {isPast ? '（閲覧のみ）' : '（ロック中）'}
                </span>
              )}
            </h3>
            <svg className="h-6 w-6 text-slate-400 transition group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {isPast
              ? '過去の記録を閲覧できます'
              : isFuture
              ? 'まだ記録できません'
              : progress?.artist_date_done
              ? '今週の記録は完了しています'
              : '今週のクリエイティブな時間を記録'}
          </p>
        </Link>
      </div>

      {/* Save confirmation toast (shown after redirect from morning page) */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Program completion celebration (Day 84 reached) */}
      {showCompletion && <CompletionModal onClose={() => setShowCompletion(false)} />}
    </div>
  )
}

export default HomePage
