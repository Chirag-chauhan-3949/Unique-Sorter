import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone || !newPassword) {
      return NextResponse.json({ message: 'Phone and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!rateLimit(`reset-pw:${phone}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many reset attempts. Try again later.' }, { status: 429 });
    }

    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) {
      return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
    }

    const userDoc = await adminDb.collection('userdata').doc(phone).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await adminDb.collection('userdata').doc(phone).update({ password: hashedPassword });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
