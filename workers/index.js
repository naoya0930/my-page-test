/**
 * Cloudflare Workers with D1 Database Test
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

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

      const apiPath = pathname.replace('/api', '') || '/'
      switch (apiPath) {
        case '/':
          return jsonResponse({
            ok: true,
            message: 'API base route',
            d1_connected: true,
            user: { supabase_user_id: auth.supabase_user_id }
          })
        default:
          return jsonResponse({ ok: false, message: `API route not implemented: ${apiPath}` }, 404)
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}
