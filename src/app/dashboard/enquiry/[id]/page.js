'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/rbac';
import { mapEnquiryToForm, INIT as INIT1 } from '@/components/QuotationForm';
import { mapEnquiryToForm2, INIT as INIT2 } from '@/components/QuotationForm2';

const MODELS  = ['Pinnacle','Nandak'];
const SIZES   = ['5','6','7','8','10'];
const STATES  = ['Telangana','Karnataka'];
const SOURCES = ['Cold Call','Reference','Exhibition','Online / Website','Social Media','Other'];

const PRICE_TABLE = {
  Telangana: { Pinnacle: { '5': 3000000, '6': 3300000, '7': 3600000, '8': 4000000, '10': 4700000 } },
  Karnataka: { Pinnacle: { '5': 3000000, '6': 3300000, '7': 3600000, '8': 4000000, '10': 4700000 } },
};
const getPrice = (state, model, size, qty) => {
  const base = PRICE_TABLE[state]?.[model]?.[size];
  if (!base) return '';
  const q = parseInt(qty) || 1;
  return String(base * q);
};

const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap');

  .eqd-root { min-height: 100vh; background: #eef0f5; font-family: 'DM Sans', sans-serif; }

  .eqd-content { max-width: 860px; margin: 0 auto; padding: 36px 32px 80px; }

  /* ── Page head ── */
  .eqd-page-head {
    margin-bottom: 32px; padding-bottom: 24px;
    border-bottom: 2px solid rgba(13,24,40,.08);
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .eqd-page-head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .eqd-page-head-center { min-width: 0; flex: 1; }
  .eqd-page-head-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #0d1828; letter-spacing: -.3px; }
  .eqd-page-head-sub { font-family: 'Inter', sans-serif; font-size: 13px; color: #6b7a90; margin-top: 4px; }
  .eqd-page-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* 3-dots more menu */
  .eqd-more-wrap { position: relative; }
  .eqd-more-btn {
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid #d8dfe8; background: #fff;
    color: #4a5568; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .eqd-more-btn:hover { border-color: #b0bbc9; color: #0d1828; background: #f8fafc; }
  .eqd-more-btn.active { border-color: #1A37AA; color: #1A37AA; background: #f0f4ff; }
  .eqd-more-dropdown {
    position: absolute; top: calc(100% + 6px); right: 0;
    background: #fff; border: 1px solid #e0e8f2; border-radius: 10px;
    padding: 5px; min-width: 160px; z-index: 200;
    box-shadow: 0 8px 28px rgba(13,24,40,.12), 0 2px 6px rgba(13,24,40,.06);
    animation: eqd-drop-in .15s cubic-bezier(.34,1.3,.64,1) both;
  }
  @keyframes eqd-drop-in { from { opacity:0; transform:translateY(-5px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  .eqd-more-item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 12px; border-radius: 7px;
    border: none; background: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: #0d1828; text-align: left; transition: background .1s;
  }
  .eqd-more-item:hover { background: #f4f7fd; }
  .eqd-more-item--danger { color: #c0392b; }
  .eqd-more-item--danger:hover { background: #fff5f5; }
  .eqd-more-sep { height: 1px; background: #f0f3f8; margin: 4px 6px; }

  /* ── Buttons ── */
  .eqd-btn {
    height: 36px; padding: 0 16px; border-radius: 8px;
    border: 1px solid #d8dfe8; background: #fff;
    color: #4a5568; font-size: 13px; font-family: 'DM Sans', sans-serif;
    font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: all .15s; text-decoration: none;
  }
  .eqd-btn:hover { border-color: #b0bbc9; color: #0d1828; }
  .eqd-btn--primary {
    border: none; background: #1A37AA; color: #fff; font-weight: 600;
    box-shadow: 0 2px 10px rgba(26,55,170,.35);
  }
  .eqd-btn--primary:hover { background: #1e42cc; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(26,55,170,.45); color: #fff; }
  .eqd-btn--danger { border-color: rgba(224,85,85,.4); color: #c0392b; background: rgba(224,85,85,.06); }
  .eqd-btn--danger:hover { background: rgba(224,85,85,.12); border-color: rgba(224,85,85,.6); color: #c0392b; }
  .eqd-btn--danger-confirm { border: none; background: #c0392b; color: #fff; }
  .eqd-btn--danger-confirm:hover { background: #a93226; color: #fff; transform: none; }
  .eqd-btn--edit-active { background: rgba(26,55,170,.08); border-color: rgba(26,55,170,.35); color: #1A37AA; }

  /* ── Section dividers ── */
  .eqd-divider { display: flex; align-items: center; gap: 14px; margin: 36px 0 20px; }
  .eqd-divider:first-child { margin-top: 0; }
  .eqd-divider-num {
    width: 24px; height: 24px; border-radius: 50%;
    background: #1A37AA; color: #fff;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .eqd-divider-label { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: #0d1828; letter-spacing: .1px; white-space: nowrap; }
  .eqd-divider-line { flex: 1; height: 1px; background: rgba(13,24,40,.1); }

  /* ── Grid ── */
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .full { grid-column: 1 / -1; }
  .mt { margin-top: 16px; }

  /* ── Field ── */
  .eqd-f { display: flex; flex-direction: column; gap: 5px; }
  .eqd-lbl { font-size: 11px; font-weight: 600; color: #4a5568; letter-spacing: .3px; }
  .eqd-val {
    font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    color: #0d1828; font-weight: 500; padding: 10px 13px;
    background: #f4f6fa; border: 1.5px solid #e8edf4;
    border-radius: 8px; line-height: 1.5; min-height: 42px;
  }
  .eqd-val.muted { color: #6b7a90; font-weight: 400; }
  .eqd-val.empty { color: #b0bbc9; font-style: italic; font-weight: 400; }

  /* ── Inputs (edit mode) ── */
  .eqd-in, .eqd-sel, .eqd-ta {
    width: 100%; border: 1.5px solid #d8dfe8; border-radius: 8px;
    padding: 10px 13px; font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    color: #0d1828; background: #fff; line-height: 1.5;
    transition: border-color .18s, box-shadow .18s; outline: none;
  }
  .eqd-in::placeholder, .eqd-ta::placeholder { color: #b0bbc9; }
  .eqd-in:focus, .eqd-sel:focus, .eqd-ta:focus { border-color: #1A37AA; box-shadow: 0 0 0 3px rgba(26,55,170,.1); }
  .eqd-sel {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%238898aa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
  }
  .eqd-ta { resize: vertical; min-height: 80px; }

  /* ── Requirement status badge ── */
  .eqd-req-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; width: fit-content;
  }
  .eqd-req-badge.immediate { background: rgba(82,186,79,.08); border: 1.5px solid rgba(82,186,79,.5); color: #2e8c2b; }
  .eqd-req-badge.future { background: rgba(232,160,32,.1); border: 1.5px solid rgba(232,160,32,.4); color: #b07d10; }

  /* ── Toggle (edit mode) ── */
  .eqd-toggle { display: flex; gap: 10px; margin-top: 4px; }
  .eqd-toggle-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 24px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    border: 1.5px solid #d8dfe8; background: #fff; color: #4a5568; transition: all .18s;
  }
  .eqd-toggle-btn:hover { border-color: #b0bbc9; color: #0d1828; }
  .eqd-toggle-btn--yes { background: rgba(82,186,79,.08); border-color: rgba(82,186,79,.5); color: #2e8c2b; }
  .eqd-toggle-btn--no  { background: rgba(224,85,85,.07); border-color: rgba(224,85,85,.4); color: #c0392b; }

  /* ── Item cards ── */
  .eqd-items { display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
  .eqd-item { border: 1.5px solid #e0e8f0; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 2px 8px rgba(13,24,40,.04); }
  .eqd-item-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 16px; background: #0d1828; border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .eqd-item-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.7); text-transform: uppercase; letter-spacing: .8px; }
  .eqd-item-body { padding: 16px; }

  /* ── Future section ── */
  .eqd-future-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; background: rgba(232,160,32,.1);
    border: 1px solid rgba(232,160,32,.35); border-radius: 8px;
    font-size: 12px; font-weight: 600; color: #b07d10; margin-bottom: 14px;
  }

  /* ── Footer ── */
  .eqd-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    margin-top: 36px; padding-top: 24px; border-top: 2px solid rgba(13,24,40,.08);
    flex-wrap: wrap;
  }
  .eqd-footer-meta { font-size: 12.5px; color: #8898aa; }
  .eqd-footer-meta strong { color: #4a5568; font-weight: 600; }
  .eqd-footer-actions { display: flex; align-items: center; gap: 10px; }
  .eqd-err { font-size: 12px; color: #c0392b; font-weight: 500; }

  @keyframes eqd-spin { to { transform: rotate(360deg); } }

  /* ── Confirm popup ── */
  .eqd-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(10, 18, 30, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    opacity: 0; animation: eqd-fade-in 0.2s ease forwards;
  }
  @keyframes eqd-fade-in { to { opacity: 1; } }

  .eqd-popup {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #e0e8f2;
    box-shadow: 0 24px 64px rgba(13, 24, 40, 0.18), 0 4px 16px rgba(13, 24, 40, 0.08);
    width: 100%; max-width: 440px;
    overflow: hidden;
    transform: translateY(16px) scale(0.97);
    animation: eqd-pop-in 0.25s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
  }
  @keyframes eqd-pop-in { to { transform: translateY(0) scale(1); } }

  .eqd-popup-head {
    background: #111c2d;
    background-image: linear-gradient(135deg, #0d1829 0%, #111c2d 60%, #0e1f38 100%);
    padding: 24px 28px 20px;
    position: relative; overflow: hidden;
  }
  .eqd-popup-head::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(26,55,170,0.5), rgba(26,55,170,0.2), transparent);
  }
  .eqd-popup-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #1A37AA, #2549cc);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(26,55,170,0.45);
    margin-bottom: 14px;
  }
  .eqd-popup-title {
    font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 700;
    color: #fff; letter-spacing: -0.2px; line-height: 1.3;
  }
  .eqd-popup-subtitle {
    font-size: 12.5px; color: rgba(255,255,255,0.45);
    margin-top: 3px; font-family: 'DM Sans', sans-serif;
  }

  .eqd-popup-body { padding: 22px 28px; }

  .eqd-popup-summary {
    background: #f4f7fd;
    border: 1.5px solid #e0e8f4;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 18px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .eqd-popup-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .eqd-popup-row-lbl {
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; color: #8898aa;
    flex-shrink: 0;
  }
  .eqd-popup-row-val {
    font-size: 13px; font-weight: 600; color: #0d1828;
    text-align: right;
  }
  .eqd-popup-row-val.blue { color: #1A37AA; }

  .eqd-popup-actions { display: flex; gap: 10px; }
  .eqd-popup-cancel {
    flex: 1; height: 42px; border-radius: 10px;
    border: 1.5px solid #d8dfe8; background: #fff;
    color: #4a5568; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.15s;
  }
  .eqd-popup-cancel:hover { border-color: #b0bbc9; color: #0d1828; background: #f8f9fc; }
  .eqd-popup-confirm {
    flex: 2; height: 42px; border-radius: 10px;
    border: none; background: linear-gradient(135deg, #1A37AA, #2549cc);
    color: #fff; font-size: 13.5px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 14px rgba(26,55,170,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
    transition: box-shadow 0.15s, transform 0.12s;
  }
  .eqd-popup-confirm:hover { box-shadow: 0 6px 20px rgba(26,55,170,0.45); transform: translateY(-1px); }
  .eqd-popup-confirm:active { transform: translateY(0); }
  .eqd-popup-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Quotation type selector ── */
  .eqd-qtype-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .eqd-qtype-opt {
    position: relative; cursor: pointer;
    border: 2px solid #e0e8f4; border-radius: 12px;
    padding: 14px 14px 14px 16px;
    background: #f8faff;
    transition: border-color .18s, background .18s, box-shadow .18s;
    display: flex; flex-direction: column; gap: 4px;
  }
  .eqd-qtype-opt:hover { border-color: #b8c8ee; background: #f2f6ff; }
  .eqd-qtype-opt.selected {
    border-color: #1A37AA;
    background: linear-gradient(135deg, rgba(26,55,170,0.06) 0%, rgba(37,73,204,0.04) 100%);
    box-shadow: 0 0 0 3px rgba(26,55,170,0.1), inset 0 1px 0 rgba(26,55,170,0.06);
  }
  .eqd-qtype-opt input { position: absolute; opacity: 0; pointer-events: none; }
  .eqd-qtype-radio {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid #c8d4e8; background: #fff;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px; flex-shrink: 0; transition: border-color .18s;
  }
  .eqd-qtype-opt.selected .eqd-qtype-radio {
    border-color: #1A37AA;
    background: #1A37AA;
  }
  .eqd-qtype-radio-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #fff; opacity: 0; transform: scale(0);
    transition: opacity .15s, transform .2s cubic-bezier(0.34,1.4,0.64,1);
  }
  .eqd-qtype-opt.selected .eqd-qtype-radio-dot { opacity: 1; transform: scale(1); }
  .eqd-qtype-name {
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
    color: #0d1828; line-height: 1.2;
  }
  .eqd-qtype-desc {
    font-family: 'DM Sans', sans-serif; font-size: 11.5px; color: #8898aa; line-height: 1.4;
  }
  .eqd-qtype-opt.selected .eqd-qtype-name { color: #1A37AA; }
  .eqd-qtype-opt.selected .eqd-qtype-desc { color: #5a7ac0; }
  .eqd-qtype-tag {
    display: inline-block; margin-top: 6px;
    padding: 2px 7px; border-radius: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
    font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase;
  }
  .eqd-qtype-tag--compact { background: rgba(82,186,79,.12); color: #2e8c2b; }
  .eqd-qtype-tag--full    { background: rgba(26,55,170,.1);  color: #1A37AA; }

  /* ── Popup customer banner ── */
  .eqd-popup-cust-banner {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 18px;
  }
  .eqd-popup-cust-avatar {
    width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #1A37AA 0%, #2549cc 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 800;
    color: #fff; letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(26,55,170,.3);
  }
  .eqd-popup-cust-info { flex: 1; min-width: 0; }
  .eqd-popup-cust-name {
    font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
    color: #0d1828; letter-spacing: -0.2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .eqd-popup-cust-sub {
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: #8898aa;
    margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Overwrite warning ── */
  .eqd-overwrite-warn {
    background: #fff8ed; border: 1.5px solid #f0a500;
    border-radius: 10px; padding: 13px 15px; margin-bottom: 18px;
    display: flex; gap: 12px; align-items: flex-start;
  }
  .eqd-overwrite-warn-icon {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: #fef0cc; display: flex; align-items: center; justify-content: center;
  }
  .eqd-overwrite-warn-title {
    font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 700;
    color: #92530a; margin-bottom: 3px;
  }
  .eqd-overwrite-warn-body {
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: #a0660f; line-height: 1.5;
  }
  .eqd-overwrite-warn-body strong { font-weight: 700; color: #7a4800; }
  .eqd-confirm-overwrite {
    flex: 2; height: 42px; padding: 0 16px; border-radius: 10px; border: none; cursor: pointer;
    background: #d97706; color: #fff;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .15s, box-shadow .15s;
  }
  .eqd-confirm-overwrite:hover { background: #b45309; box-shadow: 0 4px 14px rgba(217,119,6,.35); }
  .eqd-confirm-overwrite:disabled { opacity: .6; cursor: not-allowed; }

  /* Hide mobile elements on desktop */
  .eqd-overwrite-warn-inline { display: none; }

  /* ── Mobile Optimized Quotation Selector (CRM-style) ── */
  @media (max-width: 640px) {
    /* Show mobile warning, hide desktop */
    .eqd-overwrite-warn-desktop { display: none; }
    .eqd-overwrite-warn-inline { display: flex; }
    /* Compact customer header */
    .eqd-popup-cust-banner {
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e8edf4;
    }
    .eqd-popup-cust-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(26,55,170,.25);
    }
    .eqd-popup-cust-name {
      font-size: 13px;
    }
    .eqd-popup-cust-sub {
      font-size: 11px;
      margin-top: 1px;
    }

    /* Compact section label */
    .eqd-qtype-section-label {
      font-size: 10px !important;
      margin-bottom: 8px !important;
    }

    /* Compact radio list instead of cards */
    .eqd-qtype-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .eqd-qtype-opt {
      flex-direction: row;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      border-width: 1.5px;
      gap: 10px;
    }
    .eqd-qtype-opt.selected {
      box-shadow: 0 0 0 2px rgba(26,55,170,0.08);
    }
    .eqd-qtype-radio {
      width: 18px;
      height: 18px;
      margin-bottom: 0;
      border-width: 2px;
    }
    .eqd-qtype-radio-dot {
      width: 7px;
      height: 7px;
    }
    .eqd-qtype-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .eqd-qtype-name {
      font-size: 12px;
      line-height: 1.3;
    }
    .eqd-qtype-desc {
      font-size: 10px;
      line-height: 1.35;
      color: #6b7a90;
    }
    .eqd-qtype-tag {
      margin-top: 0;
      margin-left: auto;
      padding: 2px 6px;
      font-size: 9px;
      border-radius: 4px;
      white-space: nowrap;
    }

    /* Compact inline warning */
    .eqd-overwrite-warn-inline {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      margin-bottom: 12px;
      background: #fff8ed;
      border: 1px solid #f0d0a0;
      border-radius: 6px;
      font-size: 11px;
      line-height: 1.4;
      color: #8b5a00;
    }
    .eqd-overwrite-warn-inline svg {
      flex-shrink: 0;
      margin-top: 1px;
    }
    .eqd-overwrite-warn-inline strong {
      font-weight: 600;
      color: #6b4200;
    }

    /* Compact buttons side by side */
    .eqd-popup-actions {
      flex-direction: row;
      gap: 8px;
    }
    .eqd-popup-cancel,
    .eqd-popup-confirm,
    .eqd-confirm-overwrite {
      flex: 1;
      height: 38px;
      font-size: 12px;
      border-radius: 8px;
    }

    /* Reduce popup padding */
    .eqd-popup-body {
      padding: 14px 16px;
    }
    .eqd-popup-head {
      padding: 16px 16px 14px;
    }
    .eqd-popup-icon {
      width: 36px;
      height: 36px;
      margin-bottom: 10px;
    }
    .eqd-popup-title {
      font-size: 15px;
    }
    .eqd-popup-subtitle {
      font-size: 11px;
    }
  }

  @media (max-width: 400px) {
    .eqd-popup-body {
      padding: 12px 14px;
    }
    .eqd-qtype-opt {
      padding: 9px 10px;
    }
    .eqd-qtype-name {
      font-size: 11.5px;
    }
    .eqd-qtype-desc {
      font-size: 9.5px;
    }
    .eqd-popup-cancel,
    .eqd-popup-confirm,
    .eqd-confirm-overwrite {
      height: 36px;
      font-size: 11.5px;
    }
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .eqd-content { padding: 20px 16px 60px; }
    .g2, .g3 { grid-template-columns: 1fr; gap: 12px; }
    .eqd-page-head { flex-direction: row; align-items: center; gap: 10px; }
    .eqd-page-head-title { font-size: 18px; }
    .eqd-page-head-actions { flex-shrink: 0; }
    .eqd-btn { height: 40px; font-size: 12px; min-height: 44px; }
    .eqd-footer { flex-direction: column; align-items: stretch; gap: 12px; }
    .eqd-footer-actions { width: 100%; }
    .eqd-btn--primary { width: 100%; justify-content: center; }
    .eqd-divider { margin: 24px 0 16px; gap: 10px; }
    .eqd-divider-label { font-size: 12px; }
    .eqd-toggle { flex-direction: column; gap: 8px; }
    .eqd-toggle-btn { width: 100%; justify-content: center; min-height: 44px; }
    .eqd-in, .eqd-sel, .eqd-ta { font-size: 16px; min-height: 44px; }
    .eqd-val { font-size: 13px; padding: 8px 12px; }
    .eqd-item-body { padding: 14px; }
    /* Popup responsive */
    .eqd-popup { max-width: calc(100vw - 24px); }
    .eqd-popup-head { padding: 20px 20px 16px; }
    .eqd-popup-body { padding: 18px 20px; }
    .eqd-qtype-grid { grid-template-columns: 1fr; }
    .eqd-popup-actions { flex-direction: column; }
    .eqd-popup-cancel, .eqd-popup-confirm, .eqd-confirm-overwrite { flex: none; width: 100%; }
  }

  /* ── Extra small ── */
  @media (max-width: 400px) {
    .eqd-content { padding: 16px 12px 48px; }
    .eqd-page-head-title { font-size: 16px; }
    .eqd-in, .eqd-sel, .eqd-ta { padding: 8px 10px; }
  }

  /* ── Tablet ── */
  @media (min-width: 641px) and (max-width: 1023px) {
    .eqd-content { padding: 28px 24px 70px; }
  }
`;

function Divider({ num, label }) {
  return (
    <div className="eqd-divider">
      <span className="eqd-divider-num">{num}</span>
      <span className="eqd-divider-label">{label}</span>
      <span className="eqd-divider-line" />
    </div>
  );
}

function Field({ label, cls, children }) {
  return (
    <div className={`eqd-f${cls ? ` ${cls}` : ''}`}>
      <label className="eqd-lbl">{label}</label>
      {children}
    </div>
  );
}

function Val({ v, muted }) {
  if (!v) return <div className="eqd-val empty">—</div>;
  return <div className={`eqd-val${muted ? ' muted' : ''}`}>{v}</div>;
}

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { userRole, getAuthHeaders } = useAuth();
  const isAdminUser = isAdmin(userRole);

  const [row,     setRow]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr,setFetchErr]= useState('');

  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState({});
  const [saving,  setSaving]    = useState(false);
  const [saveErr, setSaveErr]   = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const [quotationType, setQuotationType] = useState('1page');
  const [existingQuotType, setExistingQuotType] = useState(null); // existing quotation type if any
  const [overwriting, setOverwriting]       = useState(false);

  // Dummy data for when Firebase is unavailable
  const DUMMY_ENQUIRIES = {
    'enq-001': { id: 'enq-001', customerName: 'Rajesh Kumar', millName: 'Sri Balaji Rice Mill', mobile: '9876543210', email: 'rajesh@example.com', gst: '27AABCU9603R1ZM', location: 'Nagpur', state: 'Telangana', address: 'Plot No 45, Industrial Area, MIDC Nagpur, Maharashtra 440001', source: 'Exhibition', hasRequirement: true, commodity: 'Rice', remarks: 'Customer visited our stall at Agri Expo 2026. Very interested in Pinnacle series.', createdAt: '2026-04-20T10:30:00Z', items: [{ modelNo: 'Pinnacle', size: '6', qty: '2', price: '6600000' }] },
    'enq-002': { id: 'enq-002', customerName: 'Amit Sharma', millName: 'Sharma Agro Industries', mobile: '8765432109', email: 'amit@sharmaagro.in', gst: '36AADCS1234F1Z5', location: 'Hyderabad', state: 'Telangana', address: '12-3-456, Balanagar Industrial Area, Hyderabad 500037', source: 'Reference', hasRequirement: true, commodity: 'Pulses', remarks: 'Referred by existing client Ravi Enterprises.', createdAt: '2026-04-18T14:15:00Z', items: [{ modelNo: 'Pinnacle', size: '8', qty: '1', price: '4000000' }] },
    'enq-003': { id: 'enq-003', customerName: 'Priya Patel', millName: 'Patel Foods Pvt Ltd', mobile: '7654321098', email: 'priya@patelfoods.com', gst: '29AABCP5678G1ZK', location: 'Bangalore', state: 'Karnataka', address: 'Survey No 78, Peenya Industrial Estate, Bangalore 560058', source: 'Cold Call', hasRequirement: false, commodity: 'Multiproduct', createdAt: '2026-04-15T09:00:00Z', futureNote: 'Interested in Pinnacle 10 for new plant expansion in Q3. Currently finalizing land acquisition.', followUpDate: '2026-05-15', probableMonth: 'August 2026', orderChances: '60' },
    'enq-004': { id: 'enq-004', customerName: 'Vikram Singh', millName: 'Singh Dal Mill', mobile: '9988776655', email: '', gst: '', location: 'Raipur', state: 'Telangana', address: 'Near Hanuman Temple, Budhapara, Raipur, Chhattisgarh 492001', source: 'Online / Website', hasRequirement: true, commodity: 'Rice', createdAt: '2026-04-12T16:45:00Z', items: [{ modelNo: 'Pinnacle', size: '5', qty: '3', price: '9000000' }] },
    'enq-005': { id: 'enq-005', customerName: 'Sunita Devi', millName: 'Devi Rice Processing', mobile: '8877665544', email: 'sunita@devirice.in', gst: '36AABCD9012E1Z8', location: 'Warangal', state: 'Telangana', address: 'Plot 22, Food Processing Park, Warangal 506002', source: 'Social Media', hasRequirement: false, commodity: 'Rice', createdAt: '2026-04-10T11:20:00Z', futureNote: 'Planning to upgrade existing sorting line next year. Wants detailed specs for Pinnacle 8.', followUpDate: '2026-06-01', probableMonth: 'January 2027', orderChances: '40' },
  };

  useEffect(() => {
    const TERM_DEFAULTS = {
      payTerms:     '50% advance with Purchase Order and balance before despatch.',
      commodity:    'Rice',
      electricity:  '220 V Frequency- 50Hz.',
      freight:      'At actual in your scope.',
      warranty:     'One year.',
      cancellation: 'Order once confirmed & processed cannot be cancelled.',
    };
    const normPrice = p => {
      if (!p) return '';
      if (/₹|L$/i.test(String(p))) {
        const n = parseFloat(String(p).replace(/[^\d.]/g, ''));
        return isNaN(n) ? '' : String(Math.round(n * 100000));
      }
      return p;
    };
    const applyDefaults = (data) => {
      const raw = { ...TERM_DEFAULTS, ...data };
      if (raw.items) raw.items = raw.items.map(it => ({ ...it, price: normPrice(it.price) }));
      setRow(raw);
      setDraft(raw);
    };

    fetch(`/api/enquiry/${id}`, { headers: { ...getAuthHeaders() } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          applyDefaults(d.data);
        } else {
          // Fallback to dummy data
          const dummy = DUMMY_ENQUIRIES[id];
          if (dummy) applyDefaults(dummy);
          else setFetchErr('Not found');
        }
      })
      .catch(() => {
        // Fallback to dummy data
        const dummy = DUMMY_ENQUIRIES[id];
        if (dummy) applyDefaults(dummy);
        else setFetchErr('Failed to load');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setDraft(d => {
    const updated = { ...d, [k]: v };
    if (k === 'state') {
      updated.items = (d.items || []).map(it => ({ ...it, price: getPrice(v, it.modelNo, it.size, it.qty) }));
    }
    return updated;
  });
  const setItem = (idx, k, v) => setDraft(d => {
    const items = [...(d.items || [])];
    const updated = { ...items[idx], [k]: v };
    if (k !== 'price') {
      const auto = getPrice(d.state, updated.modelNo, updated.size, updated.qty);
      if (auto) updated.price = auto;
    }
    items[idx] = updated;
    return { ...d, items };
  });

  const handleSave = async () => {
    setSaving(true); setSaveErr('');
    try {
      const payload = { ...draft, _editedBy: 'Admin Staff' };
      const res  = await fetch(`/api/enquiry/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setRow({ ...draft });
      setEditing(false);
    } catch (e) { setSaveErr(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/enquiry/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');
      router.push('/dashboard/enquiry');
    } catch (e) { setSaveErr(e.message); setConfirmDel(false); }
    finally { setDeleting(false); }
  };

  const cancelEdit = () => { setEditing(false); setDraft({ ...row }); setSaveErr(''); };

  /* ── Loading / error ── */
  if (loading) return (
    <div className="page-wrapper">
      <style>{CSS}</style>
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A37AA" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'eqd-spin 0.8s linear infinite', display: 'inline-block' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes eqd-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (fetchErr) return (
    <div className="page-wrapper">
      <style>{CSS}</style>
      <div className="eqd-content">
        <p style={{ color: '#c0392b', fontSize: 14 }}>⚠ {fetchErr}</p>
        <Link href="/dashboard/enquiry" style={{ color: '#1A37AA', fontSize: 13, marginTop: 12, display: 'inline-block' }}>← Back to enquiries</Link>
      </div>
    </div>
  );

  const openGenPopup = async () => {
    // Check if any quotation already exists for this enquiry
    const types = ['1page', 'detailed'];
    const results = await Promise.all(
      types.map(t => fetch(`/api/quotations/${id}_${t}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()).catch(() => ({ success: false })))
    );
    const found = types.find((t, i) => results[i].success && results[i].data) || null;
    setExistingQuotType(found);
    // If a quotation exists, default to that type so user sees what they have
    // User must explicitly switch to the other type (which will trigger the warning)
    setQuotationType(found || '1page');
    setShowGenConfirm(true);
  };

  const handleGenConfirm = async (router) => {
    if (existingQuotType) {
      setOverwriting(true);
      await fetch(`/api/quotations/${id}_${existingQuotType}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).catch(() => {});
      setOverwriting(false);
    }
    setOverwriting(true);
    try {
      const mapped = quotationType === 'detailed' ? mapEnquiryToForm2(row) : mapEnquiryToForm(row);
      const base    = Math.round(parseFloat(mapped.basePrice) || 0);
      const gstRate = parseFloat(mapped.gstRate ?? mapped.gst ?? 18) || 0;
      const gstAmt  = Math.round(base * gstRate / 100);
      const total   = base + gstAmt;
      const payload = {
        enquiryId: id,
        quotationType,
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
      const docId = data.id || `${id}_${quotationType}`;
      setShowGenConfirm(false);
      router.push(`/dashboard/quotations/${docId}`);
    } catch {
      setOverwriting(false);
    }
  };

  const isImmediate = draft.hasRequirement === true;

  return (
    <div className="page-wrapper">
      <style>{CSS}</style>
      <div className="eqd-root">
        <div className="eqd-content">

          {/* ── Page head ── */}
          <div className="eqd-page-head">
            <div className="eqd-page-head-center">
              <div className="eqd-page-head-title">{row.customerName}</div>
              <div className="eqd-page-head-sub">{row.millName || 'Enquiry Detail'} &nbsp;·&nbsp; Added {fmtDate(row.createdAt)}</div>
            </div>

            <div className="eqd-page-head-actions">
              {/* confirm delete inline */}
              {confirmDel && (
                <>
                  <button className="eqd-btn eqd-btn--danger-confirm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button className="eqd-btn" onClick={() => setConfirmDel(false)}>Cancel</button>
                </>
              )}
              {editing && !confirmDel && (
                <button className="eqd-btn" onClick={cancelEdit}>Cancel</button>
              )}

              {/* 3-dots — admin only */}
              {isAdminUser && !confirmDel && (
                <div className="eqd-more-wrap" ref={moreRef}>
                  <button
                    className={`eqd-more-btn${showMore ? ' active' : ''}`}
                    onClick={() => setShowMore(v => !v)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                  {showMore && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowMore(false)} />
                      <div className="eqd-more-dropdown">
                        <button className="eqd-more-item" onClick={() => { setEditing(true); setConfirmDel(false); setShowMore(false); }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <div className="eqd-more-sep" />
                        <button className="eqd-more-item eqd-more-item--danger" onClick={() => { setConfirmDel(true); setEditing(false); setShowMore(false); }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Section 1: Customer ── */}
          <Divider num="1" label="Customer Information" />
          <div className="g2">
            <Field label="Customer Name">
              {editing ? <input className="eqd-in" value={draft.customerName || ''} onChange={e => set('customerName', e.target.value)} /> : <Val v={draft.customerName} />}
            </Field>
            <Field label="Mill / Company Name">
              {editing ? <input className="eqd-in" value={draft.millName || ''} onChange={e => set('millName', e.target.value)} /> : <Val v={draft.millName} muted />}
            </Field>
            <Field label="Mobile No.">
              {editing ? <input className="eqd-in" value={draft.mobile || ''} onChange={e => set('mobile', e.target.value)} /> : <Val v={draft.mobile} />}
            </Field>
            <Field label="Email Address">
              {editing ? <input className="eqd-in" value={draft.email || ''} onChange={e => set('email', e.target.value)} /> : <Val v={draft.email} muted />}
            </Field>
            <Field label="GST No.">
              {editing ? <input className="eqd-in" value={draft.gst || ''} onChange={e => set('gst', e.target.value.toUpperCase())} maxLength={15} /> : <Val v={draft.gst} muted />}
            </Field>
            <Field label="Lead Source">
              {editing ? (
                <select className="eqd-sel" value={draft.source || ''} onChange={e => set('source', e.target.value)}>
                  <option value="">Select source</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <Val v={draft.source} muted />}
            </Field>
          </div>

          {/* ── Section 2: Location ── */}
          <Divider num="2" label="Location Details" />
          <div className="g2">
            <Field label="City / Location">
              {editing ? <input className="eqd-in" value={draft.location || ''} onChange={e => set('location', e.target.value)} /> : <Val v={draft.location} />}
            </Field>
            <Field label="State">
              {editing ? (
                <select className="eqd-sel" value={draft.state || ''} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <Val v={draft.state} muted />}
            </Field>
            <Field label="Full Address" cls="full">
              {editing ? <textarea className="eqd-ta" rows={3} value={draft.address || ''} onChange={e => set('address', e.target.value)} /> : <Val v={draft.address} muted />}
            </Field>
          </div>

          {/* ── Section 3: Requirement ── */}
          <Divider num="3" label="Requirement" />

          <Field label="Requirement Type">
            {editing ? (
              <div className="eqd-toggle">
                <button type="button" className={`eqd-toggle-btn${draft.hasRequirement === true ? ' eqd-toggle-btn--yes' : ''}`} onClick={() => set('hasRequirement', true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Yes — Immediate
                </button>
                <button type="button" className={`eqd-toggle-btn${draft.hasRequirement === false ? ' eqd-toggle-btn--no' : ''}`} onClick={() => set('hasRequirement', false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  No — Future
                </button>
              </div>
            ) : (
              <div className={`eqd-req-badge ${isImmediate ? 'immediate' : 'future'}`}>
                {isImmediate ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Yes — Immediate</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>No — Future</>
                )}
              </div>
            )}
          </Field>

          {/* Immediate items */}
          {isImmediate && draft.items?.length > 0 && (
            <div className="eqd-items">
              {draft.items.map((item, idx) => (
                <div key={idx} className="eqd-item">
                  <div className="eqd-item-head">
                    <span className="eqd-item-label">Item {idx + 1}</span>
                  </div>
                  <div className="eqd-item-body">
                    <div className="g2">
                      <Field label="Model">
                        {editing ? (
                          <select className="eqd-sel" value={item.modelNo || ''} onChange={e => setItem(idx, 'modelNo', e.target.value)}>
                            <option value="">Select model</option>
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        ) : <Val v={item.modelNo} />}
                      </Field>
                      <Field label="Size">
                        {editing ? (
                          <select className="eqd-sel" value={item.size || ''} onChange={e => setItem(idx, 'size', e.target.value)}>
                            <option value="">Select size</option>
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : <Val v={item.size} muted />}
                      </Field>
                      <Field label="Quantity">
                        {editing ? <input className="eqd-in" value={item.qty || ''} onChange={e => setItem(idx, 'qty', e.target.value)} /> : <Val v={item.qty} />}
                      </Field>
                      <Field label="Price">
                        {editing
                          ? <input className="eqd-in" value={item.price || ''} onChange={e => setItem(idx, 'price', e.target.value)} placeholder="Auto-filled based on state & size" />
                          : <Val v={item.price} />}
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Future fields */}
          {!isImmediate && (
            <div style={{ marginTop: 16 }}>
              <div className="eqd-future-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Future Requirement
              </div>
              <div className="g2">
                <Field label="Requirement Update / Notes" cls="full">
                  {editing ? <textarea className="eqd-ta" rows={4} value={draft.futureNote || ''} onChange={e => set('futureNote', e.target.value)} /> : <Val v={draft.futureNote} muted />}
                </Field>
                <Field label="Next Follow-up Date">
                  {editing ? <input className="eqd-in" type="date" value={draft.followUpDate || ''} onChange={e => set('followUpDate', e.target.value)} /> : <Val v={draft.followUpDate} />}
                </Field>
                <Field label="Probable Month of Order">
                  {editing ? <input className="eqd-in" placeholder="e.g. June 2025" value={draft.probableMonth || ''} onChange={e => set('probableMonth', e.target.value)} /> : <Val v={draft.probableMonth} muted />}
                </Field>
                <Field label="% Chances of Order">
                  {editing ? <input className="eqd-in" placeholder="e.g. 70%" value={draft.orderChances || ''} onChange={e => set('orderChances', e.target.value)} /> : <Val v={draft.orderChances ? `${draft.orderChances}%` : null} muted />}
                </Field>
              </div>
            </div>
          )}

          {/* ── Section 4: Quotation Terms ── */}
          <Divider num="4" label="Quotation Terms" />
          <div className="g2">
            <Field label="Payment Terms" cls="full">
              {editing
                ? <textarea className="eqd-ta" rows={2} value={draft.payTerms || ''} onChange={e => set('payTerms', e.target.value)} placeholder="50% advance with Purchase Order and balance before despatch." />
                : <Val v={draft.payTerms} muted />}
            </Field>
            <Field label="Point of Delivery" cls="full">
              {editing
                ? <input className="eqd-in" value={draft.delivery || ''} onChange={e => set('delivery', e.target.value)} placeholder="e.g. Budhapara Near Hanuman Temple, Raipur" />
                : <Val v={draft.delivery} muted />}
            </Field>
            <Field label="Commodity">
              {editing
                ? <input className="eqd-in" value={draft.commodity || ''} onChange={e => set('commodity', e.target.value)} placeholder="Rice" />
                : <Val v={draft.commodity} muted />}
            </Field>
            <Field label="Validity (Days)">
              {editing
                ? <input className="eqd-in" value={draft.validity || ''} onChange={e => set('validity', e.target.value)} placeholder="90" />
                : <Val v={draft.validity ? `${draft.validity} Days` : null} muted />}
            </Field>
            <Field label="Electricity Supply">
              {editing
                ? <input className="eqd-in" value={draft.electricity || ''} onChange={e => set('electricity', e.target.value)} placeholder="220 V Frequency- 50Hz." />
                : <Val v={draft.electricity} muted />}
            </Field>
            <Field label="Freight">
              {editing
                ? <input className="eqd-in" value={draft.freight || ''} onChange={e => set('freight', e.target.value)} placeholder="At actual in your scope." />
                : <Val v={draft.freight} muted />}
            </Field>
            <Field label="Warranty">
              {editing
                ? <input className="eqd-in" value={draft.warranty || ''} onChange={e => set('warranty', e.target.value)} placeholder="One year." />
                : <Val v={draft.warranty} muted />}
            </Field>
            <Field label="Cancellation Policy">
              {editing
                ? <textarea className="eqd-ta" rows={2} value={draft.cancellation || ''} onChange={e => set('cancellation', e.target.value)} placeholder="Order once confirmed & processed cannot be cancelled." />
                : <Val v={draft.cancellation} muted />}
            </Field>
          </div>

          {/* ── Footer ── */}
          <div className="eqd-footer">
            <div className="eqd-footer-meta">
              Added on <strong>{fmtDate(row.createdAt)}</strong>
              {saveErr && <span className="eqd-err" style={{ marginLeft: 16 }}>⚠ {saveErr}</span>}
            </div>
            <div className="eqd-footer-actions">
              {/* Show action buttons only for Admin */}
              {isAdminUser && (
                editing ? (
                  <button className="eqd-btn eqd-btn--primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'eqd-spin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                ) : (
                  <button className="eqd-btn eqd-btn--primary" onClick={openGenPopup}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    Generate Quotation
                  </button>
                )
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Generate Quotation Confirmation ── */}
      {showGenConfirm && (
        <div className="eqd-overlay" onClick={e => { if (e.target === e.currentTarget) setShowGenConfirm(false); }}>
          <div className="eqd-popup">

            {/* Dark header banner */}
            <div className="eqd-popup-head">
              <div className="eqd-popup-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div className="eqd-popup-title">Generate Quotation</div>
              <div className="eqd-popup-subtitle">Choose the format before proceeding</div>
            </div>

            <div className="eqd-popup-body">

              {/* Customer info banner */}
              <div className="eqd-popup-cust-banner">
                <div className="eqd-popup-cust-avatar">
                  {(row.customerName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="eqd-popup-cust-info">
                  <div className="eqd-popup-cust-name">{row.customerName}</div>
                  <div className="eqd-popup-cust-sub">{row.millName || row.location || 'Customer'}{row.location && row.millName ? ` · ${row.location}` : ''}</div>
                </div>
              </div>

              {/* Quotation type selector */}
              <div className="eqd-qtype-section-label" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 700, color: '#8898aa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                Select Quotation Format
              </div>
              <div className="eqd-qtype-grid">
                {[
                  { id: '1page', name: '1 Page Quotation', desc: 'Compact summary — ideal for quick sharing', tag: 'COMPACT', tagCls: 'eqd-qtype-tag--compact' },
                  { id: 'detailed', name: 'Detailed Quotation', desc: 'Full breakdown with specs & terms', tag: 'FULL', tagCls: 'eqd-qtype-tag--full' },
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`eqd-qtype-opt${quotationType === opt.id ? ' selected' : ''}`}
                    onClick={() => setQuotationType(opt.id)}
                  >
                    <input type="radio" name="quotationType" value={opt.id} checked={quotationType === opt.id} onChange={() => setQuotationType(opt.id)} />
                    <div className="eqd-qtype-radio">
                      <div className="eqd-qtype-radio-dot" />
                    </div>
                    <div className="eqd-qtype-content">
                      <div className="eqd-qtype-name">{opt.name}</div>
                      <div className="eqd-qtype-desc">{opt.desc}</div>
                    </div>
                    <span className={`eqd-qtype-tag ${opt.tagCls}`}>{opt.tag}</span>
                  </label>
                ))}
              </div>

              {/* Overwrite notice — shown when a quotation already exists */}
              {existingQuotType && (
                <>
                  {/* Desktop: Full warning box */}
                  <div className="eqd-overwrite-warn eqd-overwrite-warn-desktop">
                    <div className="eqd-overwrite-warn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <div className="eqd-overwrite-warn-title">
                        {quotationType === existingQuotType 
                          ? 'Regenerate existing quotation'
                          : 'Switch quotation type'}
                      </div>
                      <div className="eqd-overwrite-warn-body">
                        {quotationType === existingQuotType ? (
                          <>
                            A <strong>{existingQuotType === '1page' ? '1-Page' : 'Detailed'} Quotation</strong> already exists. 
                            Generating will replace it with a new one.
                          </>
                        ) : (
                          <>
                            You currently have a <strong>{existingQuotType === '1page' ? '1-Page' : 'Detailed'} Quotation</strong>. 
                            Only one quotation type is allowed per enquiry. 
                            Switching to <strong>{quotationType === '1page' ? '1-Page' : 'Detailed'}</strong> will delete the existing one permanently.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Mobile: Compact inline warning */}
                  <div className="eqd-overwrite-warn-inline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>
                      {quotationType === existingQuotType 
                        ? <><strong>Replace:</strong> {existingQuotType === '1page' ? '1-Page' : 'Detailed'} quotation exists. New will overwrite it.</>
                        : <><strong>Switch:</strong> Current {existingQuotType === '1page' ? '1-Page' : 'Detailed'} will be deleted.</>
                      }
                    </span>
                  </div>
                </>
              )}

              <div className="eqd-popup-actions">
                <button className="eqd-popup-cancel" onClick={() => setShowGenConfirm(false)}>Cancel</button>
                <button
                  className={existingQuotType ? 'eqd-confirm-overwrite' : 'eqd-popup-confirm'}
                  disabled={overwriting}
                  onClick={() => handleGenConfirm(router)}
                >
                  {overwriting ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'eqd-spin .8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {overwriting 
                    ? 'Replacing…' 
                    : existingQuotType 
                      ? quotationType === existingQuotType 
                        ? 'Regenerate' 
                        : 'Switch & Generate' 
                      : 'Generate Now'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
