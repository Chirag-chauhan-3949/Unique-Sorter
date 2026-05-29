import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Unique Sorter CRM <onboarding@resend.dev>';
const ADMIN_EMAIL = 'chiragsinghchauhan3949323@gmail.com';

export async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message || JSON.stringify(error) };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// 1. Admin notification: new user registered (pending approval)
export async function notifyAdminNewRegistration({ name, phone, role }) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Registration Pending — ${name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#0c1a3a,#1A37AA);padding:20px 24px;border-radius:8px;margin-bottom:24px;">
          <h2 style="margin:0;color:#fff;font-size:18px;font-weight:700;">New Registration Request</h2>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">A new user has requested access to the CRM platform and is waiting for your approval.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;width:100px;">Name</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${name}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">Phone</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">+91 ${phone}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;">Role</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;">${role}</td></tr>
        </table>
        <a href="https://unique-sorter-one.vercel.app/dashboard/settings" style="display:inline-block;background:#1A37AA;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Review in Settings</a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Unique Sorter &amp; Equipment Pvt. Ltd.</p>
      </div>
    `,
  });
}

// 2. User notification: account approved
export async function notifyUserApproved({ name, phone, email }) {
  const to = email || `${phone}@sms.placeholder`;
  if (!email) return { success: false, error: 'No email on user account' };
  return sendEmail({
    to,
    subject: 'Your Account Has Been Approved — Unique Sorter CRM',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:20px 24px;border-radius:8px;margin-bottom:24px;">
          <h2 style="margin:0;color:#fff;font-size:18px;font-weight:700;">Account Approved!</h2>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Your account has been approved by an administrator. You can now log in to the Unique Sorter CRM platform using your phone number with OTP or password.</p>
        <a href="https://unique-sorter-one.vercel.app/login" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Login Now</a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Unique Sorter &amp; Equipment Pvt. Ltd.</p>
      </div>
    `,
  });
}

// 3. Admin notification: new enquiry submitted
export async function notifyAdminNewEnquiry({ customerName, millName, mobile, location, state, hasRequirement, items }) {
  const reqType = hasRequirement === true ? 'Immediate' : hasRequirement === false ? 'Future' : 'Not specified';
  const itemsList = (items || []).map(i => `${i.modelNo || '—'} ${i.size || '—'}ch x${i.qty || '—'}`).join(', ') || '—';
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Enquiry — ${customerName} (${millName || 'N/A'})`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#0c1a3a,#1A37AA);padding:20px 24px;border-radius:8px;margin-bottom:24px;">
          <h2 style="margin:0;color:#fff;font-size:18px;font-weight:700;">New Enquiry Submitted</h2>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">A field engineer has submitted a new enquiry.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;width:110px;">Customer</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${customerName}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${millName || '—'}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">Mobile</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">+91 ${mobile}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">Location</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${[location, state].filter(Boolean).join(', ') || '—'}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">Requirement</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${reqType}</td></tr>
          ${hasRequirement === true ? `<tr><td style="padding:10px 12px;color:#6b7280;font-size:13px;font-weight:600;">Items</td><td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500;">${itemsList}</td></tr>` : ''}
        </table>
        <a href="https://unique-sorter-one.vercel.app/dashboard/enquiry" style="display:inline-block;background:#1A37AA;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">View in Dashboard</a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Unique Sorter &amp; Equipment Pvt. Ltd.</p>
      </div>
    `,
  });
}
