import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Phone/email and password are required' }, { status: 400 });
    }

    if (!rateLimit(`login-pw:${identifier}`, 5, 60 * 1000)) {
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
    }

    let userDoc = null;
    let phone = null;

    // Determine if identifier is phone or email
    const isPhone = /^[6-9]\d{9}$/.test(identifier);

    if (isPhone) {
      phone = identifier;
      userDoc = await Promise.race([
        adminDb.collection('userdata').doc(identifier).get(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    } else {
      // Search by email across all users
      const snapshot = await adminDb.collection('userdata')
        .where('email', '==', identifier.toLowerCase().trim())
        .limit(1)
        .get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
        phone = userDoc.data().phone || userDoc.id;
      }
    }

    if (!userDoc || !userDoc.exists) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const data = userDoc.data();

    if (!data.password) {
      return NextResponse.json({ message: 'Password not set. Please use OTP login or contact admin.' }, { status: 401 });
    }

    // Check password — support both bcrypt hash and plain text
    let passwordValid = false;
    if (data.password.startsWith('$2b$') || data.password.startsWith('$2a$')) {
      passwordValid = await bcrypt.compare(password, data.password);
    } else {
      passwordValid = data.password === password;
    }

    if (!passwordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
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
