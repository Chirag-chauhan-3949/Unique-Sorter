import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const otpStore = global.__otpStore || (global.__otpStore = new Map());

function generateJWT(user) {
  return jwt.sign(
    { userId: user.id, phone: user.phone, role: (user.role || 'USER').toUpperCase() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function fetchUserFromFirebase(phone) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) return null;

    const userDoc = await Promise.race([
      adminDb.collection('userdata').doc(phone).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        id: data.id || phone,
        name: data.name || '',
        phone: data.phone || phone,
        role: (data.role || 'USER').toUpperCase(),
      };
    }
    return null;
  } catch (error) {
    console.warn('Firebase fetch skipped:', error.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ message: 'Phone and OTP are required' }, { status: 400 });
    }

    // Check Firestore first (primary store — works across multiple workers)
    let otpData = null;
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const otpDoc = await Promise.race([
          adminDb.collection('otps').doc(phone).get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (otpDoc.exists) {
          const d = otpDoc.data();
          otpData = { otp: d.otp, expiresAt: new Date(d.expiresAt).getTime(), attempts: d.attempts || 0 };
        }
      }
    } catch (err) {
      console.warn('Firestore OTP check skipped:', err.message);
    }

    // Fallback to in-memory store
    if (!otpData) {
      const stored = otpStore.get(phone);
      if (stored) otpData = stored;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[verify-otp] phone=${phone} entered=${otp} stored=${otpData?.otp} found=${!!otpData}`);
    }

    if (!otpData) {
      return NextResponse.json({ message: 'OTP not found. Please request a new one.' }, { status: 400 });
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
      otpStore.delete(phone);
      return NextResponse.json({ message: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Update attempt count in Firestore
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        if (adminDb) await adminDb.collection('otps').doc(phone).update({ attempts: (otpData.attempts || 0) + 1 });
      } catch {}
      otpStore.set(phone, { ...otpData, attempts: (otpData.attempts || 0) + 1 });
      return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 401 });
    }

    // OTP is valid - delete it from both stores
    otpStore.delete(phone);
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) await adminDb.collection('otps').doc(phone).delete();
    } catch {}

    // Fetch user
    let user = await fetchUserFromFirebase(phone);
    if (!user) {
      const localUser = db.findUserByPhone(phone);
      if (localUser) {
        user = { id: localUser.id, name: localUser.name, phone: localUser.phone, role: (localUser.role || 'USER').toUpperCase() };
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const token = generateJWT(user);

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
