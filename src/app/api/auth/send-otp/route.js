import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function findUserByPhone(phone) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) return null;
    const userDoc = await Promise.race([
      adminDb.collection('userdata').doc(phone).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    if (userDoc.exists) {
      const data = userDoc.data();
      return { id: data.id || phone, name: data.name || '', phone: data.phone || phone, role: (data.role || 'USER').toUpperCase() };
    }
    return null;
  } catch (error) {
    console.warn('Firebase fetch skipped:', error.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });

    const phoneRegex = /^[6-9]d{9}$/;
    if (!phoneRegex.test(phone)) return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });

    if (!rateLimit('otp:' + phone, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many OTP requests. Please try again later.' }, { status: 429 });
    }

    // Check user exists
    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ message: 'This phone number is not registered. Please register first.' }, { status: 404 });
    }

    // Call Firebase Auth REST API from server (no reCAPTCHA needed server-side)
    const firebaseRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '+91' + phone, recaptchaToken: '' }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok || !firebaseData.sessionInfo) {
      console.error('Firebase SMS error:', firebaseData);
      return NextResponse.json({ message: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }

    // Store sessionInfo in Firestore (needed to verify OTP later)
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        await adminDb.collection('otps').doc(phone).set({
          sessionInfo: firebaseData.sessionInfo,
          phone,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
      }
    } catch (err) {
      console.warn('Firestore session store skipped:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to +91' + phone,
      userName: user.name,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
