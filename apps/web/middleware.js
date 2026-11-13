import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Optimistic gate only (cookie presence). Real authorization happens in server guards.
export function middleware(request) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
