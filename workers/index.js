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

      // Get or create user in D1
      const userId = await getOrCreateUser(env.DB, auth.supabase_user_id, auth.email)
      
      // Handle API requests
      return await handleApiRequest(request, env, pathname, userId, auth)
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
        'UPDATE Users SET last_active_at = datetime("now") WHERE id = ?'
      ).bind(existingUser.id).run()
      return existingUser.id
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.prepare(
      'INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
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
      return await handleGetProgress(env.DB, userId)
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
    const { content } = body

    // Validation
    if (!content || content.trim().length === 0) {
      return jsonResponse({ 
        ok: false, 
        message: 'Content is required and cannot be empty' 
      }, 400)
    }

    const entryDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const characterCount = content.length

    // Check if entry already exists (UPSERT logic)
    const existing = await db.prepare(
      'SELECT id FROM MorningPages WHERE user_id = ? AND entry_date = ?'
    ).bind(userId, entryDate).first()

    if (existing) {
      // Update existing entry
      await db.prepare(
        'UPDATE MorningPages SET content = ?, character_count = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(content, characterCount, existing.id).run()
    } else {
      // Insert new entry
      await db.prepare(
        'INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))'
      ).bind(userId, entryDate, content, characterCount).run()
    }

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
        'UPDATE ArtistDates SET went_out = ?, excited = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(wentOut, excitedVal, existing.id).run()
    } else {
      // Insert new entry
      await db.prepare(
        'INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))'
      ).bind(userId, week_number, wentOut, excitedVal).run()
    }

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
 * GET /api/progress
 * Get user's progress information
 */
async function handleGetProgress(db, userId) {
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

    // Count morning pages for last 7 days
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const morningPagesCount = await db.prepare(
      'SELECT COUNT(*) as count FROM MorningPages WHERE user_id = ? AND entry_date >= ?'
    ).bind(userId, sevenDaysAgo).first()

    // Get artist date for current week
    const artistDate = await db.prepare(
      'SELECT went_out, excited FROM ArtistDates WHERE user_id = ? AND week_number = ?'
    ).bind(userId, currentWeek).first()

    return jsonResponse({
      ok: true,
      data: {
        current_week: currentWeek,
        morning_pages_this_week: morningPagesCount.count || 0,
        morning_page_done: (morningPagesCount.count || 0) >= 7,
        artist_date_done: artistDate ? (artistDate.went_out === 1 || artistDate.excited === 1) : false,
        artist_date_details: artistDate ? {
          went_out: artistDate.went_out === 1,
          excited: artistDate.excited === 1
        } : null
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
