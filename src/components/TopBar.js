'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';

const PAGE_META = {
  '/dashboard':             { title: 'Dashboard',   subtitle: 'Welcome back' },
  '/enquiry':               { title: 'Enquiry',     subtitle: 'Manage your leads & enquiries' },
  '/dashboard/quotations':  { title: 'Quotations',  subtitle: 'Create and track quotations' },
  '/dashboard/settings':    { title: 'Settings',    subtitle: 'Manage your preferences' },
  '/dashboard/reports':     { title: 'Reports',     subtitle: 'Analytics & insights' },
  '/dashboard/products':    { title: 'Products',    subtitle: 'Product catalogue' },
  '/dashboard/enquiry':     { title: 'Enquiries',   subtitle: 'All customer enquiries' },
};

// Helper to get initials from name
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userRole, logout, isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(false);
  const [hamburgerHover, setHamburgerHover] = useState(false);
  const profileRef = useRef(null);

  const meta = PAGE_META[pathname] || { title: 'Dashboard', subtitle: '' };

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openSidebar = () => {
    window.dispatchEvent(new CustomEvent('sidebar-open'));
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  const handleSettings = () => {
    setProfileOpen(false);
    router.push('/dashboard/settings');
  };

  const handleProfile = () => {
    setProfileOpen(false);
    // TODO: Navigate to profile page when created
  };

  // Get display info from auth context
  const userName = user?.name || 'User';
  const userInitials = getInitials(userName);
  const displayRole = isAdmin(userRole) ? 'Administrator' : 'User';
  const subtitleText = isAdmin(userRole) 
    ? `${meta.subtitle}, Administrator` 
    : `${meta.subtitle}`;

  // Show loading state
  if (isLoading) {
    return (
      <header className="navbar">
        <div className="navbar-left">
          <div className="navbar-title-group">
            <h1 className="navbar-title">Loading...</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar">
      {/* Left — hamburger (mobile only) + logo + page title */}
      <div className="navbar-left">

        {/* Hamburger — only rendered on mobile, lives inside navbar */}
        {isMobile && (
          <button
            onClick={openSidebar}
            onMouseEnter={() => setHamburgerHover(true)}
            onMouseLeave={() => setHamburgerHover(false)}
            aria-label="Open navigation"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: 8,
              background: hamburgerHover
                ? 'rgba(26,55,170,0.10)'
                : 'rgba(26,55,170,0.06)',
              border: '1px solid rgba(26,55,170,0.15)',
              cursor: 'pointer',
              padding: 0,
              marginRight: 12,
              flexShrink: 0,
              transition: 'background 0.18s ease',
            }}
          >
            <svg
              width="18" height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A37AA"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div className="navbar-title-group">
          <h1 className="navbar-title">{meta.title}</h1>
          {meta.subtitle && <span className="navbar-subtitle">{subtitleText}</span>}
        </div>
      </div>

      {/* Right — actions */}
      <div className="navbar-right">

        {/* Date chip */}
        <div className="navbar-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
          </svg>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <div className="navbar-divider" />

        {/* User profile */}
        <div className="navbar-dropdown-wrap" ref={profileRef}>
          <button
            className={`navbar-avatar-btn ${profileOpen ? 'navbar-avatar-btn--active' : ''}`}
            onClick={() => setProfileOpen(!profileOpen)}
            title="Profile"
          >
            <div className="navbar-avatar">{userInitials}</div>
            <div className="navbar-avatar-info">
              <span className="navbar-avatar-name">{userName}</span>
              <span className="navbar-avatar-role">{displayRole}</span>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div className="navbar-dropdown profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">{userInitials}</div>
                <div>
                  <p className="profile-dropdown-name">{userName}</p>
                  <p className="profile-dropdown-email">{user?.phone ? `+91 ${user.phone}` : ''}</p>
                </div>
              </div>
              <div className="profile-dropdown-divider" />
              <div className="profile-dropdown-menu">
                <button className="profile-menu-item" onClick={handleProfile}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  My Profile
                </button>
                {isAdmin(userRole) && (
                  <button className="profile-menu-item" onClick={handleSettings}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Settings
                  </button>
                )}
              </div>
              <div className="profile-dropdown-divider" />
              <button className="profile-menu-item profile-menu-item--danger" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
