import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: true, data: [] });
    const { id } = await params;
    const snapshot = await adminDb
      .collection('enquiry')
      .doc(id)
      .collection('auditLog')
      .orderBy('timestamp', 'desc')
      .get();

    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() ?? null,
      };
    });

    return Response.json({ success: true, data: logs });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
