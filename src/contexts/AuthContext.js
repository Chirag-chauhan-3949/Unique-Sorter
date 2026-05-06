'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ROLES, canAccessRoute, getRedirectPath } from '@/lib/rbac';

// Create the Auth Context
const AuthContext = createContext(null);

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserRole(parsedUser.role?.toUpperCase() || ROLES.USER);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Clear authentication state
  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  }, []);

  // Login function - called after successful credential verification
  const login = useCallback((token, userData) => {
    const normalizedRole = userData.role?.toUpperCase() || ROLES.USER;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({
      ...userData,
      role: normalizedRole,
    }));
    
    setUser({ ...userData, role: normalizedRole });
    setUserRole(normalizedRole);
    setIsAuthenticated(true);
    
    return normalizedRole;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  // Check if user can access current route
  useEffect(() => {
    if (isLoading) return;
    
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
    
    // If not authenticated and trying to access protected route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }
    
    // If authenticated and trying to access login/register, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      const redirectPath = getRedirectPath(userRole);
      router.push(redirectPath);
      return;
    }
    
    // Check route access for authenticated users
    if (isAuthenticated && pathname && pathname.startsWith('/dashboard')) {
      // USER trying to access settings - redirect to dashboard
      if (userRole === ROLES.USER && pathname.startsWith('/dashboard/settings')) {
        router.push('/dashboard');
        return;
      }
      
      // Check if route is allowed
      if (!canAccessRoute(userRole, pathname)) {
        router.push('/dashboard');
        return;
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
