addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

/**
 * @param {Request} request
 */
async function handleRequest(request) {
  return new Response(JSON.stringify({ ok: true, message: 'Cloudflare Workers dev is reachable' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
