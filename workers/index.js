/**
 * Cloudflare Workers with D1 Database Test
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const method = request.method

    // CORS preflight handling
    if (method === 'OPTIONS') {
      return handleCORS(env)
    }

    // ヘルスチェックエンドポイント
    if (pathname === '/') {
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Cloudflare Workers dev is reachable',
          d1_connected: !!env.DB
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        }
      )
    }

    // D1 接続テストエンドポイント
    if (pathname === '/test-d1') {
      try {
        // テーブルが存在するか確認
        const result = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table'"
        ).all()
        
        return jsonResponse({ 
          ok: true, 
          message: 'D1 connection successful',
          tables: result.results
        })
      } catch (error) {
        return jsonResponse({ 
          ok: false, 
          error: error.message,
          message: 'D1 connection failed'
        }, 500)
      }
    }

    // API ルート雛形
    if (pathname.startsWith('/api/')) {
      if (!env.DB) {
        return jsonResponse({ ok: false, message: 'D1 binding is not configured' }, 500)
      }

      const auth = await verifySupabaseAuth(request, env)
      if (!auth.ok) {
        return jsonResponse({ ok: false, message: auth.message }, auth.status)
      }

      // Get or create user in D1. Wrap in try/catch so any DB error is returned
      // as a JSON response instead of bubbling up as a non-JSON 500, which the
      // frontend cannot parse (it would surface a generic, misleading error).
      try {
        const userId = await getOrCreateUser(env.DB, auth.supabase_user_id, auth.email)

        // Handle API requests
        return await handleApiRequest(request, env, pathname, userId, auth)
      } catch (error) {
        return jsonResponse({
          ok: false,
          message: 'Internal server error',
          error: error.message
        }, 500)
      }
    }

    // 404
    return jsonResponse({ ok: false, message: 'Not Found' }, 404)
  }
}

async function verifySupabaseAuth(request, env) {
  const authorization = request.headers.get('Authorization') || request.headers.get('authorization')
  if (!authorization) {
    return { ok: false, status: 401, message: 'Authorization header is required' }
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return { ok: false, status: 401, message: 'Bearer token is required in Authorization header' }
  }

  const token = match[1]
  if (!token || token.trim().length === 0) {
    return { ok: false, status: 401, message: 'Token is empty' }
  }

  // JWT デコードと検証
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { ok: false, status: 401, message: 'Invalid JWT format' }
    }

    // ペイロードのデコード
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    
    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return { ok: false, status: 401, message: 'Token has expired' }
    }

    // Supabase ユーザーID（sub）の存在確認
    if (!payload.sub) {
      return { ok: false, status: 401, message: 'Token does not contain user ID (sub)' }
    }

    // TODO: 本番環境では署名検証が必要
    // SUPABASE_JWT_SECRET を使用して署名を検証する
    // 現在は雛形として基本的なデコードと有効期限チェックのみ実装

    return {
      ok: true,
      status: 200,
      supabase_user_id: payload.sub,
      email: payload.email,
      token,
      payload
    }
  } catch (error) {
    return { ok: false, status: 401, message: `JWT verification failed: ${error.message}` }
  }
}

/**
 * Get or create user in D1 database
 */
async function getOrCreateUser(db, supabase_user_id, email) {
  try {
    // Check if user exists
    const existingUser = await db.prepare(
      'SELECT id FROM Users WHERE supabase_user_id = ?'
    ).bind(supabase_user_id).first()

    if (existingUser) {
      // Update last_active_at
      await db.prepare(
        'UPDATE Users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(existingUser.id).run()
      return existingUser.id
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.prepare(
      'INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    ).bind(userId, supabase_user_id, email).run()

    return userId
  } catch (error) {
    throw new Error(`Failed to get or create user: ${error.message}`)
  }
}

/**
 * Handle API requests
 */
async function handleApiRequest(request, env, pathname, userId, auth) {
  const url = new URL(request.url)
  const method = request.method
  const apiPath = pathname.replace('/api', '') || '/'

  try {
    // Morning Pages endpoints
    if (apiPath === '/morning-pages') {
      if (method === 'POST') {
        return await handleCreateMorningPage(request, env.DB, userId)
      } else if (method === 'GET') {
        return await handleGetMorningPage(url, env.DB, userId)
      }
    }

    // Artist Dates endpoints
    if (apiPath === '/artist-dates') {
      if (method === 'POST') {
        return await handleCreateArtistDate(request, env.DB, userId)
      } else if (method === 'GET') {
        return await handleGetArtistDate(url, env.DB, userId)
      }
    }

    // Progress endpoint
    if (apiPath === '/progress' && method === 'GET') {
      return await handleGetProgress(url, env.DB, userId)
    }

    // Statistics endpoint
    if (apiPath === '/statistics' && method === 'GET') {
      return await handleGetStatistics(env.DB, userId)
    }

    // Base route (for testing)
    if (apiPath === '/') {
      return jsonResponse({
        ok: true,
        message: 'API base route',
        d1_connected: true,
        user: { 
          user_id: userId,
          supabase_user_id: auth.supabase_user_id 
        }
      })
    }

    return jsonResponse({ 
      ok: false, 
      message: `API route not found: ${method} ${apiPath}` 
    }, 404)

  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Internal server error',
      error: error.message 
    }, 500)
  }
}

/**
 * POST /api/morning-pages
 * Create or update a morning page entry
 */
async function handleCreateMorningPage(request, db, userId) {
  try {
    const body = await request.json()
    const { content, entry_date } = body

    // Validation
    if (!content || content.trim().length === 0) {
      return jsonResponse({
        ok: false,
        message: 'Content is required and cannot be empty'
      }, 400)
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // entry_date is optional. When provided (editing a specific day from the
    // home grid), it must be a valid YYYY-MM-DD and must not be in the future.
    let entryDate = today
    if (entry_date !== undefined && entry_date !== null && entry_date !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry_date)) {
        return jsonResponse({
          ok: false,
          message: 'entry_date must be in YYYY-MM-DD format'
        }, 400)
      }
      if (entry_date > today) {
        return jsonResponse({
          ok: false,
          message: 'entry_date cannot be in the future'
        }, 400)
      }
      entryDate = entry_date
    }

    const characterCount = content.length

    // Check if entry already exists (UPSERT logic)
    const existing = await db.prepare(
      'SELECT id FROM MorningPages WHERE user_id = ? AND entry_date = ?'
    ).bind(userId, entryDate).first()

    if (existing) {
      // Update existing entry
      await db.prepare(
        'UPDATE MorningPages SET content = ?, character_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(content, characterCount, existing.id).run()
    } else {
      // Insert new entry
      await db.prepare(
        'INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
      ).bind(userId, entryDate, content, characterCount).run()
    }

    // Auto-update Progress table
    await autoUpdateMorningPageProgress(db, userId, entryDate)

    return jsonResponse({
      ok: true,
      message: 'Morning page saved successfully',
      data: {
        entry_date: entryDate,
        character_count: characterCount
      }
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to save morning page',
      error: error.message 
    }, 500)
  }
}

/**
 * Auto-update Progress.morning_page_done when a morning page is saved
 */
async function autoUpdateMorningPageProgress(db, userId, entryDate) {
  try {
    // Get user's creation date to calculate week number
    const user = await db.prepare(
      'SELECT created_at FROM Users WHERE id = ?'
    ).bind(userId).first()

    if (!user) return

    const createdDate = new Date(user.created_at)
    const entryDateTime = new Date(entryDate)
    const daysSinceCreation = Math.floor((entryDateTime - createdDate) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.min(Math.floor(daysSinceCreation / 7) + 1, 12)

    // Calculate date range for this week
    const weekStartDate = new Date(createdDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    const weekStartStr = weekStartDate.toISOString().split('T')[0]
    const weekEndStr = weekEndDate.toISOString().split('T')[0]

    // Count morning pages for this week
    const morningPagesCount = await db.prepare(
      'SELECT COUNT(*) as count FROM MorningPages WHERE user_id = ? AND entry_date >= ? AND entry_date < ?'
    ).bind(userId, weekStartStr, weekEndStr).first()

    const morningPageDone = morningPagesCount.count >= 7

    // Get current artist_date_done status
    const existing = await db.prepare(
      'SELECT artist_date_done FROM Progress WHERE user_id = ? AND week_number = ?'
    ).bind(userId, weekNumber).first()

    const artistDateDone = existing ? existing.artist_date_done === 1 : false

    // Update Progress
    await updateProgress(db, userId, weekNumber, morningPageDone, artistDateDone)
  } catch (error) {
    console.error('Failed to auto-update morning page progress:', error)
  }
}

/**
 * GET /api/morning-pages?date=YYYY-MM-DD
 * Get a morning page entry for a specific date
 */
async function handleGetMorningPage(url, db, userId) {
  try {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    const result = await db.prepare(
      'SELECT id, entry_date, content, character_count, created_at, updated_at FROM MorningPages WHERE user_id = ? AND entry_date = ?'
    ).bind(userId, date).first()

    if (!result) {
      return jsonResponse({
        ok: true,
        message: 'No morning page found for this date',
        data: null
      })
    }

    return jsonResponse({
      ok: true,
      data: result
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to get morning page',
      error: error.message 
    }, 500)
  }
}

/**
 * POST /api/artist-dates
 * Create or update an artist date entry
 */
async function handleCreateArtistDate(request, db, userId) {
  try {
    const body = await request.json()
    const { week_number, went_out, excited } = body

    // Validation
    if (!week_number || week_number < 1 || week_number > 12) {
      return jsonResponse({ 
        ok: false, 
        message: 'week_number is required and must be between 1 and 12' 
      }, 400)
    }

    const wentOut = went_out === true ? 1 : 0
    const excitedVal = excited === true ? 1 : 0

    // Check if entry already exists (UPSERT logic)
    const existing = await db.prepare(
      'SELECT id FROM ArtistDates WHERE user_id = ? AND week_number = ?'
    ).bind(userId, week_number).first()

    if (existing) {
      // Update existing entry
      await db.prepare(
        'UPDATE ArtistDates SET went_out = ?, excited = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(wentOut, excitedVal, existing.id).run()
    } else {
      // Insert new entry
      await db.prepare(
        'INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
      ).bind(userId, week_number, wentOut, excitedVal).run()
    }

    // Auto-update Progress table
    await autoUpdateArtistDateProgress(db, userId, week_number)

    return jsonResponse({
      ok: true,
      message: 'Artist date saved successfully',
      data: {
        week_number,
        went_out: wentOut === 1,
        excited: excitedVal === 1
      }
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to save artist date',
      error: error.message 
    }, 500)
  }
}

/**
 * Auto-update Progress.artist_date_done when an artist date is saved
 */
async function autoUpdateArtistDateProgress(db, userId, weekNumber) {
  try {
    // Get user's creation date
    const user = await db.prepare(
      'SELECT created_at FROM Users WHERE id = ?'
    ).bind(userId).first()

    if (!user) return

    const createdDate = new Date(user.created_at)

    // Calculate date range for this week
    const weekStartDate = new Date(createdDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    const weekStartStr = weekStartDate.toISOString().split('T')[0]
    const weekEndStr = weekEndDate.toISOString().split('T')[0]

    // Count morning pages for this week
    const morningPagesCount = await db.prepare(
      'SELECT COUNT(*) as count FROM MorningPages WHERE user_id = ? AND entry_date >= ? AND entry_date < ?'
    ).bind(userId, weekStartStr, weekEndStr).first()

    const morningPageDone = morningPagesCount.count >= 7

    // Artist date is done (entry exists)
    const artistDateDone = true

    // Update Progress
    await updateProgress(db, userId, weekNumber, morningPageDone, artistDateDone)
  } catch (error) {
    console.error('Failed to auto-update artist date progress:', error)
  }
}

/**
 * GET /api/artist-dates?week_number=N
 * Get an artist date entry for a specific week
 */
async function handleGetArtistDate(url, db, userId) {
  try {
    const weekNumber = url.searchParams.get('week_number')

    if (!weekNumber) {
      return jsonResponse({ 
        ok: false, 
        message: 'week_number parameter is required' 
      }, 400)
    }

    const result = await db.prepare(
      'SELECT id, week_number, went_out, excited, created_at, updated_at FROM ArtistDates WHERE user_id = ? AND week_number = ?'
    ).bind(userId, parseInt(weekNumber)).first()

    if (!result) {
      return jsonResponse({
        ok: true,
        message: 'No artist date found for this week',
        data: null
      })
    }

    return jsonResponse({
      ok: true,
      data: {
        ...result,
        went_out: result.went_out === 1,
        excited: result.excited === 1
      }
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to get artist date',
      error: error.message 
    }, 500)
  }
}

/**
 * GET /api/progress?week_number=N
 * Get user's progress information for a specific week
 */
async function handleGetProgress(url, db, userId) {
  try {
    // Get user's creation date
    const user = await db.prepare(
      'SELECT created_at FROM Users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return jsonResponse({ 
        ok: false, 
        message: 'User not found' 
      }, 404)
    }

    // Calculate current week (days since creation / 7 + 1, max 12)
    const createdDate = new Date(user.created_at)
    const today = new Date()
    const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24))
    const currentWeek = Math.min(Math.floor(daysSinceCreation / 7) + 1, 12)
    // Overall day number within the 84-day (12-week) program, clamped to 1..84.
    const currentDay = Math.min(Math.max(daysSinceCreation + 1, 1), 84)

    // Get requested week number (default to current week)
    const requestedWeek = url.searchParams.get('week_number') 
      ? parseInt(url.searchParams.get('week_number')) 
      : currentWeek

    // Validate week number
    if (requestedWeek < 1 || requestedWeek > 12) {
      return jsonResponse({ 
        ok: false, 
        message: 'week_number must be between 1 and 12' 
      }, 400)
    }

    // Calculate date range for the requested week
    const weekStartDate = new Date(createdDate.getTime() + (requestedWeek - 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get daily status for the 7 days of the requested week
    const dailyStatus = []
    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(weekStartDate.getTime() + day * 24 * 60 * 60 * 1000)
      const dateStr = currentDay.toISOString().split('T')[0]
      
      const morningPage = await db.prepare(
        'SELECT character_count FROM MorningPages WHERE user_id = ? AND entry_date = ?'
      ).bind(userId, dateStr).first()

      dailyStatus.push({
        day: day + 1,
        date: dateStr,
        done: !!morningPage,
        character_count: morningPage ? morningPage.character_count : 0
      })
    }

    // Count morning pages for this week
    const weekStartStr = weekStartDate.toISOString().split('T')[0]
    const weekEndStr = weekEndDate.toISOString().split('T')[0]
    const morningPagesCount = await db.prepare(
      'SELECT COUNT(*) as count FROM MorningPages WHERE user_id = ? AND entry_date >= ? AND entry_date < ?'
    ).bind(userId, weekStartStr, weekEndStr).first()

    // Get artist date for requested week
    const artistDate = await db.prepare(
      'SELECT went_out, excited FROM ArtistDates WHERE user_id = ? AND week_number = ?'
    ).bind(userId, requestedWeek).first()

    // Update or create Progress record
    await updateProgress(db, userId, requestedWeek, morningPagesCount.count >= 7, !!artistDate)

    return jsonResponse({
      ok: true,
      data: {
        week_number: requestedWeek,
        current_week: currentWeek,
        current_day: currentDay,
        morning_pages_this_week: morningPagesCount.count || 0,
        morning_page_done: (morningPagesCount.count || 0) >= 7,
        artist_date_done: artistDate ? (artistDate.went_out === 1 || artistDate.excited === 1) : false,
        daily_status: dailyStatus,
        artist_date: artistDate ? {
          went_out: artistDate.went_out === 1,
          excited: artistDate.excited === 1
        } : {
          went_out: false,
          excited: false
        }
      }
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to get progress',
      error: error.message 
    }, 500)
  }
}

/**
 * GET /api/statistics
 * Get comprehensive statistics for the user's 12-week journey
 */
async function handleGetStatistics(db, userId) {
  try {
    // Get user's creation date
    const user = await db.prepare(
      'SELECT created_at FROM Users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return jsonResponse({ 
        ok: false, 
        message: 'User not found' 
      }, 404)
    }

    // Total days written
    const totalDaysResult = await db.prepare(
      'SELECT COUNT(*) as count FROM MorningPages WHERE user_id = ?'
    ).bind(userId).first()
    const totalDays = totalDaysResult.count || 0

    // Total character count
    const totalCharsResult = await db.prepare(
      'SELECT SUM(character_count) as total FROM MorningPages WHERE user_id = ?'
    ).bind(userId).first()
    const totalCharacters = totalCharsResult.total || 0

    // Artist date weeks count
    const artistDateWeeksResult = await db.prepare(
      'SELECT COUNT(*) as count FROM ArtistDates WHERE user_id = ? AND (went_out = 1 OR excited = 1)'
    ).bind(userId).first()
    const artistDateWeeks = artistDateWeeksResult.count || 0

    // Weekly stats (character count per week)
    const weeklyStats = []
    const createdDate = new Date(user.created_at)
    
    for (let week = 1; week <= 12; week++) {
      const weekStartDate = new Date(createdDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStartDate.toISOString().split('T')[0]
      const weekEndStr = weekEndDate.toISOString().split('T')[0]

      const weekData = await db.prepare(
        'SELECT COUNT(*) as days_written, SUM(character_count) as total_characters FROM MorningPages WHERE user_id = ? AND entry_date >= ? AND entry_date < ?'
      ).bind(userId, weekStartStr, weekEndStr).first()

      weeklyStats.push({
        week_number: week,
        total_characters: weekData.total_characters || 0,
        days_written: weekData.days_written || 0
      })
    }

    // Daily activity (all 84 days)
    const dailyActivity = []
    for (let week = 1; week <= 12; week++) {
      for (let day = 0; day < 7; day++) {
        const weekStartDate = new Date(createdDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
        const currentDay = new Date(weekStartDate.getTime() + day * 24 * 60 * 60 * 1000)
        const dateStr = currentDay.toISOString().split('T')[0]
        
        const morningPage = await db.prepare(
          'SELECT character_count FROM MorningPages WHERE user_id = ? AND entry_date = ?'
        ).bind(userId, dateStr).first()

        dailyActivity.push({
          date: dateStr,
          character_count: morningPage ? morningPage.character_count : 0,
          week_number: week,
          day_of_week: day + 1
        })
      }
    }

    // Artist date history
    const artistDateHistory = []
    for (let week = 1; week <= 12; week++) {
      const artistDate = await db.prepare(
        'SELECT went_out, excited FROM ArtistDates WHERE user_id = ? AND week_number = ?'
      ).bind(userId, week).first()

      artistDateHistory.push({
        week_number: week,
        went_out: artistDate ? artistDate.went_out === 1 : false,
        excited: artistDate ? artistDate.excited === 1 : false
      })
    }

    return jsonResponse({
      ok: true,
      data: {
        summary: {
          total_days: totalDays,
          total_days_possible: 84,
          total_characters: totalCharacters,
          artist_date_weeks: artistDateWeeks,
          artist_date_weeks_possible: 12
        },
        weekly_stats: weeklyStats,
        daily_activity: dailyActivity,
        artist_date_history: artistDateHistory
      }
    })
  } catch (error) {
    return jsonResponse({ 
      ok: false, 
      message: 'Failed to get statistics',
      error: error.message 
    }, 500)
  }
}

/**
 * Update Progress table
 */
async function updateProgress(db, userId, weekNumber, morningPageDone, artistDateDone) {
  try {
    const existing = await db.prepare(
      'SELECT id FROM Progress WHERE user_id = ? AND week_number = ?'
    ).bind(userId, weekNumber).first()

    if (existing) {
      await db.prepare(
        'UPDATE Progress SET morning_page_done = ?, artist_date_done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(morningPageDone ? 1 : 0, artistDateDone ? 1 : 0, existing.id).run()
    } else {
      await db.prepare(
        'INSERT INTO Progress (user_id, week_number, morning_page_done, artist_date_done, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
      ).bind(userId, weekNumber, morningPageDone ? 1 : 0, artistDateDone ? 1 : 0).run()
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(env) {
  const allowedOrigin = env.CORS_ALLOWED_ORIGIN || '*'
  const allowedMethods = env.CORS_ALLOWED_METHODS || 'GET, POST, PUT, DELETE, OPTIONS'
  const allowedHeaders = env.CORS_ALLOWED_HEADERS || 'Content-Type, Authorization'
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': allowedHeaders,
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  })
}

function jsonResponse(body, status = 200, env = {}) {
  const allowedOrigin = env.CORS_ALLOWED_ORIGIN || '*'
  const allowedMethods = env.CORS_ALLOWED_METHODS || 'GET, POST, PUT, DELETE, OPTIONS'
  const allowedHeaders = env.CORS_ALLOWED_HEADERS || 'Content-Type, Authorization'
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': allowedHeaders
    }
  })
}
