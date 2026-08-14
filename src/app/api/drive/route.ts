import { NextRequest } from 'next/server'

/**
 * Google Drive 미디어 프록시 — 드라이브 영상의 브라우저 직접 재생 차단 우회
 *
 * 배경 (2026-08-14 실측):
 * - drive.usercontent.google.com/download 는 `sec-fetch-dest: video`(브라우저 video 태그) 요청에
 *   HTTP 403을 반환 → Chrome ORB(net::ERR_BLOCKED_BY_ORB)가 차단 → video 태그 직접 재생 불가
 * - 서버(Node)에서 fetch하면 403이 안 걸림 (curl과 동일하게 200/206 수신)
 * - same-origin + inline 헤더로 재서빙하면 브라우저 제약이 모두 사라짐
 *
 * 사용법: GET /api/drive?id=<FILE_ID>   (Range 요청 자동 전달 — 스트리밍 지원)
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return new Response('Missing or invalid id', { status: 400 })
  }

  const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view`
  const range = request.headers.get('range')

  try {
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' }
    if (range) headers['Range'] = range

    const upstream = await fetch(driveUrl, { headers })
    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status })
    }

    const resHeaders = new Headers()
    resHeaders.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4')
    resHeaders.set('Content-Disposition', 'inline')
    resHeaders.set('Accept-Ranges', 'bytes')
    resHeaders.set('Cache-Control', 'public, max-age=86400')
    const cl = upstream.headers.get('content-length')
    if (cl) resHeaders.set('Content-Length', cl)
    const cr = upstream.headers.get('content-range')
    if (cr) resHeaders.set('Content-Range', cr)

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch (e) {
    console.error('Drive proxy error:', e)
    return new Response(`Proxy error: ${e}`, { status: 502 })
  }
}
