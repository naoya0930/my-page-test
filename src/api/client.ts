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
  morning_pages_this_week: number
  morning_page_done: boolean
  artist_date_done: boolean
  artist_date_details: {
    went_out: boolean
    excited: boolean
  } | null
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

  const response = await fetch(`http://localhost:8787/api${path}`, {
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
   * Create or update a morning page for today
   */
  async create(content: string): Promise<ApiResponse<{ entry_date: string; character_count: number }>> {
    return apiFetch('/morning-pages', {
      method: 'POST',
      body: JSON.stringify({ content })
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
   * Get current user's progress
   */
  async get(): Promise<ApiResponse<Progress>> {
    return apiFetch('/progress')
  }
}
