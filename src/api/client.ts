import { supabase } from '../auth/supabaseClient'

// API Response Types
export interface ApiResponse<T = any> {
  ok: boolean
  message?: string
  data?: T
  error?: string
}

export interface MorningPage {
  id: number
  entry_date: string
  content: string
  character_count: number
  created_at: string
  updated_at: string
}

export interface ArtistDate {
  id: number
  week_number: number
  went_out: boolean
  excited: boolean
  created_at: string
  updated_at: string
}

export interface Progress {
  current_week: number
  current_day: number
  morning_pages_this_week: number
  morning_page_done: boolean
  artist_date_done: boolean
  artist_date_details: {
    went_out: boolean
    excited: boolean
  } | null
}

/**
 * Get API base URL from environment variable
 * Falls back to localhost for development
 */
const getApiBaseUrl = (): string => {
  // 本番では同一オリジンの Worker が /api/* を配信するため、VITE_API_BASE_URL を
  // 空文字にして相対パス（/api/...）を叩かせる。空文字は falsy なので `||` で
  // フォールバックすると localhost が焼き込まれてしまう（本番でAPIが落ちる原因）。
  // そのため VITE_API_BASE_URL が設定されていれば空文字でもそのまま尊重し、
  // 未設定のときのみ同一オリジンの相対パスを既定とする。ローカル開発は .env の
  // VITE_API_BASE_URL=http://localhost:8787 が明示指定されるためそちらが使われる。
  const base = import.meta.env.VITE_API_BASE_URL
  return base !== undefined ? base : ''
}

/**
 * Base API fetch function with Supabase Auth token
 */
async function apiFetch<T = any>(
  path: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.message || result?.error || response.statusText)
  }

  return result
}

/**
 * Morning Pages API
 */
export const morningPagesApi = {
  /**
   * Create or update a morning page.
   * When `date` (YYYY-MM-DD) is omitted the backend uses today's date.
   */
  async create(content: string, date?: string): Promise<ApiResponse<{ entry_date: string; character_count: number }>> {
    return apiFetch('/morning-pages', {
      method: 'POST',
      body: JSON.stringify(date ? { content, entry_date: date } : { content })
    })
  },

  /**
   * Get a morning page for a specific date
   */
  async get(date?: string): Promise<ApiResponse<MorningPage | null>> {
    const params = date ? `?date=${date}` : ''
    return apiFetch(`/morning-pages${params}`)
  }
}

/**
 * Artist Dates API
 */
export const artistDatesApi = {
  /**
   * Create or update an artist date for a specific week
   */
  async create(weekNumber: number, wentOut: boolean, excited: boolean): Promise<ApiResponse<ArtistDate>> {
    return apiFetch('/artist-dates', {
      method: 'POST',
      body: JSON.stringify({
        week_number: weekNumber,
        went_out: wentOut,
        excited: excited
      })
    })
  },

  /**
   * Get an artist date for a specific week
   */
  async get(weekNumber: number): Promise<ApiResponse<ArtistDate | null>> {
    return apiFetch(`/artist-dates?week_number=${weekNumber}`)
  }
}

/**
 * Progress API
 */
export const progressApi = {
  /**
   * Get current user's progress for a specific week or current week
   */
  async get(weekNumber?: number): Promise<ApiResponse<Progress>> {
    const params = weekNumber ? `?week_number=${weekNumber}` : ''
    return apiFetch(`/progress${params}`)
  }
}

/**
 * Statistics API
 */
export const statisticsApi = {
  /**
   * Get statistics for all 12 weeks
   */
  async get(): Promise<ApiResponse<any>> {
    return apiFetch('/statistics')
  }
}
