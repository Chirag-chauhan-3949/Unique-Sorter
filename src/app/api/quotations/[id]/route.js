import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
    const { id } = await params;
    const doc = await adminDb.collection('quotations').doc(id).get();
    if (!doc.exists) {
      return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const data = doc.data();
    return Response.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
    const { id } = await params;
    await adminDb.collection('quotations').doc(id).delete();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
