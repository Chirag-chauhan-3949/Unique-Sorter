import { NextResponse } from 'next/server';

async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { adminAuth } = await import('@/lib/firebase-admin');
    return await adminAuth.verifyIdToken(authHeader.split(' ')[1]);
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const decoded = await verifyAuth(request);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { phone } = await params;
    const { adminDb } = await import('@/lib/firebase-admin');
    const doc = await adminDb.collection('userdata').doc(phone).get();
    if (!doc.exists) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: doc.data() });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const decoded = await verifyAuth(request);
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { phone } = await params;
    const body = await request.json();

    // Only allow updating name for now
    const updates = {};
    if (body.name && typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 100) {
      updates.name = body.name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }

    // Users can only update their own profile (phone matches their userId claim)
    const callerPhone = decoded.userId || decoded.phone_number?.replace('+91', '');
    if (callerPhone !== phone) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { adminDb } = await import('@/lib/firebase-admin');
    await adminDb.collection('userdata').doc(phone).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
