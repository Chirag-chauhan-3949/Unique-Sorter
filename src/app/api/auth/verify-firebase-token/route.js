import { NextResponse } from 'next/server';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: 'Firebase ID token is required' }, { status: 400 });
    }

    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    if (!adminAuth) {
      return NextResponse.json({ message: 'Auth service unavailable' }, { status: 503 });
    }

    // Verify the Firebase ID token
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const phone = (decoded.phone_number || '').replace(/^\+91/, '');
    if (!phone) {
      return NextResponse.json({ message: 'No phone number in token' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ message: 'Database unavailable' }, { status: 503 });
    }

    // Get user profile from Firestore
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
    const role = (data.role || 'USER').toUpperCase();
    const userId = data.id || phone;

    // Set custom claims so role is baked into future Firebase tokens
    await adminAuth.setCustomUserClaims(decoded.uid, { role, userId });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: userId, name: data.name || '', phone, role },
    });

  } catch (error) {
    console.error('verify-firebase-token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
