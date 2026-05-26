'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, canAccessSettings } from '@/lib/rbac';
import { db as firebaseDb } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

/* ─── Loading State ─── */
function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid rgba(26,55,170,0.1)',
        borderTop: '4px solid #1A37AA',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Access Denied Component ─── */
function AccessDenied() {
  const router = useRouter();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2 style={{
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        fontSize: 24,
        fontWeight: 600,
        color: '#0f1923',
        marginBottom: 8,
      }}>Access Denied</h2>
      <p style={{
        fontSize: 15,
        color: '#5a6a7e',
        maxWidth: 400,
        lineHeight: 1.6,
        marginBottom: 24,
      }}>
        You don't have permission to access the settings page. This area is restricted to administrators only.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          padding: '12px 24px',
          background: '#1A37AA',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Go to Dashboard
      </button>
    </div>
  );
}


const SECTIONS = [
  { id: 'users',    label: 'User Management', icon: <IconUsers /> },
];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#1A37AA', '#0ea574', '#d4791a', '#9c3ab8', '#c2302e'];
function avatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

/* ─── icons ─── */
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ─── User Form Modal ─── */
const ALL_SCREENS = [
  { key: 'dashboard', label: 'Dashboard', locked: true },
  { key: 'enquiry', label: 'Enquiry' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'profile', label: 'Profile', locked: true },
  { key: 'reports', label: 'Reports' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'clients', label: 'Clients' },
];

function UserModal({ user, onSave, onClose }) {
  const isEdit = !!user?.id;
  const defaultScreens = ALL_SCREENS.map(s => s.key);
  const [form, setForm] = useState({
    name:     user?.name     || '',
    phone:    user?.phone    || '',
    password: '',
    role:     user?.role     || 'User',
    active:   user?.active   ?? true,
    allowedScreens: user?.allowedScreens || defaultScreens,
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                         e.name     = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone))          e.phone    = 'Enter a valid 10-digit number';
    if (!isEdit && form.password.length < 6)        e.password = 'Min 6 characters';
    if (isEdit && form.password && form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => { 
        // Pass all form data including password to parent
        onSave({ 
          ...form, 
          id: user?.id || Date.now(), 
          avatar: initials(form.name) 
        }); 
      }, 700);
    }, 800);
  };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalEyebrow}>{isEdit ? 'Edit User' : 'Add New User'}</p>
            <h2 style={styles.modalTitle}>{isEdit ? form.name || 'Edit User' : 'Create User Account'}</h2>
          </div>
          <button style={styles.modalClose} onClick={onClose}><IconClose /></button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>
          {/* Avatar preview */}
          <div style={styles.avatarPreview}>
            <div style={{ ...styles.avatarLg, background: avatarColor(user?.id || 99) }}>
              {form.name ? initials(form.name) : '?'}
            </div>
            <div>
              <p style={styles.avatarPreviewName}>{form.name || 'New User'}</p>
              <span style={{ ...styles.rolePill, ...(form.role === 'Admin' ? styles.rolePillAdmin : styles.rolePillUser) }}>
                {form.role === 'Admin' && <IconShield />} {form.role}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div style={styles.fieldGrid}>
            <Field label="Full Name" error={errors.name}>
              <input
                style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
                value={form.name} placeholder="e.g. Ashok Sharma"
                onChange={e => set('name', e.target.value)}
              />
            </Field>
            <Field label="Phone Number" error={errors.phone}>
              <div style={styles.inputWrap}>
                <span style={styles.inputPrefix}>+91</span>
                <input
                  style={{ ...styles.input, ...styles.inputWithPrefix, ...(errors.phone ? styles.inputError : {}) }}
                  value={form.phone} placeholder="9876543210" maxLength={10}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </Field>
            <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password}>
              <div style={styles.inputWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ ...styles.input, paddingRight: 40, ...(errors.password ? styles.inputError : {}) }}
                  value={form.password} placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
                  onChange={e => set('password', e.target.value)}
                />
                <button style={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </Field>
            <Field label="Role">
              <div style={styles.roleToggle}>
                {['Admin', 'User'].map(r => (
                  <button
                    key={r}
                    style={{ ...styles.roleOption, ...(form.role === r ? styles.roleOptionActive : {}) }}
                    onClick={() => set('role', r)}
                  >
                    {r === 'Admin' && <IconShield />} {r}
                  </button>
                ))}
              </div>
            </Field>

            {form.role === 'User' && (
              <Field label="Screen Access">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_SCREENS.map(s => {
                    const checked = form.allowedScreens.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={s.locked}
                        onClick={() => {
                          if (s.locked) return;
                          setForm(f => ({
                            ...f,
                            allowedScreens: checked
                              ? f.allowedScreens.filter(k => k !== s.key)
                              : [...f.allowedScreens, s.key],
                          }));
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 11px', borderRadius: 7,
                          border: `1.5px solid ${checked ? '#1A37AA' : '#e8ecf4'}`,
                          background: checked ? 'rgba(26,55,170,0.08)' : '#f8f9fc',
                          color: checked ? '#1A37AA' : s.locked ? '#b0b8c8' : '#5a6a7e',
                          fontSize: 12, fontWeight: 600, cursor: s.locked ? 'default' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          opacity: s.locked ? 0.7 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{
                          width: 14, height: 14, borderRadius: 3,
                          border: `1.5px solid ${checked ? '#1A37AA' : '#cbd5e1'}`,
                          background: checked ? '#1A37AA' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {checked && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        {s.label}
                        {s.locked && <span style={{ fontSize: 9, color: '#94a3b8' }}>(always on)</span>}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <button style={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.btnPrimary, ...(saved ? styles.btnSuccess : {}) }} onClick={handleSave} disabled={saving || saved}>
            {saving ? <Spinner /> : saved ? <><IconCheck /> Saved!</> : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <p style={styles.fieldError}>{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirm({ user, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const go = () => { setDeleting(true); setTimeout(() => onConfirm(user.id), 800); };
  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxWidth: 400 }}>
        <div style={styles.deleteIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 style={styles.deleteTitle}>Remove User?</h3>
        <p style={styles.deleteDesc}>
          <strong>{user.name}</strong> will be permanently removed from the system. This action cannot be undone.
        </p>
        <div style={{ ...styles.modalFooter, borderTop: 'none', paddingTop: 0 }}>
          <button style={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button style={styles.btnDanger} onClick={go} disabled={deleting}>
            {deleting ? <Spinner /> : 'Remove User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SettingsPage() {
  const { userRole, isLoading } = useAuth();
  const [activeSection] = useState('users');
  const [users, setUsers]       = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [modal, setModal]       = useState(null);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast]       = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check authorization on mount
  useEffect(() => {
    if (!isLoading && userRole) {
      setIsAuthorized(canAccessSettings(userRole));
    }
  }, [userRole, isLoading]);

  // Load users from Firestore on mount
  useEffect(() => {
    if (!isAuthorized) return;
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        if (firebaseDb) {
          const snapshot = await getDocs(collection(firebaseDb, 'userdata'));
          const fetched = snapshot.docs.map(d => {
            const data = d.data();
            const name = data.name || '';
            return {
              id: data.id || d.id,
              name,
              phone: data.phone || d.id,
              role: data.role ? (data.role.charAt(0).toUpperCase() + data.role.slice(1).toLowerCase()) : 'User',
              active: data.active !== undefined ? data.active : true,
              allowedScreens: data.allowedScreens || null,
              avatar: name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
            };
          });
          setUsers(fetched);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, [isAuthorized]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = u.name.toLowerCase().includes(q) || u.phone.includes(q);
    const matchR = roleFilter === 'All' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const handleSave = async (data) => {
    // Edit existing user
    if (data.id && users.find(u => u.id === data.id)) {
      try {
        if (firebaseDb) {
          const updatePayload = {
            name: data.name,
            role: data.role.toLowerCase(),
            active: data.active,
            allowedScreens: data.allowedScreens || null,
            syncedAt: serverTimestamp(),
          };
          if (data.password) updatePayload.password = data.password;
          await setDoc(doc(firebaseDb, 'userdata', data.phone), updatePayload, { merge: true });
        }
        setUsers(us => us.map(u => u.id === data.id ? { ...u, ...data } : u));
        showToast('User updated successfully');
      } catch (error) {
        console.error('Error updating user:', error);
        showToast('Failed to update user: ' + error.message, 'error');
      }
      setModal(null);
      return;
    }

    // Create new user via API so it's stored in both backend DB and Firebase
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          password: data.password,
          role: data.role.toLowerCase(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || 'Failed to create user', 'error');
        setModal(null);
        return;
      }

      const newUser = {
        ...data,
        id: json.user.id,
        active: true,
        avatar: data.name ? data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
      };
      setUsers(us => [...us, newUser]);
      showToast('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Failed to create user: ' + error.message, 'error');
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    const target = users.find(u => u.id === id);
    try {
      if (firebaseDb && target?.phone) {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(firebaseDb, 'userdata', target.phone));
      }
      setUsers(us => us.filter(u => u.id !== id));
      showToast('User removed', 'info');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to remove user: ' + err.message, 'error');
    }
    setModal(null);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show access denied for non-admin users
  if (!isAuthorized) {
    return <AccessDenied />;
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translateY(8px); } }
        .user-row:hover { background: #f7f9fd !important; }
        .row-actions { opacity: 1; }
        .action-btn:hover { background: #eef2fb !important; color: #1A37AA !important; }
        .action-btn-del:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .filter-btn:hover { border-color: #1A37AA !important; color: #1A37AA !important; }
        .filter-btn.active { background: #1A37AA !important; color: #fff !important; border-color: #1A37AA !important; }

        /* ── Responsive table ── */
        @media (max-width: 700px) {
          .settings-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .settings-toolbar { flex-wrap: wrap !important; gap: 8px !important; }
          .settings-toolbar > div:first-child { flex: 1 1 100% !important; }

          /* hide desktop table header */
          .table-head { display: none !important; }

          /* each row: single tight line, no forced width */
          .user-row { min-width: 0 !important; padding: 10px 14px !important; gap: 7px !important; }

          /* user col: grows, truncates, hides the ID meta */
          .col-user { flex: 1 1 0 !important; min-width: 0 !important; max-width: none !important; gap: 8px !important; }
          .col-user .user-table-meta { display: none !important; }
          .col-user .avatar-mob { width: 28px !important; height: 28px !important; border-radius: 7px !important; font-size: 10px !important; flex-shrink: 0 !important; }
          .user-table-name { font-size: 13px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }

          /* role: tighten pill */
          .col-role { flex: 0 0 auto !important; }
          .col-role .role-pill-inner { padding: 2px 7px !important; font-size: 10px !important; gap: 3px !important; }
          .col-role .role-pill-inner svg { width: 10px !important; height: 10px !important; }

          /* actions: smaller buttons */
          .col-actions { flex: 0 0 auto !important; gap: 3px !important; }
          .col-actions .action-btn { width: 26px !important; height: 26px !important; border-radius: 6px !important; }
        }
      `}</style>

      <div style={styles.root}>
        {/* Page header */}
        <div style={styles.pageHeader} className="settings-header-row">
          <div>
            <p style={styles.pageEyebrow}>Platform Configuration</p>
            <h1 style={styles.pageTitle}>Settings</h1>
          </div>
        </div>

        {/* Section nav (horizontal pills) */}
        <div style={styles.sectionNav}>
          {SECTIONS.map(s => (
            <div key={s.id} style={{ ...styles.sectionPill, ...(activeSection === s.id ? styles.sectionPillActive : {}) }}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>

        {/* ── User Management ── */}
        <div style={styles.card}>
          {/* Card header */}
          <div style={styles.cardHeader} className="settings-header-row">
            <div style={styles.cardHeaderLeft}>
              <div style={styles.cardIconWrap}><IconUsers /></div>
              <div>
                <h2 style={styles.cardTitle}>User Management</h2>
                <p style={styles.cardSubtitle}>{users.length} team member{users.length !== 1 ? 's' : ''} · {users.filter(u => u.role === 'Admin').length} admin{users.filter(u => u.role === 'Admin').length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button style={styles.btnPrimary} onClick={() => setModal({ type: 'add' })}>
              <IconPlus /> Add User
            </button>
          </div>

          {/* Toolbar */}
          <div style={styles.toolbar} className="settings-toolbar">
            <div style={styles.searchWrap}>
              <svg style={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8898aa" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                style={styles.searchInput}
                placeholder="Search by name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={styles.filterGroup}>
              {['All', 'Admin', 'User'].map(r => (
                <button
                  key={r}
                  className={`filter-btn${roleFilter === r ? ' active' : ''}`}
                  style={styles.filterBtn}
                  onClick={() => setRoleFilter(r)}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            {/* Head */}
            <div style={styles.tableHead} className="table-head">
              <span style={{ flex: '1 1 200px' }}>User</span>
              <span style={{ flex: '0 0 100px' }}>Role</span>
              <span style={{ flex: '0 0 90px', textAlign: 'right' }}>Actions</span>
            </div>

            {/* Rows */}
            {usersLoading ? (
              <div style={styles.emptyState}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading users…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c8d0dc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 10 }}>No users found</p>
              </div>
            ) : filtered.map((u, i) => (
              <div
                key={u.id}
                className="user-row"
                style={{ ...styles.tableRow, animationDelay: `${i * 60}ms` }}
              >
                {/* User */}
                <div className="col-user" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div className="avatar-mob" style={{ ...styles.avatarSm, background: avatarColor(u.id) }}>{u.avatar}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={styles.userName} className="user-table-name">{u.name}</p>
                    <p style={styles.userMeta} className="user-table-meta">ID #{String(u.id).padStart(4, '0')}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="col-role" style={{ flex: '0 0 100px' }}>
                  <span className="role-pill-inner" style={{ ...styles.rolePill, ...(u.role === 'Admin' ? styles.rolePillAdmin : styles.rolePillUser) }}>
                    {u.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-actions row-actions" style={{ flex: '0 0 90px', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <button
                    className="action-btn"
                    style={styles.actionBtn}
                    title="Edit"
                    onClick={() => setModal({ type: 'edit', user: u })}
                  ><IconEdit /></button>
                  <button
                    className="action-btn action-btn-del"
                    style={styles.actionBtn}
                    title="Remove"
                    onClick={() => setModal({ type: 'delete', user: u })}
                  ><IconTrash /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div style={styles.cardFooter}>
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'add'    && <UserModal user={null}       onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'edit'   && <UserModal user={modal.user} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteConfirm user={modal.user} onConfirm={handleDelete} onClose={() => setModal(null)} />}

      {/* Toast */}
      {toast && (
        <div style={{ 
          ...styles.toast, 
          background: toast.type === 'error' ? '#dc2626' : toast.type === 'info' ? '#1e3347' : '#0f1923' 
        }}>
          {toast.type === 'success' && <span style={{ color: '#22c55e' }}><IconCheck /></span>}
          {toast.type === 'error' && (
            <span style={{ color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </span>
          )}
          {toast.msg}
        </div>
      )}
    </>
  );
}

/* ─── Styles ─── */
const styles = {
  root: {
    padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 24px) 48px',
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: "var(--font-inter), 'Inter', sans-serif",
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  pageEyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#1A37AA',
    marginBottom: 4,
  },
  pageTitle: {
    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
    fontSize: 'clamp(22px, 4vw, 30px)',
    fontWeight: 600,
    color: '#0f1923',
    letterSpacing: '-0.5px',
    lineHeight: 1.15,
  },
  sectionNav: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  sectionPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#5a6a7e',
    background: '#fff',
    border: '1px solid #e8ecf4',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  sectionPillActive: {
    background: '#1A37AA',
    color: '#fff',
    border: '1px solid #1A37AA',
    boxShadow: '0 4px 14px rgba(26,55,170,0.25)',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e8ecf4',
    boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
    overflow: 'hidden',
    animation: 'slideUp 0.4s cubic-bezier(0.4,0,0.2,1) both',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(14px,3vw,20px) clamp(14px,3vw,24px)',
    borderBottom: '1px solid #f0f4fa',
    gap: 12,
    flexWrap: 'wrap',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    background: 'rgba(26,55,170,0.08)',
    color: '#1A37AA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
    fontSize: 17,
    fontWeight: 600,
    color: '#0f1923',
    letterSpacing: '-0.2px',
    lineHeight: 1.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8898aa',
    marginTop: 2,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 'clamp(10px,2vw,14px) clamp(14px,3vw,24px)',
    borderBottom: '1px solid #f0f4fa',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 220px',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: 38,
    paddingLeft: 36,
    paddingRight: 12,
    borderRadius: 9,
    border: '1px solid #e8ecf4',
    background: '#f8f9fc',
    fontSize: 13,
    color: '#0f1923',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  filterGroup: {
    display: 'flex',
    gap: 6,
  },
  filterBtn: {
    height: 36,
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid #e8ecf4',
    background: '#fff',
    fontSize: 12,
    fontWeight: 600,
    color: '#5a6a7e',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#8898aa',
    borderBottom: '1px solid #f0f4fa',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 24px',
    borderBottom: '1px solid #f7f9fc',
    transition: 'background 0.12s',
    animation: 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1) both',
  },
  avatarSm: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.03em',
    flexShrink: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0f1923',
    lineHeight: 1.3,
  },
  userMeta: {
    fontSize: 11,
    color: '#8898aa',
    marginTop: 1,
  },
  phoneChip: {
    fontSize: 12,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.03em',
    color: '#5a6a7e',
  },
  rolePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 9px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  rolePillAdmin: {
    background: 'rgba(26,55,170,0.09)',
    color: '#1A37AA',
  },
  rolePillUser: {
    background: '#f1f5f9',
    color: '#475569',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #e8ecf4',
    background: '#f8f9fc',
    color: '#5a6a7e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.12s',
    flexShrink: 0,
  },
  cardFooter: {
    padding: '12px 24px',
    fontSize: 12,
    color: '#8898aa',
    borderTop: '1px solid #f0f4fa',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },

  /* ── Modal ── */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,18,30,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    animation: 'fadeIn 0.18s ease both',
  },
  modal: {
    background: '#fff',
    borderRadius: 18,
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 24px 64px rgba(10,18,30,0.22), 0 4px 16px rgba(10,18,30,0.1)',
    animation: 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1) both',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '22px 24px 18px',
    borderBottom: '1px solid #f0f4fa',
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#1A37AA',
    marginBottom: 3,
  },
  modalTitle: {
    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
    fontSize: 19,
    fontWeight: 600,
    color: '#0f1923',
    letterSpacing: '-0.3px',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: '1px solid #e8ecf4',
    background: '#f8f9fc',
    color: '#5a6a7e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 2,
  },
  modalBody: {
    padding: '20px 24px',
  },
  avatarPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 12,
    background: '#f8f9fc',
    border: '1px solid #f0f4fa',
    marginBottom: 22,
  },
  avatarLg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.03em',
    flexShrink: 0,
  },
  avatarPreviewName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f1923',
    lineHeight: 1.2,
    marginBottom: 5,
  },
  fieldGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5a6a7e',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    height: 42,
    padding: '0 14px',
    borderRadius: 10,
    border: '1.5px solid #e8ecf4',
    background: '#f8f9fc',
    fontSize: 14,
    color: '#0f1923',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputError: {
    borderColor: '#fca5a5',
    background: '#fef2f2',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputPrefix: {
    position: 'absolute',
    left: 14,
    fontSize: 13,
    fontWeight: 600,
    color: '#8898aa',
    pointerEvents: 'none',
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: '0.03em',
  },
  inputWithPrefix: {
    paddingLeft: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    background: 'none',
    border: 'none',
    color: '#8898aa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  fieldError: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: 500,
    marginTop: 1,
  },
  roleToggle: {
    display: 'flex',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    border: '1.5px solid #e8ecf4',
    background: '#f8f9fc',
    fontSize: 13,
    fontWeight: 600,
    color: '#5a6a7e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  roleOptionActive: {
    background: 'rgba(26,55,170,0.08)',
    border: '1.5px solid #1A37AA',
    color: '#1A37AA',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleOn:  { background: '#1A37AA' },
  toggleOff: { background: '#d1d5db' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  toggleThumbOn: { transform: 'translateX(20px)' },
  toggleLabel: { fontSize: 13, fontWeight: 500, color: '#5a6a7e' },

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '16px 24px 20px',
    borderTop: '1px solid #f0f4fa',
  },

  /* ── Buttons ── */
  btnPrimary: {
    height: 40,
    padding: '0 20px',
    borderRadius: 10,
    border: 'none',
    background: '#1A37AA',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 14px rgba(26,55,170,0.28)',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  btnSuccess: {
    background: '#16a34a',
    boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
  },
  btnGhost: {
    height: 40,
    padding: '0 18px',
    borderRadius: 10,
    border: '1.5px solid #e8ecf4',
    background: '#f8f9fc',
    color: '#5a6a7e',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  btnDanger: {
    height: 40,
    padding: '0 20px',
    borderRadius: 10,
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
  },

  /* ── Delete dialog ── */
  deleteIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '24px auto 16px',
  },
  deleteTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: '#0f1923',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteDesc: {
    fontSize: 13,
    color: '#5a6a7e',
    textAlign: 'center',
    lineHeight: 1.6,
    padding: '0 24px 20px',
  },

  /* ── Toast ── */
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 20px',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 8px 32px rgba(10,18,30,0.3)',
    zIndex: 2000,
    whiteSpace: 'nowrap',
    animation: 'toastIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both',
  },
};
