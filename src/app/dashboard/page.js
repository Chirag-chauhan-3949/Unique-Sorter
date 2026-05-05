'use client';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';

export default function DashboardPage() {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div className="card" style={{ padding: '48px 64px', textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(26,55,170,0.1)',
              borderTop: '4px solid #1A37AA',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: '14px', color: 'var(--text-muted)' }}>
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdminUser = isAdmin(userRole);

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ padding: '24px 0' }}>
        {/* Welcome Section */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: isAdminUser ? 'rgba(26,55,170,0.1)' : 'rgba(82,186,79,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              {isAdminUser ? '👑' : '👤'}
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}>
                Welcome back, {user?.name || 'User'}
              </h1>
              <p style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: '14px',
                color: 'var(--text-muted)',
              }}>
                You're logged in as <strong>{isAdminUser ? 'Administrator' : 'User'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Under Development */}
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
          <h2 style={{
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Under Development
          </h2>
          <p style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}>
            The dashboard overview is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
