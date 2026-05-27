'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';
import { mapEnquiryToForm, INIT } from '@/components/QuotationForm';

const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ── Drawer ────────────────────────────────────────────────────── */
function EnquiryDrawer({ row, onClose, onUpdated, onDeleted, userRole }) {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Check if user is admin
  const isAdminUser = isAdmin(userRole);

  const handleGenerateQuotation = async () => {
    if (!row?.id || generating) return;
    setGenerating(true);
    try {
      const mapped = mapEnquiryToForm(row);
      const base    = Math.round(parseFloat(mapped.basePrice) || 0);
      const gstRate = parseFloat(mapped.gstRate) || 0;
      const gstAmt  = Math.round(base * gstRate / 100);
      const total   = base + gstAmt;
      const payload = {
        enquiryId: row.id,
        quotationType: '1page',
        ...mapped,
        gstAmt,
        total,
        savedAt: new Date().toISOString(),
      };
      const res  = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const docId = data.id || `${row.id}_1page`;
      onClose();
      router.push(`/dashboard/quotations/${docId}`);
    } catch {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (row) { requestAnimationFrame(() => setVisible(true)); setDraft({ ...row }); setEditing(false); }
    else setVisible(false);
  }, [row]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { if (editing) { setEditing(false); setDraft({ ...row }); } else handleClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, row]);

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const setItem = (idx, key, val) => setDraft(d => {
    const items = [...(d.items || [])];
    items[idx] = { ...items[idx], [key]: val };
    return { ...d, items };
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/enquiry/${row.id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');
      handleClose();
      onDeleted(row.id);
    } catch (e) { setSaveErr(e.message); setConfirmDelete(false); }
    finally { setDeleting(false); }
  };

  const handleSave = async () => {
    setSaving(true); setSaveErr('');
    try {
      const res = await fetch(`/api/enquiry/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      onUpdated({ ...draft });
      setEditing(false);
    } catch (e) { setSaveErr(e.message); }
    finally { setSaving(false); }
  };

  if (!row) return null;

  const initials = (row.customerName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isImmediate = row.hasRequirement === true;

  return (
    <>
      <style>{`
        .eq-backdrop {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(8, 15, 28, 0.65);
          opacity: 0; transition: opacity 0.25s ease;
          backdrop-filter: blur(3px);
        }
        .eq-backdrop.eq-in { opacity: 1; }

        .eq-modal {
          position: fixed; top: 50%; left: 50%; z-index: 401;
          width: 820px; max-width: calc(100vw - 40px);
          max-height: calc(100vh - 56px);
          background: var(--bg);
          display: flex; flex-direction: column;
          border-radius: 18px;
          border: 1px solid var(--border);
          box-shadow: 0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04);
          transform: translate(-50%, -46%) scale(0.97);
          opacity: 0;
          transition: transform 0.28s cubic-bezier(0.34,1.2,0.64,1), opacity 0.22s ease;
          overflow: hidden;
        }
        .eq-modal.eq-in { transform: translate(-50%, -50%) scale(1); opacity: 1; }

        /* ── Header ── */
        .eq-head {
          flex-shrink: 0;
          background: var(--sidebar-bg);
          background-image: linear-gradient(135deg, #0d1829 0%, #111c2d 50%, #0e1f38 100%);
          padding: 26px 28px 22px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
          position: relative; overflow: hidden;
        }
        .eq-head::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 95% 50%, rgba(26,55,170,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .eq-head::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(26,55,170,0.4), rgba(82,186,79,0.2), transparent);
        }
        .eq-head-left { display: flex; align-items: center; gap: 18px; min-width: 0; position: relative; }
        .eq-avatar-wrap { position: relative; flex-shrink: 0; }
        .eq-avatar {
          width: 54px; height: 54px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #1A37AA 0%, #2549cc 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: #fff;
          font-family: var(--font-display);
          box-shadow: 0 4px 16px rgba(26,55,170,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
          letter-spacing: 0.5px;
        }
        .eq-avatar-ring {
          position: absolute; inset: -3px; border-radius: 17px;
          border: 1.5px solid rgba(26,55,170,0.35);
          pointer-events: none;
        }
        .eq-head-info { min-width: 0; }
        .eq-head-label {
          font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 5px; font-family: var(--font-body);
        }
        .eq-head-name {
          font-family: var(--font-display); font-size: 20px; font-weight: 700;
          color: #fff; line-height: 1.2; letter-spacing: -0.2px;
        }
        .eq-head-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; position: relative; }
        .eq-status-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 13px; border-radius: 99px;
          font-size: 12px; font-weight: 600; font-family: var(--font-body);
          letter-spacing: 0.2px;
        }
        .eq-status-badge.immediate {
          background: rgba(82,186,79,0.12); color: #4ecb4b;
          border: 1px solid rgba(82,186,79,0.25);
        }
        .eq-status-badge.future {
          background: rgba(232,160,32,0.1); color: #e8a020;
          border: 1px solid rgba(232,160,32,0.25);
        }
        .eq-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .eq-close {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .eq-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .eq-edit-btn {
          height: 34px; padding: 0 14px; border-radius: 9px;
          display: flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
          font-size: 12px; font-weight: 600; font-family: var(--font-body);
          transition: background 0.15s, color 0.15s;
        }
        .eq-edit-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .eq-edit-btn.active { background: rgba(26,55,170,0.3); color: #7aa0ff; border-color: rgba(26,55,170,0.4); }
        .eq-del-btn {
          height: 34px; padding: 0 12px; border-radius: 9px;
          display: flex; align-items: center; gap: 6px;
          color: rgba(220,80,80,0.7); background: rgba(220,80,80,0.07);
          border: 1px solid rgba(220,80,80,0.2); cursor: pointer;
          font-size: 12px; font-weight: 600; font-family: var(--font-body);
          transition: background 0.15s, color 0.15s;
        }
        .eq-del-btn:hover { background: rgba(220,80,80,0.14); color: #e05555; border-color: rgba(220,80,80,0.35); }
        .eq-del-btn.confirm { background: #c0392b; color: #fff; border-color: #c0392b; }

        /* ── Edit inputs ── */
        .eq-input {
          width: 100%; border: 1.5px solid var(--border); border-radius: 7px;
          padding: 7px 10px; font-size: 13px; font-family: var(--font-body);
          color: var(--text-primary); background: var(--bg);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          margin-top: 2px;
        }
        .eq-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26,55,170,0.1); }
        .eq-save-err { font-size: 12px; color: #c0392b; padding: 0 28px 10px; }

        /* ── Meta strip ── */
        .eq-meta-strip {
          flex-shrink: 0;
          display: flex; gap: 0;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .eq-meta-cell {
          flex: 1; padding: 12px 20px;
          display: flex; flex-direction: column; gap: 2px;
          border-right: 1px solid var(--border);
        }
        .eq-meta-cell:last-child { border-right: none; }
        .eq-meta-cell-lbl {
          font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
          text-transform: uppercase; color: var(--text-muted);
        }
        .eq-meta-cell-val {
          font-size: 13px; font-weight: 600; color: var(--text-primary);
          font-family: var(--font-body);
        }
        .eq-meta-cell-val.muted { color: var(--text-secondary); font-weight: 500; }

        /* ── Scroll body ── */
        .eq-body {
          flex: 1; overflow-y: auto; padding: 22px 28px 24px;
          display: flex; flex-direction: column; gap: 20px;
          scrollbar-width: thin; scrollbar-color: var(--border) transparent;
        }
        .eq-body::-webkit-scrollbar { width: 4px; }
        .eq-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* ── Section ── */
        .eq-section { display: flex; flex-direction: column; gap: 0; }
        .eq-section-head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .eq-section-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--blue-dim); border: 1px solid rgba(26,55,170,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--blue); flex-shrink: 0;
        }
        .eq-section-title {
          font-family: var(--font-display); font-size: 13px; font-weight: 700;
          color: var(--text-primary); letter-spacing: 0.1px;
        }
        .eq-section-line { flex: 1; height: 1px; background: var(--border); }

        /* ── Fields grid ── */
        .eq-fields {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
        }
        .eq-fields-row {
          display: grid; grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
        }
        .eq-fields-row:last-child { border-bottom: none; }
        .eq-fields-row.single { grid-template-columns: 1fr; }
        .eq-field {
          padding: 14px 18px;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 5px;
        }
        .eq-field:last-child { border-right: none; }
        .eq-field-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
          text-transform: uppercase; color: var(--text-muted);
        }
        .eq-field-icon { color: var(--blue); opacity: 0.7; flex-shrink: 0; }
        .eq-field-value {
          font-size: 14px; font-weight: 500; color: var(--text-primary);
          line-height: 1.5; padding-left: 22px;
        }
        .eq-field-value.muted { color: var(--text-secondary); font-weight: 400; }

        /* ── Item cards ── */
        .eq-items { display: flex; flex-direction: column; gap: 10px; }
        .eq-item {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
        }
        .eq-item-head {
          padding: 10px 16px 9px;
          background: linear-gradient(90deg, var(--sidebar-bg), #0f1e33);
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .eq-item-num {
          font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: rgba(255,255,255,0.45);
          font-family: var(--font-body);
        }
        .eq-item-badge {
          font-size: 11px; font-weight: 600; color: rgba(26,55,170,0.8);
          background: rgba(26,55,170,0.1); border: 1px solid rgba(26,55,170,0.2);
          padding: 2px 9px; border-radius: 99px;
        }
        .eq-item-body { display: grid; grid-template-columns: repeat(4,1fr); }
        .eq-item-cell {
          padding: 14px 16px; border-right: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 4px;
        }
        .eq-item-cell:last-child { border-right: none; }
        .eq-item-cell-lbl {
          font-size: 10px; font-weight: 700; letter-spacing: 0.7px;
          text-transform: uppercase; color: var(--text-muted);
        }
        .eq-item-cell-val { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .eq-item-cell-val.accent {
          font-size: 15px; font-weight: 700; color: var(--blue);
          background: var(--blue-dim); border: 1px solid rgba(26,55,170,0.18);
          border-radius: 6px; padding: 4px 10px; display: inline-block;
          font-family: var(--font-body); line-height: 1.4;
        }
        .eq-item-cell-val.sub { color: var(--text-secondary); font-weight: 400; font-size: 13px; }

        /* ── Future layout ── */
        .eq-future { display: flex; flex-direction: column; gap: 12px; }
        .eq-future-note {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 18px;
        }
        .eq-future-note-lbl {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
          text-transform: uppercase; color: var(--text-muted); margin-bottom: 7px;
        }
        .eq-future-note-val { font-size: 14px; color: var(--text-secondary); line-height: 1.65; }
        .eq-future-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .eq-future-stat {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 6px;
          position: relative; overflow: hidden;
        }
        .eq-future-stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--blue), rgba(26,55,170,0.2));
        }
        .eq-future-stat-val {
          font-size: 24px; font-weight: 800; color: var(--blue);
          font-family: var(--font-display); line-height: 1;
        }
        .eq-future-stat-lbl {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
          text-transform: uppercase; color: var(--text-muted);
        }

        /* ── Footer ── */
        .eq-footer {
          flex-shrink: 0; padding: 16px 28px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .eq-footer-meta { display: flex; flex-direction: column; gap: 2px; }
        .eq-footer-label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); }
        .eq-footer-date { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .eq-gen-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 22px; border-radius: 10px;
          background: linear-gradient(135deg, #1A37AA 0%, #2549cc 100%);
          color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(26,55,170,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: box-shadow 0.15s, transform 0.12s;
          letter-spacing: 0.1px;
        }
        .eq-gen-btn:hover {
          box-shadow: 0 6px 24px rgba(26,55,170,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .eq-gen-btn:active { transform: translateY(0); }
        .eq-gen-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Drawer Responsive ── */
        @media (max-width: 767px) {
          .eq-modal {
            width: calc(100vw - 16px) !important;
            max-width: none !important;
            max-height: calc(100vh - 24px);
            border-radius: 14px;
          }
          .eq-head {
            padding: 18px 16px 16px;
            flex-wrap: wrap;
            gap: 12px;
          }
          .eq-head-left { gap: 12px; }
          .eq-avatar { width: 42px; height: 42px; font-size: 15px; border-radius: 11px; }
          .eq-avatar-ring { inset: -3px; border-radius: 14px; }
          .eq-head-name { font-size: 17px; }
          .eq-head-right {
            width: 100%;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 8px;
          }
          .eq-status-badge { font-size: 11px; padding: 5px 10px; }
          .eq-edit-btn, .eq-del-btn, .eq-close {
            height: 36px;
            min-height: 36px;
          }
          .eq-meta-strip {
            flex-direction: column;
            gap: 0;
          }
          .eq-meta-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            padding: 10px 16px;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .eq-meta-cell:last-child { border-bottom: none; }
          .eq-body { padding: 16px 16px 20px; gap: 16px; }
          .eq-fields-row {
            grid-template-columns: 1fr !important;
          }
          .eq-field {
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            padding: 12px 14px;
          }
          .eq-field:last-child { border-bottom: none; }
          .eq-item-body {
            grid-template-columns: 1fr 1fr !important;
          }
          .eq-item-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--border);
          }
          .eq-item-cell:last-child { border-bottom: none; }
          .eq-future-stats {
            grid-template-columns: 1fr !important;
          }
          .eq-footer {
            flex-direction: column;
            padding: 14px 16px;
            gap: 12px;
            align-items: stretch;
          }
          .eq-gen-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 20px;
          }
        }

        @media (max-width: 479px) {
          .eq-modal {
            width: calc(100vw - 8px) !important;
            max-height: calc(100vh - 16px);
            border-radius: 12px;
          }
          .eq-head { padding: 14px 12px 14px; }
          .eq-head-name { font-size: 15px; }
          .eq-avatar { width: 36px; height: 36px; font-size: 13px; }
          .eq-meta-cell { padding: 8px 12px; }
          .eq-meta-cell-lbl { font-size: 9px; }
          .eq-meta-cell-val { font-size: 12px; }
          .eq-body { padding: 12px 12px 16px; }
          .eq-item-body {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div className={`eq-backdrop ${visible ? 'eq-in' : ''}`} onClick={handleClose} />

      {/* Modal */}
      <div className={`eq-modal ${visible ? 'eq-in' : ''}`} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="eq-head">
          <div className="eq-head-left">
            <div className="eq-avatar-wrap">
              <div className="eq-avatar">{initials}</div>
              <div className="eq-avatar-ring" />
            </div>
            <div className="eq-head-info">
              <div className="eq-head-label">Enquiry Detail</div>
              <div className="eq-head-name">{row.customerName}</div>
            </div>
          </div>
          <div className="eq-head-right">
            {confirmDelete ? (
              <>
                <button className="eq-del-btn confirm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button className="eq-edit-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            ) : (
              <button className="eq-del-btn" onClick={() => { setConfirmDelete(true); setEditing(false); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            )}
            <button className={`eq-edit-btn ${editing ? 'active' : ''}`} onClick={() => { setEditing(!editing); setSaveErr(''); setDraft({ ...row }); setConfirmDelete(false); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button className="eq-close" onClick={handleClose}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Quick meta strip ── */}
        <div className="eq-meta-strip">
          <div className="eq-meta-cell">
            <span className="eq-meta-cell-lbl">Mill / Company</span>
            <span className="eq-meta-cell-val">{row.millName || '—'}</span>
          </div>
          <div className="eq-meta-cell">
            <span className="eq-meta-cell-lbl">Mobile</span>
            <span className="eq-meta-cell-val muted">{row.mobile || '—'}</span>
          </div>
          <div className="eq-meta-cell">
            <span className="eq-meta-cell-lbl">Location</span>
            <span className="eq-meta-cell-val muted">{[row.location, row.state].filter(Boolean).join(', ') || '—'}</span>
          </div>
          <div className="eq-meta-cell">
            <span className="eq-meta-cell-lbl">Requirement</span>
            <span className={`eq-meta-cell-val ${isImmediate ? '' : 'muted'}`}
              style={{ color: isImmediate ? '#4ecb4b' : '#e8a020', fontWeight: 600 }}>
              {isImmediate ? 'Immediate' : 'Future'}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="eq-body">

          {/* Contact & Location */}
          <div className="eq-section">
            <div className="eq-section-head">
              <div className="eq-section-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="eq-section-title">Contact & Location</span>
              <div className="eq-section-line" />
            </div>
            <div className="eq-fields">
              <div className="eq-fields-row">
                <div className="eq-field">
                  <span className="eq-field-label">
                    <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 2.18 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 10.09a16 16 0 0 0 7 7l1.46-1.42a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z"/>
                    </svg>
                    Mobile
                  </span>
                  {editing ? <input className="eq-input" value={draft.mobile || ''} onChange={e => set('mobile', e.target.value)} /> : <span className="eq-field-value">{draft.mobile || '—'}</span>}
                </div>
                <div className="eq-field">
                  <span className="eq-field-label">
                    <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email
                  </span>
                  {editing ? <input className="eq-input" value={draft.email || ''} onChange={e => set('email', e.target.value)} /> : <span className="eq-field-value muted">{draft.email || '—'}</span>}
                </div>
              </div>
              <div className="eq-fields-row">
                <div className="eq-field">
                  <span className="eq-field-label">
                    <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                    GST No.
                  </span>
                  {editing ? <input className="eq-input" value={draft.gst || ''} onChange={e => set('gst', e.target.value)} /> : <span className="eq-field-value muted">{draft.gst || '—'}</span>}
                </div>
                <div className="eq-field">
                  <span className="eq-field-label">
                    <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    State
                  </span>
                  {editing ? <input className="eq-input" value={draft.state || ''} onChange={e => set('state', e.target.value)} /> : <span className="eq-field-value muted">{draft.state || '—'}</span>}
                </div>
              </div>
              <div className="eq-fields-row single">
                <div className="eq-field">
                  <span className="eq-field-label">
                    <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    Address
                  </span>
                  {editing ? <input className="eq-input" value={draft.address || ''} onChange={e => set('address', e.target.value)} /> : <span className="eq-field-value muted">{draft.address || '—'}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Commodity & Remarks */}
          {(row.commodity || row.remarks || editing) && (
            <div className="eq-section">
              <div className="eq-section-head">
                <div className="eq-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                </div>
                <span className="eq-section-title">Commodity & Remarks</span>
                <div className="eq-section-line" />
              </div>
              <div className="eq-fields">
                <div className="eq-fields-row single">
                  <div className="eq-field">
                    <span className="eq-field-label">
                      <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      Commodity
                    </span>
                    {editing ? (
                      <select className="eq-input" value={draft.commodity || ''} onChange={e => set('commodity', e.target.value)}>
                        <option value="">Select commodity</option>
                        {['Rice', 'Pulses', 'Multiproduct', 'Tuvar Dal', 'Moong Dal'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span className="eq-field-value">{draft.commodity || '—'}</span>
                    )}
                  </div>
                </div>
                <div className="eq-fields-row single">
                  <div className="eq-field">
                    <span className="eq-field-label">
                      <svg className="eq-field-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Remarks
                    </span>
                    {editing ? (
                      <textarea className="eq-input" rows={3} value={draft.remarks || ''} onChange={e => set('remarks', e.target.value)} style={{ resize: 'vertical', height: 'auto', minHeight: 72 }} />
                    ) : (
                      <span className="eq-field-value muted">{draft.remarks || '—'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Requirement */}
          <div className="eq-section">
            <div className="eq-section-head">
              <div className="eq-section-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <span className="eq-section-title">Requirement</span>
              <div className="eq-section-line" />
            </div>

            {isImmediate && draft.items?.length > 0 ? (
              <div className="eq-items">
                {draft.items.map((item, idx) => (
                  <div key={idx} className="eq-item">
                    <div className="eq-item-head">
                      <span className="eq-item-num">Item {idx + 1}</span>
                      {item.price && <span className="eq-item-badge">{item.price}</span>}
                    </div>
                    <div className="eq-item-body">
                      <div className="eq-item-cell">
                        <span className="eq-item-cell-lbl">Model</span>
                        {editing ? <input className="eq-input" value={item.modelNo || ''} onChange={e => setItem(idx, 'modelNo', e.target.value)} /> : <span className="eq-item-cell-val">{item.modelNo || '—'}</span>}
                      </div>
                      <div className="eq-item-cell">
                        <span className="eq-item-cell-lbl">Size</span>
                        {editing ? <input className="eq-input" value={item.size || ''} onChange={e => setItem(idx, 'size', e.target.value)} /> : <span className="eq-item-cell-val sub">{item.size || '—'}</span>}
                      </div>
                      <div className="eq-item-cell">
                        <span className="eq-item-cell-lbl">Qty</span>
                        {editing ? <input className="eq-input" value={item.qty || ''} onChange={e => setItem(idx, 'qty', e.target.value)} /> : <span className="eq-item-cell-val accent">{item.qty || '—'}</span>}
                      </div>
                      <div className="eq-item-cell">
                        <span className="eq-item-cell-lbl">Price</span>
                        <span className="eq-item-cell-val sub">{item.price || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="eq-future">
                <div className="eq-future-note">
                  <div className="eq-future-note-lbl">Notes</div>
                  {editing ? <textarea className="eq-input" rows={3} value={draft.futureNote || ''} onChange={e => set('futureNote', e.target.value)} style={{ resize: 'vertical' }} /> : <div className="eq-future-note-val">{draft.futureNote || '—'}</div>}
                </div>
                <div className="eq-future-stats">
                  <div className="eq-future-stat">
                    {editing ? (
                      <><span className="eq-future-stat-lbl" style={{marginBottom:4}}>Follow-up Date</span><input className="eq-input" type="date" value={draft.followUpDate || ''} onChange={e => set('followUpDate', e.target.value)} /></>
                    ) : (
                      <><span className="eq-future-stat-val" style={{ fontSize: 16, fontWeight: 700 }}>{draft.followUpDate || '—'}</span><span className="eq-future-stat-lbl">Follow-up Date</span></>
                    )}
                  </div>
                  <div className="eq-future-stat">
                    {editing ? (
                      <><span className="eq-future-stat-lbl" style={{marginBottom:4}}>Probable Month</span><input className="eq-input" value={draft.probableMonth || ''} onChange={e => set('probableMonth', e.target.value)} /></>
                    ) : (
                      <><span className="eq-future-stat-val">{draft.probableMonth || '—'}</span><span className="eq-future-stat-lbl">Probable Month</span></>
                    )}
                  </div>
                  <div className="eq-future-stat">
                    {editing ? (
                      <><span className="eq-future-stat-lbl" style={{marginBottom:4}}>Order Chances %</span><input className="eq-input" value={draft.orderChances || ''} onChange={e => set('orderChances', e.target.value)} /></>
                    ) : (
                      <><span className="eq-future-stat-val">{draft.orderChances || '—'}<span style={{ fontSize: 14, fontWeight: 600 }}>%</span></span><span className="eq-future-stat-lbl">Order Chances</span></>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        {saveErr && <div className="eq-save-err">⚠ {saveErr}</div>}
        <div className="eq-footer">
          <div className="eq-footer-meta">
            <span className="eq-footer-label">Created on</span>
            <span className="eq-footer-date">{fmtDate(row.createdAt)}</span>
          </div>
          {editing ? (
            <button className="eq-gen-btn" onClick={handleSave} disabled={saving}>
              {saving ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <button className="eq-gen-btn" onClick={handleGenerateQuotation} disabled={generating}>
              {generating ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              )}
              {generating ? 'Generating…' : 'Generate Quotation'}
            </button>
          )}
        </div>

      </div>
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function EnquiryPage() {
  const router = useRouter();
  const { userRole, getAuthHeaders } = useAuth();
  const isAdminUser = isAdmin(userRole);

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigatingId, setNavigatingId] = useState(null);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  /* filter state */
  const [fName,   setFName]   = useState('');
  const [fMobile, setFMobile] = useState('');
  const [fSource, setFSource] = useState('');
  const [fDate,   setFDate]   = useState('');
  const [open,    setOpen]    = useState(false);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const name   = `${r.customerName || ''} ${r.millName || ''}`.toLowerCase();
      const mobile = (r.mobile || '').toLowerCase();
      const source = (r.source || '').toLowerCase();
      const date   = (r.createdAt || '').slice(0, 10);
      return (
        (!fName   || name.includes(fName.toLowerCase())) &&
        (!fMobile || mobile.includes(fMobile.toLowerCase())) &&
        (!fSource || source.includes(fSource.toLowerCase())) &&
        (!fDate   || date === fDate)
      );
    });
  }, [rows, fName, fMobile, fSource, fDate]);

  const downloadCSV = useCallback(() => {
    const headers = [
      'Customer Name','Mill/Company','Mobile','Email','GST No.',
      'City','State','Address','Lead Source',
      'Has Requirement',
      'Item 1 Model','Item 1 Size','Item 1 Qty','Item 1 Price',
      'Item 2 Model','Item 2 Size','Item 2 Qty','Item 2 Price',
      'Item 3 Model','Item 3 Size','Item 3 Qty','Item 3 Price',
      'Commodity','Future Note','Follow-Up Date','Probable Month','Order Chances %',
      'Remarks','Date'
    ];
    const esc = v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const fmtPrice = v => v ? new Intl.NumberFormat('en-IN').format(+v) : '';
    const csvRows = rows.map(r => {
      const it = r.items || [];
      const i1 = it[0] || {}, i2 = it[1] || {}, i3 = it[2] || {};
      return [
        r.customerName, r.millName, r.mobile, r.email, r.gst,
        r.location, r.state, r.address, r.source,
        r.hasRequirement === true ? 'Immediate' : r.hasRequirement === false ? 'Future' : '',
        i1.modelNo, i1.size, i1.qty, fmtPrice(i1.price),
        i2.modelNo, i2.size, i2.qty, fmtPrice(i2.price),
        i3.modelNo, i3.size, i3.qty, fmtPrice(i3.price),
        r.commodity, r.futureNote, r.followUpDate, r.probableMonth, r.orderChances,
        r.remarks,
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''
      ].map(esc).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));
  }, [filtered]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true);
    try {
      const ids = [...selected];
      await Promise.all(ids.map(id =>
        fetch(`/api/enquiry/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } })
      ));
      setRows(prev => prev.filter(r => !selected.has(r.id)));
      setSelected(new Set());
      setShowBulkConfirm(false);
    } catch { /* silent */ }
    finally { setBulkDeleting(false); }
  }, [selected, getAuthHeaders]);

  const chips = [
    fName   && { key: 'name',   label: fName,   clear: () => setFName('') },
    fMobile && { key: 'mobile', label: fMobile, clear: () => setFMobile('') },
    fSource && { key: 'source', label: fSource, clear: () => setFSource('') },
    fDate   && { key: 'date',   label: fDate,   clear: () => setFDate('') },
  ].filter(Boolean);

  const hasAny = chips.length > 0;

  const closePanel = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('.eq-filter-wrap')) closePanel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closePanel]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closePanel]);

  useEffect(() => {
    fetch('/api/enquiry', { headers: { ...getAuthHeaders() } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setRows(data.data || []);
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes enq-spin { to { transform: rotate(360deg); } }

        /* ── ENQUIRY PAGE ── */
        .enq-page { padding: 0; }

        /* top bar */
        .enq-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 16px 12px; gap: 10px;
        }
        .enq-topbar-left { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
        .enq-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .enq-title { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 18px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
        .enq-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

        /* bulk selection */
        .enq-chk { width: 36px; text-align: center; padding: 0 !important; vertical-align: middle; }
        .enq-chk-box {
          width: 16px; height: 16px; border-radius: 4px;
          border: 2px solid #cbd5e1; background: #fff;
          cursor: pointer; appearance: none; -webkit-appearance: none;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all .15s; position: relative; vertical-align: middle;
        }
        .enq-chk-box:checked {
          background: #1A37AA; border-color: #1A37AA;
        }
        .enq-chk-box:checked::after {
          content: ''; width: 4px; height: 8px;
          border: solid #fff; border-width: 0 2px 2px 0;
          transform: rotate(45deg); position: absolute; top: 1px;
        }
        .enq-chk-box.partial { background: #1A37AA; border-color: #1A37AA; }
        .enq-chk-box.partial::after {
          content: ''; width: 8px; height: 2px;
          background: #fff; position: absolute; border: none; transform: none;
        }
        .enq-chk-box:hover { border-color: #1A37AA; }
        .enq-row-selected { background: #eef2ff !important; }
        .enq-bulk-bar {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 12px;
          background: #0f1923; color: #fff;
          padding: 10px 16px; border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 999; font-size: 13px; font-weight: 500;
          animation: enq-bar-in 0.25s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        @keyframes enq-bar-in { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        .enq-bulk-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 6px;
          background: #1A37AA; border-radius: 6px;
          font-size: 12px; font-weight: 700;
        }
        .enq-bulk-btn {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 14px; border-radius: 8px;
          border: none; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .enq-bulk-btn.del { background: #dc2626; color: #fff; }
        .enq-bulk-btn.del:hover { background: #b91c1c; }
        .enq-bulk-btn.ghost { background: rgba(255,255,255,0.1); color: #fff; }
        .enq-bulk-btn.ghost:hover { background: rgba(255,255,255,0.2); }
        .enq-bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* bulk confirm overlay */
        .enq-bulk-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,18,30,0.55); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: enq-fade-in 0.18s ease both;
        }
        @keyframes enq-fade-in { from { opacity:0; } to { opacity:1; } }
        .enq-bulk-dialog {
          background: #fff; border-radius: 16px; padding: 28px;
          max-width: 380px; width: 90%; text-align: center;
          box-shadow: 0 24px 64px rgba(10,18,30,0.22);
          animation: enq-slide-up 0.25s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        @keyframes enq-slide-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .enq-bulk-dialog-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: #fef2f2; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; color: #dc2626;
        }
        .enq-bulk-dialog h3 { font-size: 17px; font-weight: 700; color: #0f1923; margin-bottom: 6px; }
        .enq-bulk-dialog p { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.6; }
        .enq-bulk-dialog-btns { display: flex; gap: 8px; justify-content: center; }

        /* CSV button */
        .enq-csv-btn {
          display: inline-flex; align-items: center; gap: 5px;
          height: 34px; padding: 0 12px;
          border-radius: 7px;
          border: 1.5px solid #e2e8f2;
          background: #fff; color: #64748b;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 12.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          transition: border-color .15s, color .15s, background .15s;
        }
        .enq-csv-btn:hover { border-color: #059669; color: #059669; background: #ecfdf5; }

        /* Filter button */
        .enq-filter-btn {
          display: inline-flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 13px; border-radius: 7px;
          border: 1.5px solid #e2e8f2; background: #fff; color: #64748b;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 12.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          transition: border-color .15s, color .15s, background .15s;
        }
        .enq-filter-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
        .enq-filter-btn.active { border-color: #1A37AA; color: #1A37AA; background: #f0f4ff; }
        .enq-filter-btn.has-active { border-color: #1A37AA; color: #1A37AA; }

        /* New button */
        .btn.btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 14px; border-radius: 7px;
          border: none;
          background: linear-gradient(135deg, #1A37AA 0%, #2549cc 100%);
          color: #fff;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 12.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap; text-decoration: none;
          box-shadow: 0 2px 8px rgba(26,55,170,0.3);
          transition: box-shadow .15s, transform .12s;
        }
        .btn.btn-primary:hover { box-shadow: 0 4px 14px rgba(26,55,170,0.45); transform: translateY(-1px); }
        @media (min-width: 768px) { .btn.btn-primary { height: 36px; font-size: 13px; padding: 0 16px; border-radius: 8px; } }

        .enq-filter-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 16px; height: 16px; padding: 0 4px;
          background: #1A37AA; color: #fff;
          border-radius: 10px; font-size: 9.5px; font-weight: 700; line-height: 1;
        }

        /* filter panel */
        .enq-filter-panel {
          border-top: 1px solid #eef1f8; border-bottom: 1px solid #eef1f8;
          background: #f8faff; padding: 14px 16px 16px;
        }
        .enq-filter-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .enq-filter-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: .5px; text-transform: uppercase;
          color: #64748b; margin-bottom: 4px;
        }
        .enq-filter-input-wrap { position: relative; }
        .enq-filter-icon {
          position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
          color: #cbd5e1; pointer-events: none; display: flex; align-items: center;
        }
        .enq-filter-input {
          width: 100%; height: 36px; padding: 0 8px 0 30px;
          border: 1.5px solid #e2e8f2; border-radius: 6px;
          background: #fff; color: #1e293b;
          font-family: var(--font-inter), Inter, sans-serif;
          font-size: 13px; outline: none; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .enq-filter-input::placeholder { color: #c0cce0; font-size: 12px; }
        .enq-filter-input:focus { border-color: #1A37AA; box-shadow: 0 0 0 3px rgba(26,55,170,.09); }
        .enq-filter-input.has-val { border-color: #93a8e8; background: #f4f7ff; }
        .enq-filter-input[type="date"] { color-scheme: light; }

        .enq-filter-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 10px; padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }
        .enq-filter-count { font-size: 11px; color: #94a3b8; }
        .enq-filter-count strong { color: #1A37AA; }
        .enq-filter-clear {
          font-size: 11.5px; font-weight: 600; color: #94a3b8;
          background: none; border: none; cursor: pointer;
          padding: 2px 6px; border-radius: 4px;
          transition: color .12s, background .12s;
        }
        .enq-filter-clear:hover { color: #ef4444; background: #fef2f2; }

        /* table wrap — flat, no card border */
        .enq-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        .enq-table {
          width: 100%; border-collapse: collapse;
          font-family: var(--font-inter), Inter, sans-serif;
        }
        .enq-table thead { display: none; }
        .enq-table th {
          padding: 9px 14px; font-size: 11px; font-weight: 600;
          letter-spacing: .4px; text-transform: uppercase;
          color: var(--text-muted); text-align: left;
          background: #f8fafc; border-bottom: 1px solid #c8d0de; white-space: nowrap;
        }
        .enq-table tbody tr {
          border-top: 1px solid #c8d0de;
          border-bottom: 1px solid #c8d0de;
          cursor: pointer; transition: background .1s;
        }
        .enq-table tbody tr + tr { border-top: none; }
        .enq-table tbody tr:hover { background: #f7f9ff; }
        .enq-table td {
          display: none; padding: 14px 14px;
          font-size: 13px; color: var(--text-primary); vertical-align: middle;
        }
        .enq-table td:first-child { display: block; }
        .enq-td-name { font-weight: 600; }
        .enq-td-muted { color: var(--text-secondary); }

        /* badge */
        .enq-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 7px; border-radius: 4px;
          font-size: 10px; font-weight: 700;
          letter-spacing: .3px; text-transform: uppercase;
          flex-shrink: 0;
        }
        .enq-badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .enq-badge--green { background: #edfaec; color: #236b21; }
        .enq-badge--green .enq-badge-dot { background: #236b21; }
        .enq-badge--amber { background: #fef3c7; color: #92400e; }
        .enq-badge--amber .enq-badge-dot { background: #f59e0b; }

        /* mobile row */
        .enq-desk-name { display: none; font-weight: 700; color: #1A37AA; }
        .enq-mob-row  { display: flex; flex-direction: column; gap: 3px; padding: 6px 0; }
        .enq-mob-top  { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .enq-mob-name {
          font-size: 13px; font-weight: 600; color: var(--text-primary);
          flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .enq-mob-sub {
          font-size: 11.5px; color: var(--text-muted);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* skeleton loader */
        @keyframes enq-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .enq-skel-row { display: flex; gap: 0; }
        .enq-skel-row td { display: table-cell; }
        .enq-skel-bar {
          height: 12px; border-radius: 6px;
          background: linear-gradient(90deg, #e8ecf4 0%, #f4f6fb 40%, #e8ecf4 80%);
          background-size: 800px 100%;
          animation: enq-shimmer 1.6s ease-in-out infinite;
        }
        .enq-skel-bar.w60 { width: 60%; }
        .enq-skel-bar.w40 { width: 40%; }
        .enq-skel-bar.w50 { width: 50%; }
        .enq-skel-bar.w70 { width: 70%; }
        .enq-skel-bar.w30 { width: 30%; }
        .enq-skel-bar.h8  { height: 8px; }
        .enq-skel-bar.pill { width: 64px; height: 20px; border-radius: 10px; }
        .enq-skel-mob {
          display: flex; flex-direction: column; gap: 6px; padding: 6px 0;
        }
        .enq-skel-mob-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        @media (min-width: 768px) {
          .enq-skel-mob { display: none; }
        }
        @media (max-width: 767px) {
          .enq-skel-desk { display: none !important; }
        }

        /* empty / loading */
        .enq-state {
          padding: 48px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .enq-state-icon { color: #d0d8e8; }
        .enq-state-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
        .enq-state-sub   { font-size: 12.5px; color: var(--text-muted); }

        /* nav loader overlay */
        .enq-nav-loader {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .enq-nav-loader-inner {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .enq-nav-loader-text {
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          font-weight: 600; color: #94a3b8; letter-spacing: 0.2px;
        }

        /* desktop */
        @media (min-width: 768px) {
          .enq-topbar { padding: 20px 24px 14px; gap: 10px; }
          .enq-title { font-size: 20px; }
          .enq-filter-btn { height: 36px; font-size: 13px; padding: 0 16px; border-radius: 8px; }
          .enq-filter-panel { padding: 14px 24px 16px; }
          .enq-filter-grid { grid-template-columns: repeat(4, 1fr); }
          .enq-table thead { display: table-header-group; }
          .enq-table td { display: table-cell; }
          .enq-table td:first-child { display: table-cell; }
          .enq-mob-row  { display: none; }
          .enq-desk-name { display: block; }
        }
      `}</style>
      {navigatingId && (
        <div className="enq-nav-loader">
          <div className="enq-nav-loader-inner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'enq-spin .8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span className="enq-nav-loader-text">Loading…</span>
          </div>
        </div>
      )}

      <div className="page-content enq-page">

        {/* Top bar + filter panel wrapped so outside-click handler doesn't close on button click */}
        <div className="eq-filter-wrap">
        <div className="enq-topbar">
          <div className="enq-topbar-left">
            <span className="enq-title">Enquiry</span>
            <span className="enq-count">
              {loading ? 'Loading…' : hasAny
                ? `${filtered.length} of ${rows.length}`
                : `${rows.length} entr${rows.length !== 1 ? 'ies' : 'y'}`}
            </span>
          </div>
          <div className="enq-topbar-right">
            {isAdminUser && rows.length > 0 && (
              <button className="enq-csv-btn" onClick={downloadCSV}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                CSV
              </button>
            )}
            <Link href="/enquiry" className="btn btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Enquiry
            </Link>
            <button
              className={`enq-filter-btn${open ? ' active' : ''}${hasAny && !open ? ' has-active' : ''}`}
              onClick={() => setOpen(v => !v)}
            >
              {open ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
              )}
              {open ? 'Close' : 'Filter'}
              {!open && hasAny && <span className="enq-filter-badge">{chips.length}</span>}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {open && (
          <div className="enq-filter-panel">
            <div className="enq-filter-grid">

              <div>
                <label className="enq-filter-label">Name / Company</label>
                <div className="enq-filter-input-wrap">
                  <input className={`enq-filter-input${fName ? ' has-val' : ''}`} placeholder="Search name or company…" value={fName} onChange={e => setFName(e.target.value)} autoFocus />
                  <span className="enq-filter-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                </div>
              </div>

              <div>
                <label className="enq-filter-label">Mobile</label>
                <div className="enq-filter-input-wrap">
                  <input className={`enq-filter-input${fMobile ? ' has-val' : ''}`} placeholder="Search mobile…" value={fMobile} onChange={e => setFMobile(e.target.value)} />
                  <span className="enq-filter-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
                </div>
              </div>

              <div>
                <label className="enq-filter-label">Source</label>
                <div className="enq-filter-input-wrap">
                  <input className={`enq-filter-input${fSource ? ' has-val' : ''}`} placeholder="Exhibition, Reference…" value={fSource} onChange={e => setFSource(e.target.value)} />
                  <span className="enq-filter-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                </div>
              </div>

              <div>
                <label className="enq-filter-label">Date</label>
                <div className="enq-filter-input-wrap">
                  <input className={`enq-filter-input${fDate ? ' has-val' : ''}`} type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                  <span className="enq-filter-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                </div>
              </div>

            </div>

            <div className="enq-filter-footer">
              <span className="enq-filter-count">
                {loading ? 'Loading…' : <><strong>{filtered.length}</strong> of {rows.length} records match</>}
              </span>
              {hasAny && (
                <button className="enq-filter-clear" onClick={() => { setFName(''); setFMobile(''); setFSource(''); setFDate(''); }}>Reset all</button>
              )}
            </div>
          </div>
        )}
        </div>{/* /eq-filter-wrap */}

        {/* Table */}
        <div className="enq-table-wrap">
          <table className="enq-table">
          {error ? (
            <tbody><tr><td colSpan={6} style={{ display: 'table-cell' }}><div className="enq-state"><span className="enq-state-title" style={{color:'#c0392b'}}>⚠ {error}</span></div></td></tr></tbody>
          ) : loading ? (
            <>
              <thead>
                <tr>
                  {!loading && isAdminUser && <th className="enq-chk"><input type="checkbox" className={`enq-chk-box${selected.size > 0 && selected.size < filtered.length ? ' partial' : ''}`} checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} /></th>}
                  <th>Customer</th>
                  <th>Requirement</th>
                  <th>Mill / Company</th>
                  <th>Mobile</th>
                  <th>Location</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {[0,1,2,3,4,5].map(i => (
                  <tr key={i} style={{ cursor: 'default', animationDelay: `${i * 0.08}s` }}>
                    <td className="enq-td-name">
                      {/* mobile skeleton */}
                      <div className="enq-skel-mob">
                        <div className="enq-skel-mob-top">
                          <div className="enq-skel-bar w60" style={{ animationDelay: `${i * 0.12}s` }} />
                          <div className="enq-skel-bar pill" style={{ animationDelay: `${i * 0.12 + 0.1}s` }} />
                        </div>
                        <div className="enq-skel-bar w70 h8" style={{ animationDelay: `${i * 0.12 + 0.2}s` }} />
                      </div>
                      {/* desktop skeleton */}
                      <div className="enq-skel-desk" style={{ display: 'block' }}>
                        <div className="enq-skel-bar w70" style={{ animationDelay: `${i * 0.12}s` }} />
                      </div>
                    </td>
                    <td className="enq-skel-desk"><div className="enq-skel-bar pill" style={{ animationDelay: `${i * 0.12 + 0.05}s` }} /></td>
                    <td className="enq-skel-desk"><div className="enq-skel-bar w60" style={{ animationDelay: `${i * 0.12 + 0.1}s` }} /></td>
                    <td className="enq-skel-desk"><div className="enq-skel-bar w50" style={{ animationDelay: `${i * 0.12 + 0.15}s` }} /></td>
                    <td className="enq-skel-desk"><div className="enq-skel-bar w40" style={{ animationDelay: `${i * 0.12 + 0.2}s` }} /></td>
                    <td className="enq-skel-desk"><div className="enq-skel-bar w50" style={{ animationDelay: `${i * 0.12 + 0.25}s` }} /></td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  {!loading && isAdminUser && <th className="enq-chk"><input type="checkbox" className={`enq-chk-box${selected.size > 0 && selected.size < filtered.length ? ' partial' : ''}`} checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} /></th>}
                  <th>Customer</th>
                  <th>Requirement</th>
                  <th>Mill / Company</th>
                  <th>Mobile</th>
                  <th>Location</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr style={{ cursor: 'default' }}>
                    <td colSpan={6} style={{ display: 'table-cell' }}>
                      <div className="enq-state">
                        <svg className="enq-state-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="enq-state-title">{hasAny ? 'No results match your filters' : 'No enquiries yet'}</span>
                        <span className="enq-state-sub">{hasAny ? 'Try adjusting or clearing the filters' : 'Add your first enquiry to get started'}</span>
                        {!hasAny && isAdminUser && (
                          <Link href="/enquiry" className="btn btn-primary" style={{ marginTop: 4 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            New Enquiry
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const locationStr = [r.location, r.state].filter(Boolean).join(', ');
                    const isImmediate = r.hasRequirement === true;
                    const subParts    = [r.millName, r.mobile, locationStr].filter(Boolean);
                    return (
                      <tr key={r.id} className={selected.has(r.id) ? 'enq-row-selected' : ''} onClick={() => { if (selected.size > 0) { toggleSelect(r.id); return; } setNavigatingId(r.id); router.push(`/dashboard/enquiry/${r.id}`); }}>
                        {isAdminUser && <td className="enq-chk" onClick={e => e.stopPropagation()}><input type="checkbox" className="enq-chk-box" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>}
                        {/* first td: mobile layout + desktop name */}
                        <td className="enq-td-name">
                          <>
                              {/* mobile row */}
                              <span className="enq-mob-row">
                                <span className="enq-mob-top">
                                  <span className="enq-mob-name">{r.customerName || '—'}</span>
                                  <span className={`enq-badge ${isImmediate ? 'enq-badge--green' : 'enq-badge--amber'}`}>
                                    <span className="enq-badge-dot" />
                                    {isImmediate ? 'Immediate' : 'Future'}
                                  </span>
                                </span>
                                {subParts.length > 0 && <span className="enq-mob-sub">{subParts.join(' · ')}</span>}
                              </span>
                              {/* desktop name */}
                              <span className="enq-desk-name">{r.customerName || '—'}</span>
                            </>
                        </td>
                        <td>
                          <span className={`enq-badge ${isImmediate ? 'enq-badge--green' : 'enq-badge--amber'}`}>
                            <span className="enq-badge-dot" />
                            {isImmediate ? 'Immediate' : 'Future'}
                          </span>
                        </td>
                        <td className="enq-td-muted">{r.millName || '—'}</td>
                        <td className="enq-td-muted">{r.mobile || '—'}</td>
                        <td className="enq-td-muted">{locationStr || '—'}</td>
                        <td className="enq-td-muted" style={{ fontSize: 12.5 }}>{fmtDate(r.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </>
          )}
          </table>
        </div>

      </div>

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="enq-bulk-bar">
          <span className="enq-bulk-count">{selected.size}</span>
          <span>selected</span>
          <button className="enq-bulk-btn del" onClick={() => setShowBulkConfirm(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Delete
          </button>
          <button className="enq-bulk-btn ghost" onClick={clearSelection}>Cancel</button>
        </div>
      )}

      {/* Bulk delete confirm */}
      {showBulkConfirm && (
        <div className="enq-bulk-overlay" onClick={e => e.target === e.currentTarget && setShowBulkConfirm(false)}>
          <div className="enq-bulk-dialog">
            <div className="enq-bulk-dialog-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3>Delete {selected.size} enquir{selected.size === 1 ? 'y' : 'ies'}?</h3>
            <p>This action cannot be undone. All selected enquiries will be permanently removed.</p>
            <div className="enq-bulk-dialog-btns">
              <button className="enq-bulk-btn ghost" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setShowBulkConfirm(false)} disabled={bulkDeleting}>Cancel</button>
              <button className="enq-bulk-btn del" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
