import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token required' }, { status: 400 });
    }

    const res = await fetch(
      'https://securetoken.googleapis.com/v1/token?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.id_token) {
      return NextResponse.json({ message: 'Session expired. Please login again.' }, { status: 401 });
    }

    return NextResponse.json({
      idToken: data.id_token,
      refreshToken: data.refresh_token,
    });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
