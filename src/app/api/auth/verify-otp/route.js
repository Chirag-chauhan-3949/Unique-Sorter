import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) return NextResponse.json({ message: 'Phone and OTP are required' }, { status: 400 });

    if (!rateLimit('verify-otp:' + phone, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
    }

    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');

    // Get sessionInfo from Firestore
    let sessionInfo = null;
    try {
      if (adminDb) {
        const otpDoc = await Promise.race([
          adminDb.collection('otps').doc(phone).get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (otpDoc.exists) {
          const data = otpDoc.data();
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

    // Step 1: Verify OTP with Firebase REST API → get Firebase idToken + refreshToken
    const verifyRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code: otp }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.idToken) {
      const msg = verifyData.error?.message || '';
      if (msg.includes('INVALID_CODE')) return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 401 });
      if (msg.includes('SESSION_EXPIRED')) return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
      return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 401 });
    }

    // Delete used OTP session
    try {
      if (adminDb) await adminDb.collection('otps').doc(phone).delete();
    } catch {}

    // Step 2: Verify the Firebase ID token to get the UID
    const decoded = await adminAuth.verifyIdToken(verifyData.idToken);
    const uid = decoded.uid;
    const cleanPhone = (decoded.phone_number || '+91' + phone).replace(/^\+91/, '');

    // Step 3: Get user profile from Firestore
    const userDoc = await adminDb.collection('userdata').doc(cleanPhone).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const data = userDoc.data();
    const role = (data.role || 'USER').toUpperCase();
    const userId = data.id || cleanPhone;

    // Step 4: Set custom claims on the Firebase Auth user (role + userId)
    // This bakes role into the token so API routes can read it without a Firestore lookup
    await adminAuth.setCustomUserClaims(uid, { role, userId });

    // Step 5: Exchange the refreshToken to get a fresh idToken that includes the new custom claims
    const refreshRes = await fetch(
      'https://securetoken.googleapis.com/v1/token?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: verifyData.refreshToken }),
      }
    );

    const refreshData = await refreshRes.json();
    if (!refreshRes.ok || !refreshData.id_token) {
      console.error('Token refresh error:', refreshData);
      return NextResponse.json({ message: 'Login failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      idToken: refreshData.id_token,
      refreshToken: refreshData.refresh_token,
      user: { id: userId, name: data.name || '', phone: cleanPhone, role },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
