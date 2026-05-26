'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildHTML as buildHTML1 } from '@/components/QuotationForm';
import { buildHTML as buildHTML2 } from '@/components/QuotationForm2';

const fmtINR = n => n ? '₹ ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(+n) : '—';

const CSS = `
  .qv-root { height: 100vh; background: #fff; display: flex; flex-direction: column; overflow: hidden; }

  /* ── Clean white top bar ── */
  .qv-bar {
    position: sticky; top: 0; z-index: 100; height: 56px;
    background: #fff; border-bottom: 1px solid #e5e8ef;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    display: flex; align-items: center; gap: 10px; padding: 0 20px;
    flex-shrink: 0;
  }
  .qv-bar-back {
    display: inline-flex; align-items: center; gap: 5px;
    height: 34px; padding: 0 12px; border-radius: 7px;
    border: 1.5px solid #e2e8f2; background: #fff;
    color: #64748b; font-size: 12.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: all .15s; cursor: pointer;
  }
  .qv-bar-back:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
  .qv-bar-dot { width: 1px; height: 20px; background: #e5e8ef; }
  .qv-bar-title {
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    color: #94a3b8; letter-spacing: .1px;
  }
  .qv-bar-name {
    font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 700;
    color: #1a2230; letter-spacing: .05px;
  }
  .qv-bar-sep { color: #c8d0de; font-size: 12px; }
  .qv-bar-space { flex: 1; }
  .qv-bar-chip {
    background: #eef1fc; border: 1px solid #c7d2f5;
    border-radius: 5px; padding: 2px 8px; font-size: 10.5px; font-weight: 700;
    color: #1A37AA; letter-spacing: .3px; font-family: 'Barlow Condensed', sans-serif;
  }

  /* share dropdown */
  .qv-share-wrap { position: relative; }
  .qv-share-btn {
    height: 34px; padding: 0 14px; border-radius: 7px;
    border: 1.5px solid #e2e8f2; background: #fff;
    color: #64748b; font-size: 12.5px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: all .15s;
  }
  .qv-share-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
  .qv-share-dropdown {
    position: fixed;
    background: #fff; border: 1px solid #e0e8f2; border-radius: 12px; padding: 6px;
    box-shadow: 0 12px 40px rgba(13,24,40,.14), 0 2px 8px rgba(13,24,40,.06);
    min-width: 200px; z-index: 9999;
    animation: qv-drop-in .18s cubic-bezier(.34,1.3,.64,1) both;
  }
  @keyframes qv-drop-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .qv-share-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 12px; border-radius: 8px;
    border: none; background: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: #0d1828; text-align: left; transition: background .12s;
  }
  .qv-share-item:hover { background: #f4f7fd; }
  .qv-share-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .qv-share-sep { height: 1px; background: #f0f3f8; margin: 4px 6px; }

  .qv-close-btn {
    height: 34px; padding: 0 14px; border-radius: 7px;
    border: 1.5px solid #e2e8f2; background: #fff;
    color: #64748b; font-size: 12.5px; font-family: 'DM Sans', sans-serif;
    font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: all .15s;
  }
  .qv-close-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
  .qv-history-btn--active { border-color: #1A37AA; color: #1A37AA; background: #f0f4ff; }
  .qv-history-btn--active:hover { border-color: #1A37AA; background: #e8eeff; }

  /* 3-dots more menu */
  .qv-more-wrap { position: relative; }
  .qv-more-btn {
    width: 34px; height: 34px; border-radius: 7px;
    border: 1.5px solid #e2e8f2; background: #fff;
    color: #64748b; cursor: pointer;
    display: none; align-items: center; justify-content: center;
    transition: all .15s; flex-shrink: 0;
  }
  .qv-more-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
  .qv-more-dropdown {
    position: fixed;
    background: #fff; border: 1px solid #e0e8f2; border-radius: 12px; padding: 6px;
    box-shadow: 0 12px 40px rgba(13,24,40,.14), 0 2px 8px rgba(13,24,40,.06);
    min-width: 180px; z-index: 9999;
    animation: qv-drop-in .18s cubic-bezier(.34,1.3,.64,1) both;
  }
  .qv-more-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 12px; border-radius: 8px;
    border: none; background: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: #0d1828; text-align: left; transition: background .12s;
  }
  .qv-more-item:hover { background: #f4f7fd; }
  .qv-more-item--danger { color: #c0392b; }
  .qv-more-item--danger:hover { background: #fff5f5; }
  .qv-more-item-icon {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .qv-iframe-wrap {
    flex: 1; overflow: auto; background: #fff; display: block; padding: 0;
  }
  .qv-iframe-wrap iframe {
    border: none; display: block; background: #fff;
  }

  /* ── Body ── */
  .qv-body { flex: 1; display: flex; overflow: hidden; }

  /* ── Audit panel ── */
  .qv-audit-panel {
    flex-shrink: 0;
    background: #fff;
    border-left: 1px solid #e4e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width .22s ease;
    align-self: stretch;
  }
  .qv-audit-panel.open   { width: 288px; }
  .qv-audit-panel.closed { width: 44px; }

  /* ── Panel header — always visible ── */
  .qv-audit-head {
    height: 48px; flex-shrink: 0;
    border-bottom: 1px solid #e4e8f0;
    display: flex; align-items: center;
    padding: 0 12px; gap: 8px;
    background: #fff;
  }
  .qv-audit-panel.closed .qv-audit-head {
    justify-content: center;
    padding: 0;
    border-bottom: 1px solid #e4e8f0;
  }
  .qv-audit-panel.closed .qv-audit-head-left { display: none; }
  .qv-audit-head-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
  .qv-audit-title {
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
    color: #1a2540; white-space: nowrap;
  }
  .qv-audit-count-pill {
    font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    color: #6b7a99; background: #eef1f8;
    border-radius: 20px; padding: 2px 8px; white-space: nowrap;
  }
  .qv-audit-toggle-btn {
    width: 28px; height: 28px; border-radius: 6px;
    border: 1px solid #e4e8f0; background: #f7f9fc;
    color: #6b7a99; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background .14s, color .14s, border-color .14s;
  }
  .qv-audit-toggle-btn:hover { background: #eef1f8; border-color: #c8d0e4; color: #1a2540; }

  /* ── Scroll area ── */
  .qv-audit-scroll {
    flex: 1; overflow-y: auto; padding: 14px 12px 24px;
    scrollbar-width: thin; scrollbar-color: #d0d7e8 transparent;
  }
  .qv-audit-panel.closed .qv-audit-scroll { display: none; }
  .qv-audit-scroll::-webkit-scrollbar { width: 4px; }
  .qv-audit-scroll::-webkit-scrollbar-thumb { background: #d0d7e8; border-radius: 4px; }

  .qv-audit-empty {
    text-align: center; padding: 40px 8px 24px;
    font-family: 'Inter', sans-serif; font-size: 12px;
    color: #9aa3b8; line-height: 1.7;
  }
  .qv-audit-empty-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: #f0f3fa; border: 1px solid #e4e8f0;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }

  /* ── Date divider ── */
  .qv-date-divider {
    display: flex; align-items: center; gap: 8px;
    margin: 18px 0 10px;
  }
  .qv-date-divider:first-child { margin-top: 4px; }
  .qv-date-divider-line { flex: 1; height: 1px; background: #e8ecf5; }
  .qv-date-divider-chip {
    font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    color: #8a95b0; white-space: nowrap; letter-spacing: .3px;
  }

  /* ── Entry card ── */
  .qv-entry-card {
    background: #f8f9fc; border: 1px solid #e8ecf5;
    border-radius: 8px; padding: 10px 12px;
    margin-bottom: 6px; transition: border-color .14s;
  }
  .qv-entry-card:hover { border-color: #c8d0e4; }
  .qv-entry-card:last-child { margin-bottom: 0; }
  .qv-entry-time {
    font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 500;
    color: #8a95b0; margin-bottom: 8px;
  }
  .qv-entry-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .qv-entry-tag {
    font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 500;
    color: #374269; background: #fff;
    border: 1px solid #dce2f0; border-radius: 4px; padding: 2px 8px;
  }

  @keyframes qv-spin { to { transform: rotate(360deg); } }

  /* ==========================================================
     MOBILE — single-row bar, icon-only actions
     ========================================================== */

  .qv-root { background: #fff; }

  /* Single rigid row — never wraps */
  .qv-bar {
    height: 52px;
    padding: 0 10px;
    gap: 6px;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  /* Back button: icon only on mobile */
  .qv-bar-back {
    width: 36px; height: 36px; padding: 0;
    border-radius: 8px; flex-shrink: 0;
    justify-content: center;
  }
  .qv-bar-back-label { display: none; }

  /* Hide decorative / info elements */
  .qv-bar-dot,
  .qv-bar-title,
  .qv-bar-sep,
  .qv-bar-chip { display: none; }

  /* Quotation number — takes remaining space, truncated */
  .qv-bar-name {
    font-size: 13px; font-weight: 700;
    flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .qv-bar-space { display: none; }

  /* Right-side action cluster — pushed to far right */
  .qv-bar-actions {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto;
  }

  /* Icon-only button base (share + more) */
  .qv-icon-btn {
    width: 36px; height: 36px; border-radius: 8px;
    border: 1.5px solid #e2e8f2; background: #fff;
    color: #64748b; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s; flex-shrink: 0;
  }
  .qv-icon-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }

  /* Share button: icon-only on mobile */
  .qv-share-btn {
    width: 36px; height: 36px; padding: 0;
    border-radius: 8px; flex-shrink: 0;
    justify-content: center;
  }
  .qv-share-label { display: none; }

  /* Hide quotation ref number on mobile */
  .qv-bar-name { display: none; }

  /* Hide Close / Edit Enquiry individual buttons; show 3-dots */
  .qv-close-btn,
  .qv-edit-enquiry-btn,
  .qv-history-btn { display: none !important; }
  .qv-more-btn { display: flex; }

  /* Hide floating FAB — history is in dots menu on mobile */
  .qv-audit-fab { display: none !important; }

  /* Iframe wrapper */
  .qv-iframe-wrap {
    flex: 1; overflow: auto; background: #fff;
    display: block; padding: 0; -webkit-overflow-scrolling: touch;
  }
  .qv-iframe-wrap iframe {
    border: none; display: block; background: #fff;
  }

  .qv-body { flex: 1; display: flex; overflow: hidden; position: relative; }

  /* Audit panel: fixed right-side drawer on mobile */
  .qv-audit-panel {
    position: fixed; top: 52px; right: 0; bottom: 0;
    width: 290px !important; height: calc(100% - 52px) !important;
    border-left: 1px solid #e4e8f0; border-top: 1px solid #e4e8f0;
    z-index: 300; transition: transform .25s ease; align-self: auto;
    box-shadow: -4px 0 24px rgba(0,0,0,.12);
  }
  .qv-audit-panel.open  { transform: translateX(0); }
  .qv-audit-panel.closed { transform: translateX(100%); }

  .qv-audit-backdrop {
    display: block; position: fixed;
    top: 52px; left: 0; right: 0; bottom: 0;
    background: rgba(13,24,40,.35); z-index: 299;
    animation: qv-fade-in .2s ease both;
  }
  @keyframes qv-fade-in { from { opacity: 0; } to { opacity: 1; } }

  .qv-audit-fab {
    display: flex; position: fixed; right: 0; bottom: 80px; z-index: 200;
    align-items: center; gap: 6px; padding: 8px 12px 8px 14px;
    background: #1a2540; color: #fff;
    border: none; border-radius: 8px 0 0 8px;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
    cursor: pointer; box-shadow: -2px 2px 12px rgba(0,0,0,.2); transition: background .15s;
  }
  .qv-audit-fab:hover { background: #263357; }
  .qv-audit-fab-count {
    background: rgba(255,255,255,.18); border-radius: 10px; padding: 1px 6px; font-size: 10px;
  }

  .qv-audit-head { justify-content: space-between; padding: 0 14px; }
  .qv-audit-panel.closed .qv-audit-head-left { display: flex; }

  .qv-loading {
    position: fixed; inset: 0; background: rgba(13,24,40,.95);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; z-index: 9999;
  }

  /* ==========================================================
     TABLET & DESKTOP (768px+) — restore full bar
     ========================================================== */
  @media (min-width: 768px) {
    .qv-root { background: #fff; }

    .qv-bar {
      height: 56px; padding: 0 20px; gap: 10px;
    }

    .qv-bar-back {
      width: auto; height: 34px; padding: 0 12px;
      font-size: 12.5px; gap: 5px; justify-content: flex-start;
    }
    .qv-bar-back-label { display: inline; }

    .qv-bar-dot { display: block; }
    .qv-bar-title { display: block; }
    .qv-bar-sep { display: inline; }
    .qv-bar-chip { display: block; }
    .qv-bar-space { display: block; }
    .qv-bar-name { display: inline; font-size: 13.5px; flex: none; min-width: auto; }

    .qv-share-btn {
      width: auto; height: 34px; padding: 0 14px; gap: 6px; justify-content: flex-start;
    }
    .qv-share-label { display: inline; }

    .qv-close-btn,
    .qv-edit-enquiry-btn,
    .qv-history-btn { display: flex !important; }
    .qv-more-btn { display: none !important; }
    .qv-bar-actions { gap: 8px; }

    .qv-iframe-wrap { background: #fff; padding: 0; display: block; }
    .qv-iframe-wrap iframe { display: block; }

    .qv-body { flex-direction: row; }

    .qv-audit-panel {
      position: static !important; transform: none !important;
      border-top: none; border-left: 1px solid #e4e8f0;
      height: auto !important; min-height: 0 !important; max-height: none !important;
      align-self: stretch; box-shadow: none; transition: width .22s ease;
      top: auto;
    }
    .qv-audit-panel.open  { width: 288px !important; }
    .qv-audit-panel.closed { width: 44px !important; }
    .qv-audit-panel.closed .qv-audit-head { justify-content: center; padding: 0; }
    .qv-audit-panel.closed .qv-audit-head-left { display: none; }
    .qv-audit-head { justify-content: space-between; padding: 0 12px; }

    .qv-audit-backdrop { display: none !important; }
    .qv-audit-fab { display: none !important; }
  }
`;

export default function QuotationViewPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { getAuthHeaders } = useAuth();
  const [record, setRecord]     = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const shareBtnRef = useRef(null);
  const [showMore, setShowMore] = useState(false);
  const [morePos, setMorePos] = useState({ top: 0, left: 0 });
  const moreBtnRef = useRef(null);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const iframeWrapRef = useRef(null);
  const iframeRef = useRef(null);
  const iframeClipRef = useRef(null);

  // Scale iframe to fill available width; clip wrapper to scaled dimensions to prevent over-scroll
  useEffect(() => {
    const applyScale = () => {
      const wrap = iframeWrapRef.current;
      const frame = iframeRef.current;
      const clip = iframeClipRef.current;
      if (!wrap || !frame || !clip) return;
      const available = wrap.clientWidth;
      const contentWidth = 860;
      const iframeHeight = frame.offsetHeight || (record?.quotationType === 'detailed' ? 8400 : 1400);
      if (available < contentWidth) {
        const scale = available / contentWidth;
        frame.style.width = contentWidth + 'px';
        frame.style.transform = `scale(${scale})`;
        frame.style.transformOrigin = 'top left';
        // clip div matches the scaled visual size exactly — no excess scroll
        clip.style.width = available + 'px';
        clip.style.height = Math.ceil(iframeHeight * scale) + 'px';
        clip.style.overflow = 'hidden';
      } else {
        frame.style.width = '100%';
        frame.style.transform = 'none';
        clip.style.width = '';
        clip.style.height = '';
        clip.style.overflow = '';
      }
    };
    applyScale();
    window.addEventListener('resize', applyScale);
    return () => window.removeEventListener('resize', applyScale);
  }, [record]);

  useEffect(() => {
    // Extract enquiryId from composite doc ID (e.g. "abc123_1page" → "abc123")
    const enquiryId = id.includes('_') ? id.split('_').slice(0, -1).join('_') : null;
    if (enquiryId) {
      setAuditLoading(true);
      fetch(`/api/enquiry/${enquiryId}/auditLog`, { headers: { ...getAuthHeaders() } })
        .then(r => r.json())
        .then(d => { if (d.success) setAuditLog(d.data || []); })
        .catch(() => {})
        .finally(() => setAuditLoading(false));
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/quotations/${id}`, { headers: { ...getAuthHeaders() } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setRecord(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="qv-root">
      <style>{CSS}</style>
      <div className="qv-bar">
        <button className="qv-bar-back" onClick={() => router.push('/dashboard/quotations')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          All Quotations
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: '#1a2230' }}>Quotation not found</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>ID: {id}</div>
      </div>
    </div>
  );

  if (!record) return (
    <div className="qv-root">
      <style>{CSS}</style>
      <div className="qv-bar" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'qv-spin 0.8s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes qv-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const base = Math.round(parseFloat(record.basePrice) || 0);
  const html = record.quotationType === 'detailed'
    ? buildHTML2(record)
    : buildHTML1(record, { base, gstAmt: record.gstAmt || 0, total: record.total || 0 });

  const shareText = () => [
    `Dear ${record.salutation} ${record.contact},`,
    ``,
    `Please find the quotation from Unique Sorter & Equipments Pvt. Ltd.`,
    ``,
    `Quotation No: ${record.quotNo || '—'}`,
    `Product: ${record.descLine1 || record.model || '—'}`,
    `Quantity: ${record.qty}`,
    `Total Amount (incl. GST): ${record.total ? fmtINR(record.total) : '—'}`,
    ``,
    `For queries: raipur@uniquesorter.in | www.uniquesorter.in`,
  ].join('\n');

  const handleShareWhatsApp = () => {
    const phone = record.mobile?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(shareText())}`, '_blank');
    setShowShare(false);
  };

  const handleShareGmail = () => {
    const subject = encodeURIComponent(`Quotation ${record.quotNo || ''} — Unique Sorter & Equipments Pvt. Ltd.`);
    const to = record.email ? encodeURIComponent(record.email) : '';
    window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${encodeURIComponent(shareText())}`, '_blank');
    setShowShare(false);
  };

  const handleDownload = async () => {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rawStyle = doc.querySelector('style')?.textContent || '';
    const cleanStyle = rawStyle.replace(/\bbody\s*\{[^}]*\}/gs, '').replace(/\bhtml\s*\{[^}]*\}/gs, '');
    const page = doc.querySelector('.page');
    if (!page) return;
    const stampB64 = await fetch('/stamp.png').then(r => r.blob()).then(blob => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }));
    const stampImg = page.querySelector('img[alt="Company Stamp"]');
    if (stampImg) stampImg.src = stampB64;
    const styleEl = document.createElement('style');
    styleEl.textContent = cleanStyle;
    document.head.appendChild(styleEl);
    const shell = document.createElement('div');
    shell.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;overflow:visible;z-index:-1;';
    shell.appendChild(page);
    document.body.appendChild(shell);
    await document.fonts.ready;
    await Promise.all(Array.from(shell.querySelectorAll('img')).map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })));
    await new Promise(r => setTimeout(r, 200));
    const filename = `Quotation${record.quotNo ? `_${record.quotNo.replace(/\//g, '-')}` : ''}.pdf`;
    try {
      const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794, scrollX: 0, scrollY: 0 });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgH = pdfW * (canvas.height / canvas.width);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pdfW, Math.min(imgH, pdf.internal.pageSize.getHeight()));
      pdf.save(filename);
    } finally {
      document.body.removeChild(shell);
      document.head.removeChild(styleEl);
    }
    setShowShare(false);
  };

  return (
    <div className="qv-root">
      <style>{CSS}</style>

      <div className="qv-bar">
        {/* Back */}
        <button className="qv-bar-back" onClick={() => router.push('/dashboard/quotations')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="qv-bar-back-label">All Quotations</span>
        </button>

        {/* Title info */}
        {record.contact && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a2230' }}>{record.salutation} {record.contact}</span>}
        <div className="qv-bar-space" />

        {/* Right action cluster */}
        <div className="qv-bar-actions">

        {/* Edit enquiry button (desktop only) */}
        {record.enquiryId && (
          <button
            className="qv-close-btn qv-edit-enquiry-btn"
            onClick={() => router.push(`/dashboard/enquiry/${record.enquiryId}`)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
            </svg>
            Edit Enquiry
          </button>
        )}

        {/* Share dropdown */}
        <div className="qv-share-wrap">
          <button className="qv-share-btn" ref={shareBtnRef} onClick={() => {
            if (!showShare && shareBtnRef.current) {
              const r = shareBtnRef.current.getBoundingClientRect();
              const dropW = 212;
              const left = Math.min(r.right - dropW, window.innerWidth - dropW - 8);
              setDropdownPos({ top: r.bottom + 8, left: Math.max(8, left) });
            }
            setShowShare(s => !s);
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="qv-share-label">Share</span>
            <span className="qv-share-label"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </button>
          {showShare && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowShare(false)} />
              <div className="qv-share-dropdown" style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, right: 'auto' }}>
                <button className="qv-share-item" onClick={handleShareWhatsApp}>
                  <span className="qv-share-icon" style={{ background: '#e8f8ee' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M11.998 2C6.476 2 2 6.476 2 11.998c0 1.76.456 3.411 1.253 4.845L2 22l5.299-1.24A9.966 9.966 0 0 0 11.998 22C17.52 22 22 17.524 22 11.998 22 6.476 17.52 2 11.998 2z" fill="none" stroke="#25D366" strokeWidth="0"/>
                    </svg>
                  </span>
                  Share on WhatsApp
                </button>
                <button className="qv-share-item" onClick={handleShareGmail}>
                  <span className="qv-share-icon" style={{ background: '#fdecea' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>
                  </span>
                  Send via Gmail
                </button>
                <div className="qv-share-sep" />
                <button className="qv-share-item" onClick={handleDownload}>
                  <span className="qv-share-icon" style={{ background: '#eef1fb' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </span>
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>

        {/* History toggle — desktop only */}
        <button
          className={`qv-close-btn qv-history-btn${auditOpen ? ' qv-history-btn--active' : ''}`}
          onClick={() => setAuditOpen(o => !o)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          History
        </button>

        {/* 3-dots menu (mobile only) */}
        <div className="qv-more-wrap">
          <button
            className="qv-more-btn"
            ref={moreBtnRef}
            title="More options"
            onClick={() => {
              if (!showMore && moreBtnRef.current) {
                const r = moreBtnRef.current.getBoundingClientRect();
                const dropW = 180;
                const left = Math.min(r.right - dropW, window.innerWidth - dropW - 8);
                setMorePos({ top: r.bottom + 8, left: Math.max(8, left) });
              }
              setShowMore(s => !s);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {showMore && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowMore(false)} />
              <div className="qv-more-dropdown" style={{ top: morePos.top, left: morePos.left }}>
                <button className="qv-more-item" onClick={() => { setShowMore(false); setAuditOpen(true); }}>
                  <span className="qv-more-item-icon" style={{ background: '#f0f3fa' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374269" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
                    </svg>
                  </span>
                  History
                  {auditLog.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#6b7a99', background: '#eef1f8', borderRadius: 10, padding: '1px 7px' }}>{auditLog.length}</span>}
                </button>
                {record.enquiryId && (
                  <button className="qv-more-item" onClick={() => { setShowMore(false); router.push(`/dashboard/enquiry/${record.enquiryId}`); }}>
                    <span className="qv-more-item-icon" style={{ background: '#eef1fc' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                    </span>
                    Edit Enquiry
                  </button>
                )}
                <button className="qv-more-item qv-more-item--danger" onClick={() => { setShowMore(false); router.push('/dashboard/quotations'); }}>
                  <span className="qv-more-item-icon" style={{ background: '#fff5f5' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </span>
                  Close
                </button>
              </div>
            </>
          )}
        </div>

        </div>{/* /qv-bar-actions */}
      </div>

      <div className="qv-body">
        <div ref={iframeWrapRef} className="qv-iframe-wrap">
          <div ref={iframeClipRef}>
            <iframe
              ref={iframeRef}
              srcDoc={html}
              title="Quotation"
              style={{ height: record.quotationType === 'detailed' ? 8400 : 1400, border: 'none', display: 'block' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
