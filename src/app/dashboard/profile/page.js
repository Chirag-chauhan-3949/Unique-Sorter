'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const CSS = `
  .prof-page { padding: 0; }

  .prof-header {
    position: relative;
    background: linear-gradient(135deg, #0f1d45 0%, #1A37AA 60%, #2e4fd0 100%);
    padding: 40px 24px 60px;
    overflow: hidden;
  }
  .prof-header::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at 70% 20%, rgba(255,255,255,0.08) 0%, transparent 60%),
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 50%);
    pointer-events: none;
  }
  .prof-header-inner {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 20px;
    max-width: 720px;
  }

  .prof-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    border: 3px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-poppins), Poppins, sans-serif;
    font-size: 24px; font-weight: 700; color: #fff;
    letter-spacing: 1px;
    flex-shrink: 0;
  }

  .prof-header-info { min-width: 0; }
  .prof-header-name {
    font-family: var(--font-poppins), Poppins, sans-serif;
    font-size: 22px; font-weight: 700; color: #fff;
    margin: 0 0 4px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .prof-header-role {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.1);
    padding: 3px 10px; border-radius: 20px;
  }
  .prof-header-role-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80;
  }

  .prof-body {
    max-width: 720px;
    margin: -32px auto 0;
    padding: 0 16px 32px;
    position: relative; z-index: 2;
  }

  .prof-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e8ecf4;
    box-shadow: 0 2px 12px rgba(15,25,69,0.06);
    overflow: hidden;
  }

  .prof-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  .prof-card-title {
    font-family: var(--font-poppins), Poppins, sans-serif;
    font-size: 15px; font-weight: 600; color: #0f1923;
  }

  .prof-edit-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 14px;
    border-radius: 6px;
    border: 1.5px solid #e2e8f2;
    background: #fff; color: #64748b;
    font-family: var(--font-inter), Inter, sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    transition: border-color .15s, color .15s, background .15s;
  }
  .prof-edit-btn:hover { border-color: #1A37AA; color: #1A37AA; background: #f0f4ff; }
  .prof-edit-btn.primary {
    border-color: #1A37AA; background: #1A37AA; color: #fff;
  }
  .prof-edit-btn.primary:hover { background: #162e8a; }
  .prof-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .prof-fields { padding: 8px 0; }

  .prof-field {
    display: flex; align-items: flex-start;
    padding: 14px 20px;
    gap: 12px;
    transition: background .15s;
  }
  .prof-field:not(:last-child) {
    border-bottom: 1px solid #f8fafc;
  }
  .prof-field-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: #f4f6fb;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .prof-field-content { flex: 1; min-width: 0; }
  .prof-field-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.4px; text-transform: uppercase;
    color: #94a3b8; margin-bottom: 3px;
  }
  .prof-field-value {
    font-size: 14px; font-weight: 500; color: #1e293b;
    word-break: break-word;
  }

  .prof-field-input {
    width: 100%; height: 36px; padding: 0 10px;
    border: 1.5px solid #e2e8f2; border-radius: 6px;
    background: #fff; color: #1e293b;
    font-family: var(--font-inter), Inter, sans-serif;
    font-size: 14px; font-weight: 500;
    outline: none; box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s;
  }
  .prof-field-input:focus {
    border-color: #1A37AA;
    box-shadow: 0 0 0 3px rgba(26,55,170,0.09);
  }

  .prof-actions {
    display: flex; gap: 8px; padding: 12px 20px 16px;
    border-top: 1px solid #f1f5f9;
  }

  .prof-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #0f1923; color: #fff;
    padding: 10px 20px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: prof-toast-in 0.3s ease-out;
  }
  @keyframes prof-toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* skeleton */
  @keyframes prof-shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .prof-skel {
    border-radius: 6px;
    background: linear-gradient(90deg, #e8ecf4 0%, #f4f6fb 40%, #e8ecf4 80%);
    background-size: 800px 100%;
    animation: prof-shimmer 1.6s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    .prof-header { padding: 28px 16px 48px; }
    .prof-header-inner { gap: 14px; }
    .prof-avatar { width: 56px; height: 56px; font-size: 19px; }
    .prof-header-name { font-size: 18px; }
    .prof-body { padding: 0 12px 24px; }
    .prof-field { padding: 12px 14px; }
    .prof-card-header { padding: 14px; }
    .prof-actions { padding: 10px 14px 14px; }
  }
`;

export default function ProfilePage() {
  const { user, userRole, getAuthHeaders } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.phone) return;
    fetch(`/api/profile/${user.phone}`, { headers: { ...getAuthHeaders() } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setProfile(d.data);
        else setProfile({ name: user.name, phone: user.phone, role: userRole, createdAt: null });
      })
      .catch(() => setProfile({ name: user.name, phone: user.phone, role: userRole, createdAt: null }))
      .finally(() => setLoading(false));
  }, [user]);

  const startEdit = () => {
    setNameVal(profile?.name || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setNameVal('');
  };

  const handleSave = async () => {
    if (!nameVal.trim() || nameVal.trim() === profile?.name) { cancelEdit(); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${user.phone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: nameVal.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setProfile(p => ({ ...p, name: nameVal.trim() }));
        // Update localStorage user
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.name = nameVal.trim();
        localStorage.setItem('user', JSON.stringify(stored));
        showToast('Name updated successfully');
      } else {
        showToast(d.message || 'Update failed');
      }
    } catch {
      showToast('Something went wrong');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const displayName = profile?.name || user?.name || 'User';
  const displayRole = isAdmin(profile?.role || userRole) ? 'Administrator' : 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="prof-page">
      <style>{CSS}</style>

      {/* Header banner */}
      <div className="prof-header">
        <div className="prof-header-inner">
          {loading ? (
            <>
              <div className="prof-skel" style={{ width: 72, height: 72, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="prof-skel" style={{ width: '50%', height: 22, marginBottom: 8 }} />
                <div className="prof-skel" style={{ width: 80, height: 22, borderRadius: 20 }} />
              </div>
            </>
          ) : (
            <>
              <div className="prof-avatar">{getInitials(displayName)}</div>
              <div className="prof-header-info">
                <h1 className="prof-header-name">{displayName}</h1>
                <span className="prof-header-role">
                  <span className="prof-header-role-dot" />
                  {displayRole}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body card */}
      <div className="prof-body">
        <div className="prof-card">
          <div className="prof-card-header">
            <span className="prof-card-title">Personal Information</span>
            {!loading && !editing && (
              <button className="prof-edit-btn" onClick={startEdit}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="prof-fields">
            {loading ? (
              [0,1,2,3].map(i => (
                <div className="prof-field" key={i}>
                  <div className="prof-skel" style={{ width: 36, height: 36, borderRadius: 8, animationDelay: `${i * 0.1}s` }} />
                  <div style={{ flex: 1 }}>
                    <div className="prof-skel" style={{ width: 60, height: 10, marginBottom: 8, animationDelay: `${i * 0.1}s` }} />
                    <div className="prof-skel" style={{ width: `${60 - i * 10}%`, height: 14, animationDelay: `${i * 0.1 + 0.05}s` }} />
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Name */}
                <div className="prof-field">
                  <div className="prof-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="prof-field-content">
                    <div className="prof-field-label">Full Name</div>
                    {editing ? (
                      <input
                        className="prof-field-input"
                        value={nameVal}
                        onChange={e => setNameVal(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
                      />
                    ) : (
                      <div className="prof-field-value">{displayName}</div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="prof-field">
                  <div className="prof-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="prof-field-content">
                    <div className="prof-field-label">Phone Number</div>
                    <div className="prof-field-value">+91 {displayPhone}</div>
                  </div>
                </div>

                {/* Role */}
                <div className="prof-field">
                  <div className="prof-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="prof-field-content">
                    <div className="prof-field-label">Role</div>
                    <div className="prof-field-value">{displayRole}</div>
                  </div>
                </div>

                {/* Join date */}
                <div className="prof-field">
                  <div className="prof-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="prof-field-content">
                    <div className="prof-field-label">Member Since</div>
                    <div className="prof-field-value">{joinDate || 'N/A'}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {editing && (
            <div className="prof-actions">
              <button className="prof-edit-btn primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="prof-edit-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="prof-toast">{toast}</div>}
    </div>
  );
}
