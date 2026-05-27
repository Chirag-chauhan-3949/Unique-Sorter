import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ message: 'Phone and password are required' }, { status: 400 });
    }

    if (!rateLimit(`login-pw:${phone}`, 5, 60 * 1000)) {
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
    }

    const userDoc = await Promise.race([
      adminDb.collection('userdata').doc(phone).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'Invalid phone number or password' }, { status: 401 });
    }

    const data = userDoc.data();

    // Check password (stored as plain text from admin settings)
    if (!data.password || data.password !== password) {
      return NextResponse.json({ message: 'Invalid phone number or password' }, { status: 401 });
    }

    // Block pending users
    if (data.status === 'pending') {
      return NextResponse.json(
        { message: 'Your account is pending admin approval. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const role = (data.role || 'USER').toUpperCase();
    const userId = data.id || phone;

    // Create a custom Firebase token for this user
    let authUser;
    try {
      authUser = await adminAuth.getUserByPhoneNumber('+91' + phone);
    } catch {
      return NextResponse.json({ message: 'Account not fully set up. Please use OTP login.' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(authUser.uid, { role, userId });
    const customToken = await adminAuth.createCustomToken(authUser.uid, { role, userId });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      customToken,
      user: { id: userId, name: data.name || '', phone, role, allowedScreens: data.allowedScreens || null },
    });

  } catch (error) {
    console.error('Password login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
