import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';

const FIELD_LABELS = {
  customerName:   'Customer Name',
  millName:       'Mill / Company Name',
  mobile:         'Mobile No.',
  email:          'Email Address',
  gst:            'GST No.',
  source:         'Lead Source',
  location:       'City / Location',
  state:          'State',
  address:        'Full Address',
  hasRequirement: 'Requirement Type',
  futureNote:     'Future Note',
  followUpDate:   'Follow-up Date',
  probableMonth:  'Probable Month of Order',
  orderChances:   '% Chances of Order',
  items:          'Items / Products',
};

function serialize(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes — Immediate' : 'No — Future';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function diffFields(oldData, newData) {
  const changed = [];
  for (const field of Object.keys(FIELD_LABELS)) {
    if (serialize(oldData[field]) !== serialize(newData[field])) {
      changed.push(FIELD_LABELS[field]);
    }
  }
  return changed;
}

export async function GET(request, { params }) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
    const { id } = await params;
    const doc = await adminDb.collection('enquiry').doc(id).get();
    if (!doc.exists) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    const data = doc.data();
    return Response.json({
      success: true,
      data: { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null },
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (!adminDb) return Response.json({ success: false, error: 'Database not configured. Changes saved locally only.' }, { status: 503 });
    const { id } = await params;
    const body = await request.json();
    const { id: _id, createdAt, _editedBy, ...fields } = body;

    const docRef = adminDb.collection('enquiry').doc(id);

    // Fetch current data to compute diff
    const snap = await docRef.get();
    if (!snap.exists) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    const oldData = snap.data();

    const changes = diffFields(oldData, fields);

    // Batch: update enquiry + write audit log entry
    const batch = adminDb.batch();
    batch.update(docRef, fields);

    if (changes.length > 0) {
      const logRef = docRef.collection('auditLog').doc();
      batch.set(logRef, {
        fields:    changes,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return Response.json({ success: true, changesCount: changes.length });
  } catch (error) {
    console.error('Error updating enquiry:', error);
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
    await adminDb.collection('enquiry').doc(id).delete();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
