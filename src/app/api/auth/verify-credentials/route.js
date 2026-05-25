import { NextResponse } from 'next/server';
import db from '@/lib/db';

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
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if user exists in Firebase
    let user = await findUserByPhone(phone);

    // Fallback to local DB
    if (!user) {
      const localUser = db.findUserByPhone(phone);
      if (localUser) {
        user = {
          id: localUser.id,
          name: localUser.name,
          phone: localUser.phone,
          role: (localUser.role || 'USER').toUpperCase(),
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { message: 'This phone number is not registered. Please register first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified. OTP will be sent.',
      verified: true,
      user: {
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
