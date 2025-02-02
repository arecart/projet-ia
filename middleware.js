// middleware.js (à la racine du projet)
import { NextResponse } from 'next/server';
import { verify } from './utils/jwt';

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request) {
  console.log('Middleware executing for:', request.url);
  const token = request.cookies.get('token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (token) {
    try {
      const payload = await verify(token);
      console.log('Payload du token:', payload);
      
      // Utiliser 'id' ou 'userId' selon ce qui est présent dans le token
      const userId = payload.id || payload.userId;
      if (!userId) {
        throw new Error('Token payload invalid');
      }

      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Vérifier en temps réel l'utilisateur via l'API
      const userRes = await fetch(`${request.nextUrl.origin}/api/users/${userId}`, {
        cache: 'no-store'
      });

      if (!userRes.ok) {
        throw new Error('User not found');
      }

      const contentType = userRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await userRes.text();
        console.error('Unexpected content type:', contentType, text);
        throw new Error('User API did not return JSON');
      }
      
      const userData = await userRes.json();
      console.log('User data from API:', userData);

      console.log('Payload du token:', payload);
      console.log('User data from API:', userData);
      console.log('Comparaison -> payload.role:', payload.role, 'vs userData.role:', userData.role);
      if (!userData || userData.role !== payload.role) {
        throw new Error('User invalid or role changed');
      }
      
      return NextResponse.next();
    } catch (err) {
      console.error('Middleware error:', err);
      const response = isLoginPage
        ? NextResponse.next()
        : NextResponse.redirect(new URL('/login', request.url));
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
