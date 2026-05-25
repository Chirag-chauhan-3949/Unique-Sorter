import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verify JWT token from request headers
 * @param {Request} request - The incoming request
 * @returns {{ user: object } | { error: string, status: number }}
 */
export function verifyAuth(request) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET not configured');
    return { error: 'Server configuration error', status: 500 };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { error: 'Token expired. Please login again.', status: 401 };
    }
    return { error: 'Invalid token', status: 401 };
  }
}

/**
 * Verify auth and check if user is admin
 */
export function verifyAdmin(request) {
  const result = verifyAuth(request);
  if (result.error) return result;
  if (result.user.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 };
  }
  return result;
}
