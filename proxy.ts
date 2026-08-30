import type { NextRequest } from 'next/server'
import { createAitechGoneResponse, isRetiredAitechDetailPath } from './src/lib/aitech-url-policy'

export function proxy(request: NextRequest) {
  if (isRetiredAitechDetailPath(request.nextUrl.pathname)) {
    return createAitechGoneResponse()
  }
}

export const config = {
  matcher: ['/aitech/:path*'],
}
