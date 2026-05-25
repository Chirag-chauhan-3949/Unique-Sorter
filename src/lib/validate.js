// Phone validation
export function isValidPhone(phone) {
  return typeof phone === 'string' && /^[6-9]\d{9}$/.test(phone);
}

// Sanitize string input (remove HTML tags)
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Validate enquiry body - whitelist allowed fields
export function validateEnquiryBody(body) {
  const allowed = ['name', 'customerName', 'phone', 'mobile', 'email', 'company', 'companyName', 'gst', 'address', 'city', 'state', 'pincode', 'productInterest', 'model', 'size', 'capacity', 'commodity', 'quantity', 'source', 'message', 'notes', 'status', 'requirement', 'budget'];
  const cleaned = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      cleaned[key] = typeof body[key] === 'string' ? sanitize(body[key]) : body[key];
    }
  }
  return cleaned;
}

// Validate quotation body
export function validateQuotationBody(body) {
  const allowed = ['enquiryId', 'quotationType', 'customerName', 'companyName', 'phone', 'email', 'address', 'city', 'state', 'gst', 'items', 'terms', 'notes', 'total', 'discount', 'tax', 'grandTotal', 'validUntil', 'status', 'quotNo'];
  const cleaned = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      cleaned[key] = typeof body[key] === 'string' ? sanitize(body[key]) : body[key];
    }
  }
  return cleaned;
}
