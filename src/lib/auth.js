/**
 * Verify Firebase ID token from Authorization header.
 * Firebase ID tokens are verified server-side with the Admin SDK — no JWT secret needed.
 */
export async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const { adminAuth } = await import('@/lib/firebase-admin');
    if (!adminAuth) return { error: 'Auth service unavailable', status: 503 };

    const decoded = await adminAuth.verifyIdToken(token);
    return {
      user: {
        userId: decoded.userId || decoded.uid,
        phone: (decoded.phone_number || '').replace(/^\+91/, ''),
        role: (decoded.role || 'USER').toUpperCase(),
        uid: decoded.uid,
      },
    };
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return { error: 'Token expired. Please login again.', status: 401 };
    }
    return { error: 'Invalid token', status: 401 };
  }
}

/**
 * Verify auth and check if user is admin.
 */
export async function verifyAdmin(request) {
  const result = await verifyAuth(request);
  if (result.error) return result;
  if (result.user.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 };
  }
  return result;
}
