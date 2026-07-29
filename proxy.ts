import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths
  if (pathname.startsWith('/dashboard')) {
    // If request has cookie or auth header in real Firebase mode
    // Client-side Zustand store handles redirect if session is unauthenticated
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
