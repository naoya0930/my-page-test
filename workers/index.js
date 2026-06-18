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
        
        return new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'D1 connection successful',
            tables: result.results
          }), 
          {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
          }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: error.message,
            message: 'D1 connection failed'
          }), 
          {
            status: 500,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
          }
        )
      }
    }

    // 404
    return new Response(
      JSON.stringify({ ok: false, message: 'Not Found' }), 
      {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      }
    )
  }
}
