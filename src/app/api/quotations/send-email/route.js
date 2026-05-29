import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error }, { status: auth.status });

    const body = await request.json();
    const { to, salutation, contact, company, quotNo, refNo, model, qty, basePrice, gstRate, gstAmt, total, commodity, payTerms, delivery, validity, warranty } = body;

    if (!to) return NextResponse.json({ message: 'Recipient email is required' }, { status: 400 });

    const fmtPrice = v => v ? '₹ ' + Number(v).toLocaleString('en-IN') : '—';

    const result = await sendEmail({
      to,
      subject: `Quotation ${quotNo || refNo || ''} — ${company || 'Unique Sorter'}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#fff;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0c1a3a,#1A37AA);padding:28px 32px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Quotation from Unique Sorter</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">UNIQUE SORTER &amp; EQUIPMENT PVT. LTD.</p>
          </div>

          <!-- Body -->
          <div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 6px;">Dear <strong>${salutation || ''} ${contact || 'Sir/Madam'}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Thank you for your interest. Please find below the details of our quotation for your requirement.</p>

            <!-- Quotation Reference -->
            <div style="background:#f8fafc;border:1px solid #e8ecf4;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Quotation No.</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${quotNo || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Reference No.</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${refNo || '—'}</td>
                </tr>
              </table>
            </div>

            <!-- Product Details -->
            <h3 style="color:#0f1923;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Product Details</h3>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr style="background:#f4f6fb;"><th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Description</th><th style="padding:10px 14px;text-align:right;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Details</th></tr>
              <tr><td style="padding:10px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">Model</td><td style="padding:10px 14px;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${model || '—'}</td></tr>
              <tr><td style="padding:10px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">Quantity</td><td style="padding:10px 14px;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${qty || '—'}</td></tr>
              <tr><td style="padding:10px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">Commodity</td><td style="padding:10px 14px;color:#111827;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${commodity || '—'}</td></tr>
            </table>

            <!-- Pricing -->
            <h3 style="color:#0f1923;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Pricing</h3>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr><td style="padding:10px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">Base Price (excl. GST)</td><td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${fmtPrice(basePrice)}</td></tr>
              <tr><td style="padding:10px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">GST @ ${gstRate || 18}%</td><td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${fmtPrice(gstAmt)}</td></tr>
              <tr style="background:#f0f4ff;"><td style="padding:12px 14px;color:#1A37AA;font-size:14px;font-weight:700;">Total Amount</td><td style="padding:12px 14px;color:#1A37AA;font-size:16px;font-weight:700;text-align:right;">${fmtPrice(total)}</td></tr>
            </table>

            <!-- Terms -->
            <h3 style="color:#0f1923;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Key Terms</h3>
            <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              ${payTerms ? `<tr><td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:600;border-bottom:1px solid #f3f4f6;width:100px;">Payment</td><td style="padding:8px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">${payTerms}</td></tr>` : ''}
              ${delivery ? `<tr><td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:600;border-bottom:1px solid #f3f4f6;">Delivery</td><td style="padding:8px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">${delivery}</td></tr>` : ''}
              ${validity ? `<tr><td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:600;border-bottom:1px solid #f3f4f6;">Validity</td><td style="padding:8px 14px;color:#374151;font-size:13px;border-bottom:1px solid #f3f4f6;">${validity} days</td></tr>` : ''}
              ${warranty ? `<tr><td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:600;">Warranty</td><td style="padding:8px 14px;color:#374151;font-size:13px;">${warranty}</td></tr>` : ''}
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 4px;">For the complete quotation with full terms and conditions, please refer to the attached PDF document.</p>
            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 24px;">For any queries, feel free to contact us.</p>

            <!-- Footer -->
            <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
              <p style="color:#111827;font-size:13px;font-weight:600;margin:0;">Unique Sorter &amp; Equipment Pvt. Ltd.</p>
              <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">raipur@uniquesorter.in &bull; www.uniquesorter.in</p>
            </div>
          </div>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: `Quotation sent to ${to}` });
    } else {
      return NextResponse.json({ success: false, message: result.error || 'Failed to send' }, { status: 500 });
    }
  } catch (error) {
    console.error('Send quotation email error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
