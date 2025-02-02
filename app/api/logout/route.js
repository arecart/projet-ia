// app/api/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Delete the cookie named "token"
  response.cookies.delete('token');

  return response;
}