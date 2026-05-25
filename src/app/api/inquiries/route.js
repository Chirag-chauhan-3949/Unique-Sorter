import { NextResponse } from 'next/server';
import { isFirebaseConfigured, checkFirestoreAccess } from '@/lib/firebase';
import backendDb from '@/lib/db';
import { verifyAuth, verifyAdmin } from '@/lib/auth';

// GET all inquiries
export async function GET(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    // Try Firebase first if configured and accessible
    if (isFirebaseConfigured) {
      try {
        const { db: firebaseDb } = await import('@/lib/firebase');
        const isAccessible = await checkFirestoreAccess();

        if (firebaseDb && isAccessible) {
          const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
          const inquiriesRef = collection(firebaseDb, 'inquiries');
          const q = query(inquiriesRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);

          const inquiries = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
          }));

          return NextResponse.json({
            success: true,
            inquiries,
            source: 'firebase',
          });
        }
      } catch (firebaseError) {
        console.error('Firebase get inquiries error, falling back to backend:', firebaseError.message);
      }
    }

    // Fall back to backend database
    const inquiries = backendDb.getAllInquiries().sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return NextResponse.json({
      success: true,
      inquiries,
      source: 'backend',
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new inquiry
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { customerName, phone, productInterest } = body;
    if (!customerName || !phone || !productInterest) {
      return NextResponse.json(
        { message: 'Customer name, phone, and product interest are required' },
        { status: 400 }
      );
    }

    // Step 1: Store in Backend FIRST
    const inquiry = backendDb.createInquiry({
      customerName,
      phone,
      productInterest,
      ...body,
    });

    // Step 2: Sync to Firebase if configured and accessible
    if (isFirebaseConfigured) {
      try {
        const { db: firebaseDb } = await import('@/lib/firebase');
        const isAccessible = await checkFirestoreAccess();

        if (firebaseDb && isAccessible) {
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
          const inquiryData = {
            ...body,
            status: 'new',
            backendId: inquiry.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await addDoc(collection(firebaseDb, 'inquiries'), inquiryData);
          console.log('Inquiry synced to Firebase:', inquiry.id);
        }
      } catch (firebaseError) {
        console.error('Firebase sync error (non-critical):', firebaseError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry created successfully',
      inquiry,
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update inquiry
export async function PUT(request) {
  try {
    const auth = verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Inquiry ID is required' },
        { status: 400 }
      );
    }

    // Update in backend
    const inquiry = backendDb.getAllInquiries().find(i => i.id === id);
    if (inquiry) {
      Object.assign(inquiry, updates, { updatedAt: new Date().toISOString() });
    }

    // Sync to Firebase if configured and accessible
    if (isFirebaseConfigured) {
      try {
        const { db: firebaseDb } = await import('@/lib/firebase');
        const isAccessible = await checkFirestoreAccess();

        if (firebaseDb && isAccessible) {
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
          const inquiryRef = doc(firebaseDb, 'inquiries', id);
          await updateDoc(inquiryRef, {
            ...updates,
            updatedAt: serverTimestamp(),
          });
          console.log('Inquiry updated in Firebase:', id);
        }
      } catch (firebaseError) {
        console.error('Firebase update error (non-critical):', firebaseError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry updated successfully',
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE inquiry
export async function DELETE(request) {
  try {
    const auth = verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Inquiry ID is required' },
        { status: 400 }
      );
    }

    // Delete from backend
    const inquiries = backendDb.getAllInquiries();
    const index = inquiries.findIndex(i => i.id === id);
    if (index > -1) {
      inquiries.splice(index, 1);
    }

    // Sync to Firebase if configured and accessible
    if (isFirebaseConfigured) {
      try {
        const { db: firebaseDb } = await import('@/lib/firebase');
        const isAccessible = await checkFirestoreAccess();

        if (firebaseDb && isAccessible) {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const inquiryRef = doc(firebaseDb, 'inquiries', id);
          await deleteDoc(inquiryRef);
          console.log('Inquiry deleted from Firebase:', id);
        }
      } catch (firebaseError) {
        console.error('Firebase delete error (non-critical):', firebaseError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
