/**
 * Next.js catch-all proxy route for the Firebase Functions backend.
 *
 * In local development the browser cannot call the Firebase Emulator directly
 * because the emulator does not add CORS headers to preflight responses.
 * This proxy sits on the same origin as the frontend (localhost:3000) and
 * forwards requests server-side, where CORS does not apply.
 *
 * Usage: /api/backend/<path> → <BACKEND_BASE>/api/<path>
 *
 * BACKEND_* must include the Functions **name** segment (this codebase exports `api`), e.g.
 * http://127.0.0.1:5001/{projectId}/{region}/api
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE =
  (
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
    'http://127.0.0.1:5001/internbotrag/australia-southeast1/api'
  ).replace(/\/$/, '')

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstreamUrl = `${BACKEND_BASE}/api/${path.join('/')}`

  // Forward the original request body and all headers (including Authorization)
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined
  const headers = new Headers(req.headers)
  // Remove host so the upstream doesn't reject the request
  headers.delete('host')

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
    })
  } catch (err) {
    console.error('[backend-proxy] Upstream fetch failed:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', detail: String(err) },
      { status: 502 }
    )
  }

  const responseBody = await upstreamRes.text()
  const contentType = upstreamRes.headers.get('content-type') ?? 'application/json'

  return new NextResponse(responseBody, {
    status: upstreamRes.status,
    headers: { 'content-type': contentType },
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
