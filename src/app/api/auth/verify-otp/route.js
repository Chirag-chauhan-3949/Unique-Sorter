import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) return NextResponse.json({ message: 'Phone and OTP are required' }, { status: 400 });

    if (!rateLimit('verify-otp:' + phone, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Get sessionInfo from Firestore
    let sessionInfo = null;
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const otpDoc = await Promise.race([
          adminDb.collection('otps').doc(phone).get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (otpDoc.exists) {
          const data = otpDoc.data();
          // Check expiry
          if (new Date(data.expiresAt) < new Date()) {
            await adminDb.collection('otps').doc(phone).delete();
            return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
          }
          sessionInfo = data.sessionInfo;
        }
      }
    } catch (err) {
      console.warn('Firestore session fetch skipped:', err.message);
    }

    if (!sessionInfo) {
      return NextResponse.json({ message: 'OTP not found. Please request a new one.' }, { status: 400 });
    }

    // Verify OTP with Firebase REST API
    const firebaseRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code: otp }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok || !firebaseData.idToken) {
      const msg = firebaseData.error?.message || '';
      if (msg.includes('INVALID_CODE')) return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 401 });
      if (msg.includes('SESSION_EXPIRED')) return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
      return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 401 });
    }

    // Delete used OTP session
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) await adminDb.collection('otps').doc(phone).delete();
    } catch {}

    // Verify ID token and fetch user from Firestore
    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    const decoded = await adminAuth.verifyIdToken(firebaseData.idToken);
    const cleanPhone = (decoded.phone_number || '+91' + phone).replace(/^\+91/, '');

    const userDoc = await adminDb.collection('userdata').doc(cleanPhone).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const data = userDoc.data();
    const user = { id: data.id || cleanPhone, name: data.name || '', phone: cleanPhone, role: (data.role || 'USER').toUpperCase() };

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
