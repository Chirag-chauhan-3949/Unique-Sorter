'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';

// Navigation items with role-based access
const NAV = [
  {
    key: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    allowedRoles: ['ADMIN', 'USER'], // All roles can access
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'enquiry',
    href: '/dashboard/enquiry',
    label: 'Enquiry',
    exact: false,
    allowedRoles: ['ADMIN', 'USER'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'quotations',
    href: '/dashboard/quotations',
    label: 'Quotations',
    exact: false,
    allowedRoles: ['ADMIN', 'USER'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'settings',
    href: '/dashboard/settings',
    label: 'Settings',
    exact: false,
    allowedRoles: ['ADMIN'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1z" />
      </svg>
    ),
  },
];

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function Sidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user, userRole, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Auto-close mobile sidebar on resize to desktop
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // Listen for hamburger event dispatched by TopBar
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener('sidebar-open', handler);
    return () => window.removeEventListener('sidebar-open', handler);
  }, []);

  // Filter navigation items based on user role + per-user screen access
  const filteredNav = NAV.filter(item => {
    if (isLoading) return false;
    if (!userRole) return false;
    if (!item.allowedRoles.includes(userRole.toUpperCase())) return false;
    // Admins always see everything
    if (isAdmin(userRole)) return true;
    // If user has allowedScreens set, filter by it
    const screens = user?.allowedScreens;
    if (!screens) return true; // no restriction = show all
    return screens.includes(item.key);
  });

  // Show loading state or minimal sidebar while loading
  if (isLoading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ justifyContent: 'center' }}>
          <div className="sidebar-logo-mark">
            <Image
              src="/logo.png"
              alt="Unique Sorter Logo"
              width={140}
              height={60}
              style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-items">
            <div className="sidebar-item" style={{ opacity: 0.5 }}>
              <span className="sidebar-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <span className="sidebar-item-label">Loading...</span>
            </div>
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <>
      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
      >
        {/* Logo area */}
        <div className="sidebar-logo" style={{ justifyContent: 'center' }}>
          <div className="sidebar-logo-mark">
            <Image
              src="/logo.png"
              alt="Unique Sorter Logo"
              width={140}
              height={60}
              style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>

          {/* Mobile close button */}
          <button
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-items">
            {filteredNav.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {active && <span className="sidebar-item-indicator" />}
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Desktop collapse toggle — bottom of sidebar */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar-collapse-btn-inner">
            <span className="sidebar-collapse-btn-track">
              <span className="sidebar-collapse-btn-thumb">
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                  style={{
                    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
                    display: 'block',
                  }}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            </span>
            <span className="sidebar-collapse-btn-label">
              {collapsed ? 'Expand' : 'Collapse'}
            </span>
          </span>
        </button>
      </aside>
    </>
  );
}
