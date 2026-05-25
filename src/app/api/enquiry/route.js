import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { validateEnquiryBody } from '@/lib/validate';

export async function GET(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    const snapshot = await adminDb
      .collection('enquiry')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const enquiries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return Response.json({ success: true, data: enquiries, page, limit });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured. Enquiry saved locally only.' }, { status: 503 });

    const body = await request.json();
    const cleanBody = validateEnquiryBody(body);

    const docRef = await adminDb.collection('enquiry').add({
      ...cleanBody,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error saving enquiry:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
