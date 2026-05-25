import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { validateQuotationBody } from '@/lib/validate';

export async function GET(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);

    const snapshot = await adminDb
      .collection('quotations')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const quotations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return Response.json({ success: true, data: quotations, limit });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
    const body = await request.json();
    const cleanBody = validateQuotationBody(body);

    // Use deterministic doc ID when coming from an enquiry to prevent duplicates
    if (cleanBody.enquiryId && cleanBody.quotationType) {
      const docId = `${cleanBody.enquiryId}_${cleanBody.quotationType}`;
      const docRef = adminDb.collection('quotations').doc(docId);
      const existing = await docRef.get();

      if (existing.exists) {
        // Already saved — return the existing ID without writing again
        return Response.json({ success: true, id: docId, duplicate: true });
      }

      await docRef.set({
        ...cleanBody,
        createdAt: FieldValue.serverTimestamp(),
      });

      return Response.json({ success: true, id: docId }, { status: 201 });
    }

    // Manual quotation — use auto-generated ID
    const docRef = await adminDb.collection('quotations').add({
      ...cleanBody,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
