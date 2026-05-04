import { type NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/demo' || pathname.startsWith('/demo/')) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = '/demo'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|images/).*)',
  ],
}
