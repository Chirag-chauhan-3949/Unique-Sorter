'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ROLES, canAccessRoute, getRedirectPath } from '@/lib/rbac';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Decode JWT-format token (Firebase ID tokens are JWTs)
  const decodeToken = useCallback((token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const payload = decodeToken(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }, [decodeToken]);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    document.cookie = 'authToken=; path=/; max-age=0; SameSite=Strict';
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  // Schedule a proactive token refresh 5 minutes before expiry
  const scheduleRefresh = useCallback((idToken) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const payload = decodeToken(idToken);
    if (!payload?.exp) return;

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    const refreshIn = msUntilExpiry - 5 * 60 * 1000; // 5 min before expiry

    if (refreshIn <= 0) {
      // Already near expiry — refresh immediately
      doRefresh();
      return;
    }

    refreshTimerRef.current = setTimeout(doRefresh, refreshIn);
  }, [decodeToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Exchange refresh token for a new Firebase ID token
  const doRefresh = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) { logout(); return; }

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!res.ok) { logout(); return; }

      const data = await res.json();
      localStorage.setItem('authToken', data.idToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      document.cookie = 'authToken=' + data.idToken + '; path=/; max-age=3600; SameSite=Strict';
      scheduleRefresh(data.idToken);
    } catch {
      logout();
    }
  }, [logout, scheduleRefresh]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          if (isTokenExpired(token)) {
            // Try to refresh silently before giving up
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              doRefresh();
            } else {
              clearAuth();
            }
            return;
          }
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserRole(parsedUser.role?.toUpperCase() || ROLES.USER);
          setIsAuthenticated(true);
          scheduleRefresh(token);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // login — called after successful OTP verification
  // idToken: Firebase ID token (1h), refreshToken: Firebase refresh token (persistent)
  const login = useCallback((idToken, userData, refreshToken) => {
    const normalizedRole = userData.role?.toUpperCase() || ROLES.USER;

    localStorage.setItem('authToken', idToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    document.cookie = 'authToken=' + idToken + '; path=/; max-age=3600; SameSite=Strict';
    localStorage.setItem('user', JSON.stringify({ ...userData, role: normalizedRole }));

    setUser({ ...userData, role: normalizedRole });
    setUserRole(normalizedRole);
    setIsAuthenticated(true);
    scheduleRefresh(idToken);

    return normalizedRole;
  }, [scheduleRefresh]);

  // Returns auth headers synchronously — token is always fresh via the auto-refresh timer
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return {};
    if (isTokenExpired(token)) {
      doRefresh();
      return {};
    }
    return { Authorization: 'Bearer ' + token };
  }, [isTokenExpired, doRefresh]);

  // Route guard
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route)) || pathname === '/';

    // Only redirect unauthenticated users away from protected routes
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Only redirect authenticated users away from auth pages (login/register), not all public pages
    const authOnlyRoutes = ['/login', '/register'];
    const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname?.startsWith(route));
    if (isAuthenticated && isAuthOnlyRoute) {
      router.push(getRedirectPath(userRole));
      return;
    }

    if (isAuthenticated && pathname?.startsWith('/dashboard')) {
      if (userRole === ROLES.USER && pathname.startsWith('/dashboard/settings')) {
        router.push('/dashboard');
        return;
      }
      if (!canAccessRoute(userRole, pathname)) {
        router.push('/dashboard');
        return;
      }
      // Per-user screen access check (only for non-admin users with allowedScreens set)
      const screens = user?.allowedScreens;
      if (screens && userRole !== ROLES.ADMIN) {
        const pageKey = pathname.split('/')[2] || 'dashboard';
        if (!screens.includes(pageKey) && pageKey !== 'profile') {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [isAuthenticated, userRole, pathname, router, isLoading]);

  const value = {
    user,
    userRole,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
