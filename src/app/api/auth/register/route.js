import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { name, phone, password, role = 'user' } = await request.json();

    // Validate input
    if (!name || !phone || !password) {
      return NextResponse.json(
        { message: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!rateLimit(`register:${phone}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    // Block admin self-registration
    if (role.toLowerCase() === 'admin') {
      return NextResponse.json(
        { message: 'Admin registration is not allowed. Contact an existing admin.' },
        { status: 403 }
      );
    }

    // Check if user exists in Firebase (Admin SDK - server side, with timeout)
    let firebaseChecked = false;
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const docRef = adminDb.collection('userdata').doc(phone);
        const docSnap = await Promise.race([
          docRef.get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        firebaseChecked = true;
        if (docSnap.exists) {
          return NextResponse.json(
            { message: 'User with this phone number already exists' },
            { status: 409 }
          );
        }
      }
    } catch (err) {
      console.warn('Firebase check skipped:', err.message);
    }

    // Check local DB
    const existingUser = db.findUserByPhone(phone);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this phone number already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in local DB (role forced to 'user')
    const user = db.createUser({ name, phone, password: hashedPassword, role: 'user' });

    // Sync to Firebase in background (don't await - fire and forget)
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        // Fire and forget - don't block the response
        adminDb.collection('userdata').doc(user.phone).set({
          id: user.id,
          name: user.name,
          phone: user.phone,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          syncedAt: new Date().toISOString(),
        }).then(() => {
          console.log('User synced to Firebase:', user.phone);
        }).catch((err) => {
          console.error('Firebase sync error:', err.message);
        });
      }
    } catch (err) {
      console.warn('Firebase sync skipped:', err.message);
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
