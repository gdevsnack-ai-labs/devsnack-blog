import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAitechGoneResponse, isRetiredAitechDetailPath } from './src/lib/aitech-url-policy'

export function proxy(request: NextRequest) {
  if (isRetiredAitechDetailPath(request.nextUrl.pathname)) {
    return createAitechGoneResponse()
  }

  const headers = new Headers(request.headers)
  const language = request.nextUrl.pathname === '/en' || request.nextUrl.pathname.startsWith('/en/') ? 'en' : 'ko'
  headers.set('x-devsnack-locale', language)
  headers.set('x-devsnack-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
