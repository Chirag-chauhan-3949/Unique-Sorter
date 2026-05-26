import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { name, phone, role = 'user' } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
    }

    if (!rateLimit(`register:${phone}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    if (role.toLowerCase() === 'admin') {
      return NextResponse.json({ message: 'Admin registration is not allowed. Contact an existing admin.' }, { status: 403 });
    }

    const { adminDb, adminAuth } = await import('@/lib/firebase-admin');
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
    }

    // Check Firestore — is phone already registered?
    const existing = await adminDb.collection('userdata').doc(phone).get();
    if (existing.exists) {
      return NextResponse.json({ message: 'This phone number is already registered' }, { status: 409 });
    }

    const normalizedRole = 'USER';
    const userId = phone;

    // Create Firebase Auth user with this phone number
    // This allows server-side OTP to work without reCAPTCHA
    try {
      await adminAuth.createUser({ phoneNumber: '+91' + phone });
    } catch (err) {
      if (err.code === 'auth/phone-number-already-exists') {
        // Auth user exists but Firestore record didn't — continue
      } else {
        console.error('Firebase Auth createUser error:', err.message);
        return NextResponse.json({ message: 'Registration failed. Please try again.' }, { status: 500 });
      }
    }

    // Set custom claims (role)
    const authUser = await adminAuth.getUserByPhoneNumber('+91' + phone);
    await adminAuth.setCustomUserClaims(authUser.uid, { role: normalizedRole, userId });

    // Save profile to Firestore with pending status (requires admin approval)
    await adminDb.collection('userdata').doc(phone).set({
      id: userId,
      name,
      phone,
      role: normalizedRole,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted. An admin must approve your account before you can login.',
      user: { id: userId, name, phone, role: normalizedRole, status: 'pending' },
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
