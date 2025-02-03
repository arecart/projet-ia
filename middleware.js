import { NextResponse } from 'next/server';
import { verify } from './utils/jwt';

export const config = {
  matcher: [
    '/((?!api/login|api/logout|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (token) {
    try {
      const payload = await verify(token);
      if (payload) {
        if (isLoginPage) {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
      }
    } catch (err) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set({
        name: 'token',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      return response;
    }
  }

  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
