import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rateLimit } from '@/lib/rateLimit';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: 'Firebase ID token is required' }, { status: 400 });
    }

    // Verify the Firebase ID token with Admin SDK
    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    if (!adminAuth) {
      return NextResponse.json({ message: 'Auth service unavailable' }, { status: 503 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Firebase phone numbers come as "+919876543210" - strip +91
    const fullPhone = decoded.phone_number;
    if (!fullPhone) {
      return NextResponse.json({ message: 'No phone number in token' }, { status: 400 });
    }
    const phone = fullPhone.replace(/^\+91/, '');

    if (!rateLimit('firebase-login:' + phone, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    if (!adminDb) {
      return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });
    }

    const userDoc = await Promise.race([
      adminDb.collection('userdata').doc(phone).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'This phone number is not registered. Please register first.' },
        { status: 404 }
      );
    }

    const data = userDoc.data();
    const user = {
      id: data.id || phone,
      name: data.name || '',
      phone,
      role: (data.role || 'USER').toUpperCase(),
    };

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
    console.error('verify-firebase-token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
