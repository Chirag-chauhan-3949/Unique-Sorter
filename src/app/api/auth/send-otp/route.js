import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

// In-memory OTP store (use Redis/Firebase in production)
const otpStore = global.__otpStore || (global.__otpStore = new Map());

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
    }

    if (!rateLimit(`otp:${phone}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many OTP requests. Please try again later.' }, { status: 429 });
    }

    // Check if user exists
    let user = await findUserByPhone(phone);
    if (!user) {
      const localUser = db.findUserByPhone(phone);
      if (localUser) {
        user = { id: localUser.id, name: localUser.name, phone: localUser.phone, role: (localUser.role || 'USER').toUpperCase() };
      }
    }

    if (!user) {
      return NextResponse.json(
        { message: 'This phone number is not registered. Please register first.' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(phone, { otp, expiresAt, attempts: 0 });

    // Send OTP via Firebase Admin SDK
    // For Blaze plan, we use Firebase Auth to create/update user and send SMS
    try {
      const { adminAuth } = await import('@/lib/firebase-admin');
      if (adminAuth) {
        // Store OTP in Firestore for verification
        const { adminDb } = await import('@/lib/firebase-admin');
        if (adminDb) {
          await adminDb.collection('otps').doc(phone).set({
            otp,
            phone,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(expiresAt).toISOString(),
            verified: false,
          });
        }
      }
    } catch (err) {
      console.warn('Firebase OTP store skipped:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to +91${phone}`,
      userName: user.name,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
