import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { notifyUserApproved } from '@/lib/email';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error }, { status: auth.status });

    const { name, phone, email } = await request.json();
    if (!name || !phone) return NextResponse.json({ message: 'Name and phone required' }, { status: 400 });

    const result = await notifyUserApproved({ name, phone, email });
    return NextResponse.json({ success: result.success, message: result.error || 'Notification sent' });
  } catch (error) {
    console.error('Notify approved error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
