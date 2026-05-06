import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isFirebaseConfigured, db as firebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    phone: user.phone,
    role: (user.role || 'USER').toUpperCase(),
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

async function fetchUserFromFirebase(phone) {
  if (!isFirebaseConfigured || !firebaseDb) return null;

  try {
    const userDocRef = doc(firebaseDb, 'userdata', phone);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userData.id || phone,
        name: userData.name || '',
        phone: userData.phone || phone,
        password: userData.password,
        role: (userData.role || 'USER').toUpperCase(),
        createdAt: userData.createdAt,
      };
    }

    const usersDocRef = doc(firebaseDb, 'users', phone);
    const usersDoc = await getDoc(usersDocRef);

    if (usersDoc.exists()) {
      const userData = usersDoc.data();
      return {
        id: userData.id || phone,
        name: userData.name || '',
        phone: userData.phone || phone,
        password: userData.password,
        role: (userData.role || 'USER').toUpperCase(),
        createdAt: userData.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching user from Firebase:', error.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { phone, password, role } = await request.json();

    if (!phone || !password || !role) {
      return NextResponse.json(
        { message: 'Phone, password, and role are required' },
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

    const validRoles = ['ADMIN', 'USER'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { message: 'Invalid role selected' },
        { status: 400 }
      );
    }

    let user = await fetchUserFromFirebase(phone);

    if (!user) {
      user = db.findUserByPhone(phone);
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid phone number or password' },
        { status: 401 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { message: 'Invalid phone number or password' },
        { status: 401 }
      );
    }

    const userRole = (user.role || 'USER').toUpperCase();
    if (userRole !== role.toUpperCase()) {
      return NextResponse.json(
        { message: 'You are not assigned this role' },
        { status: 403 }
      );
    }

    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: userRole,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
