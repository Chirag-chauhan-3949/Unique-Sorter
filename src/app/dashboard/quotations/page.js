'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';

const fmtINR = n => n ? '₹ ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(+n) : '—';
const fmtDate = iso => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };

const CSS = `
  /* ── QUOTATIONS PAGE ── */
  .quot-page { padding: 0; }

  /* top bar */
  .quot-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 16px 12px;
    gap: 10px;
  }
  .quot-topbar-left { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
  .quot-title {
    font-family: var(--font-poppins), Poppins, sans-serif;
    font-size: 18px; font-weight: 700;
    color: var(--text-primary); white-space: nowrap;
  }
  .quot-count {
    font-size: 12px; color: var(--text-muted);
    white-space: nowrap;
  }

  /* filter button */
  .quot-filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 34px; padding: 0 12px;
    border-radius: 6px;
    border: 1.5px solid var(--border, #e2e8f2);
    background: #fff; color: #64748b;
    font-family: var(--font-inter), Inter, sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: border-color .15s, color .15s, background .15s;
    flex-shrink: 0;
  }
  .quot-filter-btn:hover { border-color: #94a3c4; color: #1e293b; background: #f8faff; }
  .quot-filter-btn.is-open { border-color: #1A37AA; color: #1A37AA; background: #f0f4ff; }
  .quot-filter-btn.has-active { border-color: #1A37AA; color: #1A37AA; }
  .quot-filter-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 16px; height: 16px; padding: 0 4px;
    background: #1A37AA; color: #fff;
    border-radius: 10px; font-size: 9.5px; font-weight: 700; line-height: 1;
  }

  /* filter panel */
  .quot-filter-panel {
    border-top: 1px solid #eef1f8; border-bottom: 1px solid #eef1f8;
    background: #f8faff; padding: 14px 16px 16px;
  }
  .quot-filter-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  @media (min-width: 768px) {
    .quot-filter-grid { grid-template-columns: repeat(4, 1fr); }
  }
  .quot-filter-label {
    display: block; font-size: 10px; font-weight: 600;
    letter-spacing: .5px; text-transform: uppercase;
    color: #64748b; margin-bottom: 4px;
  }
  .quot-filter-input-wrap { position: relative; }
  .quot-filter-icon {
    position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
    color: #cbd5e1; pointer-events: none; display: flex; align-items: center;
  }
  .quot-filter-input {
    width: 100%; height: 36px; padding: 0 8px 0 30px;
    border: 1.5px solid #e2e8f2; border-radius: 6px;
    background: #fff; color: #1e293b;
    font-family: var(--font-inter), Inter, sans-serif;
    font-size: 13px; outline: none; box-sizing: border-box;
    transition: border-color .15s, box-shadow .15s;
  }
  .quot-filter-input::placeholder { color: #c0cce0; font-size: 12px; }
  .quot-filter-input:focus { border-color: #1A37AA; box-shadow: 0 0 0 3px rgba(26,55,170,.09); }
  .quot-filter-input.has-val { border-color: #93a8e8; background: #f4f7ff; }
  .quot-filter-input[type="date"] { color-scheme: light; }

  .quot-filter-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 10px; padding-top: 10px;
    border-top: 1px solid #f1f5f9;
  }
  .quot-filter-result {
    font-size: 11px; color: #94a3b8;
  }
  .quot-filter-result strong { color: #1A37AA; }
  .quot-filter-reset {
    font-size: 11.5px; font-weight: 600; color: #94a3b8;
    background: none; border: none; cursor: pointer;
    padding: 2px 6px; border-radius: 4px;
    transition: color .12s, background .12s;
  }
  .quot-filter-reset:hover { color: #ef4444; background: #fef2f2; }

  /* table wrap */
  .quot-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* table */
  .quot-table {
    width: 100%; border-collapse: collapse;
    font-family: var(--font-inter), Inter, sans-serif;
  }
  .quot-table thead { display: none; }
  .quot-table th {
    padding: 9px 14px;
    font-size: 11px; font-weight: 600;
    letter-spacing: .4px; text-transform: uppercase;
    color: var(--text-muted); text-align: left;
    background: #f8fafc;
    border-bottom: 1px solid #c8d0de;
    white-space: nowrap;
  }

  /* rows */
  .quot-table tbody tr {
    border-top: 1px solid #c8d0de;
    border-bottom: 1px solid #c8d0de;
    cursor: pointer;
    transition: background .1s;
  }
  .quot-table tbody tr + tr { border-top: none; }
  .quot-table tbody tr:hover { background: #f7f9ff; }

  .quot-table td {
    display: none;
    padding: 12px 14px;
    font-size: 13px; color: var(--text-primary);
    vertical-align: middle;
  }
  .quot-table td:first-child { display: block; }

  /* mobile row layout */
  .quot-mob-row {
    display: flex; flex-direction: column; gap: 3px;
    padding: 4px 0;
  }
  .quot-mob-top {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .quot-mob-num {
    font-size: 12.5px; font-weight: 700; color: #1A37AA;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    flex: 1; min-width: 0;
  }
  .quot-mob-sub {
    font-size: 11.5px; color: var(--text-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* desktop badge */
  .quot-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 4px;
    font-size: 10px; font-weight: 700;
    letter-spacing: .3px; text-transform: uppercase;
    flex-shrink: 0;
  }
  .quot-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
  .quot-badge--blue { background: #eef1fc; color: #1A37AA; }
  .quot-badge--blue .quot-badge-dot { background: #1A37AA; }
  .quot-badge--green { background: #edfaec; color: #236b21; }
  .quot-badge--green .quot-badge-dot { background: #236b21; }

  /* highlight */
  .quot-hl { background: #fde68a; border-radius: 2px; padding: 0 1px; color: #92400e; }

  /* loading / empty */
  @keyframes quot-spin { to { transform: rotate(360deg); } }
  .quot-empty {
    padding: 48px 16px; text-align: center;
  }
  .quot-empty-icon { color: #d0d8e8; margin-bottom: 10px; }
  .quot-empty-title { font-size: 14px; font-weight: 600; color: #8898aa; margin-bottom: 4px; }
  .quot-empty-sub { font-size: 12.5px; color: #aab4c4; }

  /* first-cell desktop/mobile toggle */
  .quot-desk-num { display: none; }
  .quot-mob-row  { display: flex; }

  /* desktop */
  @media (min-width: 768px) {
    .quot-topbar { padding: 20px 24px 14px; }
    .quot-title { font-size: 20px; }
    .quot-filter-panel { padding: 14px 24px 16px; }
    .quot-table thead { display: table-header-group; }
    .quot-table td { display: table-cell; }
    .quot-table td:first-child { display: table-cell; }
    .quot-mob-row  { display: none; }
    .quot-desk-num { display: block; }
    .quot-table-wrap { padding: 0; }
  }
`;

function Hl({ text, query }) {
  if (!query || !text) return <>{text || '—'}</>;
  const s = String(text);
  const idx = s.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{s}</>;
  return <>{s.slice(0, idx)}<mark className="quot-hl">{s.slice(idx, idx + query.length)}</mark>{s.slice(idx + query.length)}</>;
}

export default function QuotationsPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  const isAdminUser = isAdmin(userRole);

  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [navigatingId, setNavigatingId] = useState(null);
  const [open, setOpen]             = useState(false);

  const [fName,  setFName]  = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fDate,  setFDate]  = useState('');
  const [fNum,   setFNum]   = useState('');

  const DUMMY_QUOTATIONS = [
    { id: 'enq-001_1page', quotNo: 'USEPL/Q/2026-27/001', quotationType: '1page', company: 'Sri Balaji Rice Mill', contact: 'Rajesh Kumar', salutation: 'Mr.', mobile: '9876543210', email: 'rajesh@example.com', city: 'Nagpur', state: 'Maharashtra', model: 'USEPL-6V PINNACLE', total: '7788000', validity: 30, quotDate: '2026-04-20', createdAt: '2026-04-20T10:30:00Z' },
    { id: 'enq-002_detailed', quotNo: 'USEPL/Q/2026-27/002', quotationType: 'detailed', company: 'Sharma Agro Industries', contact: 'Amit Sharma', salutation: 'Mr.', mobile: '8765432109', email: 'amit@sharmaagro.in', city: 'Hyderabad', state: 'Telangana', model: 'USEPL-8V PINNACLE', total: '4720000', validity: 45, quotDate: '2026-04-18', createdAt: '2026-04-18T14:15:00Z' },
    { id: 'enq-004_1page', quotNo: 'USEPL/Q/2026-27/003', quotationType: '1page', company: 'Singh Dal Mill', contact: 'Vikram Singh', salutation: 'Mr.', mobile: '9988776655', email: '', city: 'Raipur', state: 'Chhattisgarh', model: 'USEPL-5V PINNACLE', total: '10620000', validity: 30, quotDate: '2026-04-12', createdAt: '2026-04-12T16:45:00Z' },
  ];

  useEffect(() => {
    fetch('/api/quotations')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) setRows(d.data);
        else setRows(DUMMY_QUOTATIONS);
      })
      .catch(() => setRows(DUMMY_QUOTATIONS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  const clearAll = useCallback(() => {
    setFName(''); setFEmail(''); setFDate(''); setFNum('');
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (fName)  { const n = `${r.company||''} ${r.contact||''}`.toLowerCase(); if (!n.includes(fName.toLowerCase())) return false; }
    if (fEmail) { if (!(r.email||'').toLowerCase().includes(fEmail.toLowerCase())) return false; }
    if (fDate)  { const d = (r.quotDate||r.savedAt||r.createdAt||'').slice(0,10); if (d !== fDate) return false; }
    if (fNum)   { const n = `${r.quotNo||''} ${r.refNo||''}`.toLowerCase(); if (!n.includes(fNum.toLowerCase())) return false; }
    return true;
  }), [rows, fName, fEmail, fDate, fNum]);

  const hasAny   = !!(fName || fEmail || fDate || fNum);
  const noResult = !loading && filtered.length === 0 && hasAny;

  const filterCount = [fName, fEmail, fDate, fNum].filter(Boolean).length;

  return (
    <div className="page-wrapper">
      <style>{CSS}</style>
      <div className="page-content quot-page">

        {/* top bar */}
        <div className="quot-topbar">
          <div className="quot-topbar-left">
            <span className="quot-title">Quotations</span>
            <span className="quot-count">
              {loading ? 'Loading…' : hasAny
                ? `${filtered.length} of ${rows.length}`
                : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <button
            className={`quot-filter-btn${open ? ' is-open' : ''}${hasAny && !open ? ' has-active' : ''}`}
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
            {!open && hasAny && <span className="quot-filter-count">{filterCount}</span>}
          </button>
        </div>

        {/* filter panel */}
        {open && (
          <div className="quot-filter-panel">
            <div className="quot-filter-grid">

              <div>
                <label className="quot-filter-label">Name / Company</label>
                <div className="quot-filter-input-wrap">
                  <input className={`quot-filter-input${fName ? ' has-val' : ''}`} placeholder="Search client or company…" value={fName} onChange={e => setFName(e.target.value)} autoFocus />
                  <span className="quot-filter-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                </div>
              </div>

              <div>
                <label className="quot-filter-label">Email</label>
                <div className="quot-filter-input-wrap">
                  <input className={`quot-filter-input${fEmail ? ' has-val' : ''}`} placeholder="Filter by email…" value={fEmail} onChange={e => setFEmail(e.target.value)} />
                  <span className="quot-filter-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                </div>
              </div>

              <div>
                <label className="quot-filter-label">Date</label>
                <div className="quot-filter-input-wrap">
                  <input className={`quot-filter-input${fDate ? ' has-val' : ''}`} type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                  <span className="quot-filter-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                </div>
              </div>

              <div>
                <label className="quot-filter-label">Quote No.</label>
                <div className="quot-filter-input-wrap">
                  <input className={`quot-filter-input${fNum ? ' has-val' : ''}`} placeholder="USEPL/Q…" value={fNum} onChange={e => setFNum(e.target.value)} />
                  <span className="quot-filter-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
                </div>
              </div>

            </div>

            <div className="quot-filter-footer">
              <span className={`quot-filter-result${noResult ? ' quot-result-none' : ''}`}>
                {loading ? 'Loading…' : noResult
                  ? <><strong style={{ color: '#ef4444' }}>0</strong> matches — try broadening filters</>
                  : <><strong>{filtered.length}</strong> of {rows.length} records match</>}
              </span>
              {hasAny && (
                <button className="quot-filter-reset" onClick={clearAll}>Reset all</button>
              )}
            </div>
          </div>
        )}

        {/* table */}
        <div className="quot-table-wrap">
          <table className="quot-table">
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Type</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Model</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Validity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ display: 'table-cell', textAlign: 'center', padding: '48px 0' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'quot-spin .8s linear infinite', display: 'inline-block' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ display: 'table-cell' }}>
                    <div className="quot-empty">
                      <div className="quot-empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div className="quot-empty-title">{hasAny ? 'No matching quotations' : 'No quotations yet'}</div>
                      <div className="quot-empty-sub">{hasAny ? 'Try adjusting your filters' : 'Quotations generated from enquiries will appear here'}</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => {
                const isDetailed = r.quotationType === 'detailed';
                const subParts = [
                  r.company,
                  r.contact ? `${r.salutation || ''} ${r.contact}`.trim() : null,
                  fmtINR(r.total),
                ].filter(Boolean);

                return (
                  <tr
                    key={r.id}
                    onClick={() => { setNavigatingId(r.id); router.push(`/dashboard/quotations/${r.id}`); }}
                  >
                    {/* mobile: first td shows all data */}
                    <td>
                      {/* mobile layout */}
                      <span className="quot-mob-row">
                        <span className="quot-mob-top">
                          <span className="quot-mob-num">
                            {navigatingId === r.id ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'quot-spin .8s linear infinite', display: 'inline-block', verticalAlign: 'middle' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : (
                              <Hl text={r.quotNo || r.refNo} query={fNum} />
                            )}
                          </span>
                          <span className={`quot-badge ${isDetailed ? 'quot-badge--green' : 'quot-badge--blue'}`}>
                            <span className="quot-badge-dot" />
                            {isDetailed ? 'Detailed' : '1-Page'}
                          </span>
                        </span>
                        <span className="quot-mob-sub">{subParts.join(' · ')}</span>
                      </span>

                      {/* desktop: just the quote number */}
                      <span className="quot-desk-num" style={{ fontWeight: 700, fontSize: 13, color: '#1A37AA' }}>
                        {navigatingId === r.id ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'quot-spin .8s linear infinite', display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                        ) : (
                          <Hl text={r.quotNo || r.refNo} query={fNum} />
                        )}
                      </span>
                    </td>

                    <td>
                      <span className={`quot-badge ${isDetailed ? 'quot-badge--green' : 'quot-badge--blue'}`}>
                        <span className="quot-badge-dot" />
                        {isDetailed ? 'Detailed' : '1-Page'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}><Hl text={r.company} query={fName} /></div>
                      {r.city && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.city}{r.state ? `, ${r.state}` : ''}</div>}
                    </td>

                    <td>
                      <div style={{ fontSize: 13 }}>{r.salutation} <Hl text={r.contact} query={fName} /></div>
                      {r.mobile && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.mobile}</div>}
                    </td>

                    <td style={{ fontSize: 12.5 }}>{r.model || r.descLine1 || '—'}</td>

                    <td style={{ fontWeight: 700, fontSize: 13 }}>{fmtINR(r.total)}</td>

                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{fmtDate(r.quotDate || r.savedAt || r.createdAt)}</td>

                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {r.validity ? `${r.validity} days` : r.quotationValidity ? `${r.quotationValidity} days` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
