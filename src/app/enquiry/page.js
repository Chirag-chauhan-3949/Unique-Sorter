'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Constants ───────────────────────────────────────────────── */
const MODELS      = ['Pinnacle', 'Nandak'];
const SIZES       = ['5', '6', '7', '8', '10'];
const STATES      = ['Telangana', 'Karnataka'];
const SOURCES     = ['Cold Call', 'Reference', 'Exhibition', 'Online / Website', 'Social Media', 'Other'];
const COMMODITIES = ['Rice', 'Pulses', 'Multiproduct', 'Tuvar Dal', 'Moong Dal'];

const PRICE_TABLE = {
  Telangana: { Pinnacle: { '5': 3000000, '6': 3300000, '7': 3600000, '8': 4000000, '10': 4700000 } },
  Karnataka: { Pinnacle: { '5': 3000000, '6': 3300000, '7': 3600000, '8': 4000000, '10': 4700000 } },
};

const getBasePrice = (state, model, size) => PRICE_TABLE[state]?.[model]?.[size] || '';
const getPrice = (state, model, size, qty) => {
  const base = PRICE_TABLE[state]?.[model]?.[size];
  if (!base) return '';
  const q = parseInt(qty) || 1;
  return String(base * q);
};

let _id = 2;

const INIT = () => ({
  customerName: '',
  millName: '',
  mobile: '',
  email: '',
  gst: '',
  location: '',
  state: '',
  address: '',
  source: '',

  hasRequirement: null,
  commodity: '',
  futureNote: '',
  followUpDate: '',
  probableMonth: '',
  orderChances: '',
  items: [{ id: 1, modelNo: '', size: '', qty: '', price: '' }],
  remarks: '',
});

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .enqf-root {
    min-height: 100vh;
    background: #eef0f5;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Simple brand navbar ── */
  .enqf-navbar {
    height: 56px;
    background: #111c2d;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .enqf-brand {
    font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
    color: #fff; letter-spacing: -0.2px;
  }
  .enqf-brand span { color: #4e7cff; }
  .enqf-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 12px; border-radius: 7px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.7); font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    transition: background .15s, color .15s;
  }
  .enqf-back-btn:hover { background: rgba(255,255,255,0.13); color: #fff; }

  /* ── Page content ── */
  .enqf-content { max-width: 860px; margin: 0 auto; padding: 36px 32px 80px; }

  .enqf-page-head {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid rgba(13,24,40,.08);
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .enqf-page-head h1 {
    font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700;
    color: #0d1828; letter-spacing: -.3px; line-height: 1.25;
  }
  .enqf-page-head p { font-family: 'Inter', sans-serif; font-size: 13px; color: #6b7a90; margin-top: 4px; }
  .enqf-page-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .enqf-btn-reset {
    height: 36px; padding: 0 16px; border-radius: 8px;
    border: 1px solid #d8dfe8; background: #fff;
    color: #4a5568; font-size: 13px; font-family: 'DM Sans', sans-serif;
    font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: all .15s;
  }
  .enqf-btn-reset:hover { border-color: #b0bbc9; color: #0d1828; }
  .enqf-btn-save {
    height: 36px; padding: 0 18px; border-radius: 8px;
    border: none; background: #1A37AA; color: #fff;
    font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    box-shadow: 0 2px 10px rgba(26,55,170,.35); transition: all .15s;
  }
  .enqf-btn-save:hover { background: #1e42cc; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(26,55,170,.45); }

  /* ── Section dividers ── */
  .enqf-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 36px 0 20px;
  }
  .enqf-divider:first-child { margin-top: 0; }
  .enqf-divider-num {
    width: 24px; height: 24px; border-radius: 50%;
    background: #1A37AA; color: #fff;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .enqf-divider-label {
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
    color: #0d1828; letter-spacing: .1px; white-space: nowrap;
  }
  .enqf-divider-line { flex: 1; height: 1px; background: rgba(13,24,40,.1); }

  /* ── Grid helpers ── */
  .g2 { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 16px; 
    width: 100%;
  }
  .g3 { 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr; 
    gap: 16px; 
    width: 100%;
  }
  .full { grid-column: 1 / -1; }
  .mt { margin-top: 16px; }
  
  /* Fix grid items overflow */
  .g2 > *, .g3 > * {
    min-width: 0;
  }

  /* ── Field ── */
  .enqf-f { 
    display: flex; 
    flex-direction: column; 
    gap: 5px; 
    width: 100%;
    min-width: 0;
  }
  .enqf-lbl {
    font-size: 11px; font-weight: 600; color: #4a5568;
    letter-spacing: .3px; display: flex; align-items: center; gap: 4px;
  }
  .req { color: #e05555; }

  .enqf-in, .enqf-sel, .enqf-ta {
    width: 100%; border: 1.5px solid #d8dfe8; border-radius: 8px;
    padding: 10px 13px; font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    color: #0d1828; background: #fff; line-height: 1.5;
    transition: border-color .18s, box-shadow .18s;
    outline: none;
  }
  .enqf-in::placeholder, .enqf-ta::placeholder { color: #b0bbc9; }
  .enqf-in:hover, .enqf-sel:hover, .enqf-ta:hover { border-color: #b0bbc9; }
  .enqf-in:focus, .enqf-sel:focus, .enqf-ta:focus {
    border-color: #1A37AA; box-shadow: 0 0 0 3px rgba(26,55,170,.1);
  }
  .enqf-in--err, .enqf-sel--err, .enqf-ta--err {
    border-color: #e05555 !important;
    box-shadow: 0 0 0 3px rgba(224,85,85,.1) !important;
  }
  .enqf-sel {
    appearance: none; 
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%238898aa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; 
    background-position: right 12px center;
    background-color: #fff;
    padding: 10px 40px 10px 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 48px;
    max-width: 100%;
    box-sizing: border-box;
    text-indent: 0;
    text-shadow: none;
    display: block;
  }
  
  /* Fix for dropdown options */
  .enqf-sel option {
    padding: 12px;
    font-size: 14px;
    color: #0d1828;
    background: #fff;
    white-space: normal;
    overflow: visible;
  }
  
  /* Ensure dropdown doesn't overflow */
  .enqf-sel:focus {
    background-color: #fff;
    color: #0d1828;
  }
  
  /* Hide default dropdown arrow in IE/Edge */
  .enqf-sel::-ms-expand {
    display: none;
  }
  .enqf-ta { resize: vertical; min-height: 80px; }
  .enqf-err { font-size: 11px; color: #c0392b; font-weight: 500; margin-top: 1px; }

  /* ── Requirement toggle ── */
  .enqf-toggle { display: flex; gap: 10px; margin-top: 4px; }
  .enqf-toggle-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 24px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    border: 1.5px solid #d8dfe8; background: #fff; color: #4a5568;
    transition: all .18s;
  }
  .enqf-toggle-btn:hover { border-color: #b0bbc9; color: #0d1828; background: #f8f9fc; }
  .enqf-toggle-btn--yes {
    background: rgba(82,186,79,.08); border-color: rgba(82,186,79,.5);
    color: #2e8c2b; box-shadow: 0 2px 10px rgba(82,186,79,.12);
  }
  .enqf-toggle-btn--no {
    background: rgba(224,85,85,.07); border-color: rgba(224,85,85,.4);
    color: #c0392b; box-shadow: 0 2px 10px rgba(224,85,85,.1);
  }

  /* ── Item cards ── */
  .enqf-items { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }

  .enqf-item {
    border: 1.5px solid #e0e8f0; border-radius: 12px;
    overflow: hidden; background: #fff;
    box-shadow: 0 2px 8px rgba(13,24,40,.04);
  }
  .enqf-item-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 16px;
    background: #0d1828; border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .enqf-item-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.7);
    text-transform: uppercase; letter-spacing: .8px;
  }
  .enqf-item-remove {
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    color: #e05555; background: rgba(224,85,85,.15);
    border: none; cursor: pointer; transition: background .15s;
  }
  .enqf-item-remove:hover { background: rgba(224,85,85,.28); }
  .enqf-item-body { padding: 16px; }

  .enqf-add-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; font-size: 12.5px; font-weight: 600;
    color: #1A37AA; background: rgba(26,55,170,.07);
    border: 1.5px dashed rgba(26,55,170,.3);
    border-radius: 9px; cursor: pointer; transition: background .15s;
    font-family: 'DM Sans', sans-serif; margin-top: 4px;
  }
  .enqf-add-btn:hover { background: rgba(26,55,170,.13); }

  /* ── Future badge ── */
  .enqf-future-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; background: rgba(232,160,32,.1);
    border: 1px solid rgba(232,160,32,.35); border-radius: 8px;
    font-size: 12px; font-weight: 600; color: #b07d10; margin-bottom: 14px;
  }

  /* ── Success screen ── */
  .enqf-success {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #eef0f5; padding: 40px 20px;
  }
  .enqf-success-card {
    background: #fff; border: 1px solid #e0e8f0; border-radius: 20px;
    padding: 48px 40px 40px; max-width: 420px; width: 100%;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    box-shadow: 0 12px 40px rgba(13,24,40,.1);
    animation: enqf-rise .35s ease both;
  }
  .enqf-success-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #52ba4f, #3a9e37);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; box-shadow: 0 8px 24px rgba(82,186,79,.3);
  }
  .enqf-success-title {
    font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700;
    color: #0d1828; letter-spacing: -.3px; margin-bottom: 10px;
  }
  .enqf-success-desc { font-size: 14px; color: #6b7a90; line-height: 1.65; margin-bottom: 28px; }
  .enqf-success-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .enqf-success-btn {
    padding: 10px 20px; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .enqf-success-btn--primary {
    background: #1A37AA; color: #fff; border: none;
    box-shadow: 0 2px 8px rgba(26,55,170,.3);
  }
  .enqf-success-btn--primary:hover { background: #1e42cc; }
  .enqf-success-btn--sec {
    background: #fff; color: #4a5568;
    border: 1.5px solid #d8dfe8; text-decoration: none;
  }
  .enqf-success-btn--sec:hover { border-color: #1A37AA; color: #1A37AA; }

  @keyframes enqf-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* confirm dialog */
  .enqf-confirm-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(10,18,30,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: enqf-fade-in 0.18s ease both;
  }
  @keyframes enqf-fade-in { from { opacity:0; } to { opacity:1; } }
  .enqf-confirm-dialog {
    background: #fff; border-radius: 16px;
    max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto;
    box-shadow: 0 24px 64px rgba(10,18,30,0.22);
    animation: enqf-slide-up 0.25s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  @keyframes enqf-slide-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .enqf-confirm-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f4fa;
    display: flex; align-items: center; gap: 12px;
  }
  .enqf-confirm-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: #eef2ff; color: #1A37AA;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .enqf-confirm-header h3 {
    font-size: 16px; font-weight: 700; color: #0f1923; margin: 0;
  }
  .enqf-confirm-header p {
    font-size: 12px; color: #8898aa; margin: 2px 0 0;
  }
  .enqf-confirm-body { padding: 16px 24px; }
  .enqf-confirm-row {
    display: flex; gap: 8px; padding: 7px 0;
    border-bottom: 1px solid #f8fafc;
    font-size: 13px;
  }
  .enqf-confirm-label {
    width: 120px; flex-shrink: 0;
    font-weight: 600; color: #64748b;
  }
  .enqf-confirm-val {
    flex: 1; color: #1e293b; font-weight: 500;
    word-break: break-word;
  }
  .enqf-confirm-section {
    font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: #94a3b8;
    padding: 12px 0 4px; border-bottom: none;
  }
  .enqf-confirm-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid #f0f4fa;
    display: flex; gap: 10px; justify-content: flex-end;
  }
  .enqf-confirm-btn {
    height: 38px; padding: 0 20px; border-radius: 9px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
  }
  .enqf-confirm-btn.primary {
    background: #1A37AA; color: #fff; border: none;
    box-shadow: 0 4px 14px rgba(26,55,170,0.28);
  }
  .enqf-confirm-btn.primary:hover { background: #162e8a; }
  .enqf-confirm-btn.ghost {
    background: #f8f9fc; color: #5a6a7e;
    border: 1.5px solid #e8ecf4;
  }
  .enqf-confirm-btn.ghost:hover { border-color: #cbd5e1; }
  .enqf-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  @media (max-width: 480px) {
    .enqf-confirm-dialog { max-width: 100%; border-radius: 12px; }
    .enqf-confirm-header { padding: 16px; gap: 10px; }
    .enqf-confirm-body { padding: 12px 16px; }
    .enqf-confirm-label { width: 90px; font-size: 11px; }
    .enqf-confirm-val { font-size: 12px; }
    .enqf-confirm-footer { padding: 12px 16px 16px; }
    .enqf-confirm-btn { height: 34px; font-size: 12px; }
  }

  @keyframes enqf-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ==========================================================
     FULLY RESPONSIVE STYLES - Mobile First
     ========================================================== */
  
  /* Mobile base styles */
  .enqf-navbar {
    height: 56px;
    padding: 0 16px;
  }
  
  .enqf-content { 
    max-width: 860px; 
    margin: 0 auto; 
    padding: 20px 16px 60px; 
  }
  
  /* Mobile-only submit row - hidden by default */
  .enqf-submit-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 2px solid rgba(13,24,40,.08);
  }
  
  /* Desktop bottom save row - hidden on mobile */
  .enqf-bottom-save {
    display: none;
  }
  
  .enqf-page-head {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 20px;
  }
  
  .enqf-page-head h1 {
    font-size: 20px;
  }
  
  .enqf-page-head p {
    font-size: 13px;
  }
  
  .enqf-page-head-actions { 
    display: none; 
  }
  
  /* Grids stack on mobile */
  .g2, .g3 { 
    grid-template-columns: 1fr; 
    gap: 12px; 
  }
  
  /* Toggle buttons stack */
  .enqf-toggle { 
    flex-direction: column; 
    gap: 8px;
  }
  
  .enqf-toggle-btn { 
    width: 100%; 
    justify-content: center;
    padding: 12px 20px;
    min-height: 44px;
  }
  
  /* Item cards */
  .enqf-items { 
    gap: 12px; 
    margin-top: 12px;
  }
  
  .enqf-item-body { 
    padding: 14px; 
  }
  
  .enqf-item-body .g2 { 
    gap: 12px; 
  }
  
  /* Form inputs - touch friendly */
  .enqf-in, .enqf-sel, .enqf-ta {
    min-height: 48px;
    padding: 12px 14px;
    font-size: 16px; /* Prevent iOS zoom */
  }
  
  /* Dropdown specific fixes for mobile */
  .enqf-sel {
    padding-right: 40px !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    max-width: 100% !important;
  }
  
  /* Fix dropdown container */
  .enqf-f {
    width: 100%;
    overflow: visible;
  }
  
  /* Ensure select wrapper handles overflow */
  .enqf-f select {
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Specific fix for Lead Source and State dropdowns */
  select.enqf-sel {
    padding-right: 40px !important;
    background-position: calc(100% - 12px) center !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    line-height: normal !important;
    height: auto !important;
    min-height: 48px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* Constrain dropdown options - match select width */
  select.enqf-sel {
    width: 100% !important;
  }
  
  select.enqf-sel option {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    padding: 10px 16px !important;
    font-size: 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  /* Fix dropdown width on mobile */
  @media (max-width: 767px) {
    select.enqf-sel {
      font-size: 16px !important;
    }
    
    select.enqf-sel option {
      font-size: 16px !important;
      padding: 12px 16px !important;
    }
  }
  
  /* Section dividers */
  .enqf-divider { 
    margin: 28px 0 18px; 
  }
  
  .enqf-divider-label { 
    font-size: 12px; 
  }
  
  /* Buttons full width on mobile */
  .enqf-btn-save, .enqf-btn-reset {
    width: 100%;
    justify-content: center;
    height: 48px;
  }
  
  /* Add item button */
  .enqf-add-btn {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
  
  /* Future requirement badge */
  .enqf-future-badge {
    width: 100%;
    justify-content: center;
    margin-bottom: 16px;
  }
  
  /* Success card */
  .enqf-success-card {
    margin: 16px;
    padding: 32px 24px;
  }
  
  .enqf-success-title { 
    font-size: 20px; 
  }
  
  .enqf-success-actions { 
    flex-direction: column; 
    width: 100%;
  }
  
  .enqf-success-actions button { 
    width: 100%; 
    height: 48px;
    justify-content: center;
  }

  /* Small mobile */
  @media (max-width: 480px) {
    .enqf-content { 
      padding: 16px 12px 40px; 
    }
    
    .enqf-page-head h1 { 
      font-size: 18px; 
    }
    
    .enqf-page-head p { 
      font-size: 12px; 
    }
    
    .enqf-divider { 
      margin: 24px 0 16px; 
      gap: 10px;
    }
    
    .enqf-divider-num {
      width: 22px;
      height: 22px;
      font-size: 11px;
    }
    
    .enqf-item-head { 
      padding: 10px 12px; 
    }
    
    .enqf-item-label { 
      font-size: 10px; 
    }
    
    .enqf-item-body {
      padding: 12px;
    }
    
    .enqf-future-badge { 
      font-size: 11px; 
      padding: 6px 12px; 
    }
  }

  /* Extra small mobile */
  @media (max-width: 360px) {
    .enqf-content { 
      padding: 12px 10px 32px; 
    }
    
    .enqf-page-head h1 { 
      font-size: 16px; 
    }
    
    .enqf-in, .enqf-sel, .enqf-ta {
      padding: 10px 12px;
      font-size: 15px;
    }
  }

  /* Tablet */
  @media (min-width: 768px) {
    .enqf-navbar {
      height: 60px;
      padding: 0 24px;
    }
    
    .enqf-content { 
      padding: 32px 24px 80px; 
    }
    
    .enqf-page-head {
      flex-direction: row;
      align-items: center !important;
      gap: 16px;
    }
    
    .enqf-page-head h1 {
      font-size: 22px;
    }
    
    .enqf-page-head-actions { 
      display: flex; 
    }
    
    /* Hide mobile submit row on desktop */
    .enqf-submit-row {
      display: none !important;
    }
    
    /* Show desktop bottom save */
    .enqf-bottom-save {
      display: flex !important;
    }
    
    .enqf-btn-save, .enqf-btn-reset {
      width: auto;
      height: 40px;
    }
    
    .g2 { 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
    }
    
    .g3 { 
      grid-template-columns: repeat(3, 1fr); 
    }
    
    .enqf-toggle { 
      flex-direction: row; 
    }
    
    .enqf-toggle-btn { 
      width: auto; 
    }
    
    .enqf-add-btn {
      width: auto;
    }
    
    .enqf-future-badge {
      width: auto;
    }
    
    .enqf-success-card {
      margin: 0;
      padding: 48px 40px 40px;
    }
    
    .enqf-success-actions { 
      flex-direction: row; 
    }
    
    .enqf-success-actions button { 
      width: auto; 
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .enqf-content {
      padding: 36px 32px 80px;
    }
    
    .enqf-in, .enqf-sel, .enqf-ta {
      font-size: 14px;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .enqf-in, .enqf-sel, .enqf-ta {
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
  
  /* Custom Dropdown Styles */
  .enqf-dropdown {
    position: relative;
    width: 100%;
  }
  
  .enqf-dropdown-trigger {
    width: 100%;
    height: 48px;
    padding: 0 40px 0 13px;
    border: 1.5px solid #d8dfe8;
    border-radius: 8px;
    background: #fff;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #0d1828;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: border-color .18s, box-shadow .18s;
  }
  
  .enqf-dropdown-trigger:hover {
    border-color: #b0bbc9;
  }
  
  .enqf-dropdown-trigger:focus,
  .enqf-dropdown-trigger.active {
    border-color: #1A37AA;
    box-shadow: 0 0 0 3px rgba(26,55,170,.1);
    outline: none;
  }
  
  .enqf-dropdown-trigger--err {
    border-color: #e05555 !important;
    box-shadow: 0 0 0 3px rgba(224,85,85,.1) !important;
  }
  
  .enqf-dropdown-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 8px;
    pointer-events: none;
    transition: transform 0.2s;
  }
  
  .enqf-dropdown-trigger.active .enqf-dropdown-arrow {
    transform: translateY(-50%) rotate(180deg);
  }
  
  .enqf-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: #fff;
    border: 1.5px solid #d8dfe8;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(13,24,40,.12);
    max-height: 240px;
    overflow-y: auto;
    z-index: 100;
    display: none;
  }
  
  .enqf-dropdown-menu.open {
    display: block;
    animation: dropdownSlide 0.2s ease;
  }
  
  @keyframes dropdownSlide {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .enqf-dropdown-item {
    padding: 12px 16px;
    font-size: 14px;
    color: #0d1828;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all .15s;
    border-bottom: 1px solid #f0f2f5;
  }
  
  .enqf-dropdown-item:last-child {
    border-bottom: none;
  }
  
  .enqf-dropdown-item:hover {
    background: #1A37AA;
    color: #fff;
  }
  
  .enqf-dropdown-item.selected {
    background: #1A37AA;
    color: #fff;
    font-weight: 500;
  }
  
  .enqf-dropdown-placeholder {
    color: #b0bbc9;
  }
  
  .enqf-dropdown-value {
    color: #0d1828;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* ─── Component ──────────────────────────────────────────────── */
export default function EnquiryPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [form, setForm] = useState(INIT());
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | confirm
  const [errorMsg, setErrorMsg] = useState('');
  const [savedName, setSavedName] = useState('');

  const set = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if (k === 'state') {
        updated.items = f.items.map(it => ({ ...it, price: getPrice(v, it.modelNo, it.size, it.qty) }));
      }
      return updated;
    });
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const setItem = (id, k, v) =>
    setForm(f => ({
      ...f,
      items: f.items.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [k]: v };
        updated.price = getPrice(f.state, updated.modelNo, updated.size, updated.qty);
        return updated;
      }),
    }));

  const addItem = () =>
    setForm(f => ({ ...f, items: [...f.items, { id: _id++, modelNo: '', size: '', qty: '', price: '' }] }));

  const removeItem = (id) =>
    setForm(f => ({ ...f, items: f.items.filter(it => it.id !== id) }));

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Required';
    if (!form.millName.trim()) e.millName = 'Required';
    if (!form.mobile.trim()) e.mobile = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter valid 10-digit mobile';
    if (!form.location.trim()) e.location = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (form.hasRequirement === null) e.hasRequirement = 'Please select an option';
    if (form.hasRequirement === true) {
      form.items.forEach((it, i) => {
        if (!it.modelNo.trim()) e[`item_${i}_modelNo`] = 'Required';
        if (!it.qty || +it.qty < 1) e[`item_${i}_qty`] = 'Required';
      });
    }
    if (form.hasRequirement === false && !form.futureNote.trim())
      e.futureNote = 'Please describe the future requirement';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error field
      requestAnimationFrame(() => {
        const firstErr = document.querySelector('.enqf-err');
        if (firstErr) {
          firstErr.closest('.enqf-f')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }
    setStatus('confirm');
  };

  const confirmSubmit = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Something went wrong');
      setSavedName(form.customerName);
      setStatus('success');
      // Reset form after successful save
      setTimeout(() => setForm(INIT()), 100);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const handleReset = () => { setForm(INIT()); setErrors({}); setStatus('idle'); setErrorMsg(''); };

  return (
    <>
      <style>{CSS}</style>
      <div className="enqf-root">

        {/* ── Navbar ── */}
        <nav className="enqf-navbar">
          <span className="enqf-brand">Unique<span>Sorter</span></span>
          <button className="enqf-back-btn" onClick={() => router.back()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </nav>

        {/* ── Content ── */}
        <div className="enqf-content">

          {/* Page heading */}
          <div className="enqf-page-head">
            <div>
              <h1>New Customer Enquiry</h1>
              <p>Fill in the customer details, location and requirement information below.</p>
            </div>
            <div className="enqf-page-head-actions">
              <button type="button" className="enqf-btn-reset" onClick={handleReset}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                Reset
              </button>
            </div>
          </div>

          <form id="enq-form" onSubmit={handleSubmit} noValidate>

            {/* ── Section 1 : Customer ── */}
            <Divider num="1" label="Customer Information" />
            <div className="g2">
              <F label="Customer Name" req err={errors.customerName}>
                <input className={`enqf-in${errors.customerName ? ' enqf-in--err' : ''}`}
                  placeholder="e.g. Rajesh Kumar"
                  value={form.customerName} onChange={e => set('customerName', e.target.value)} />
              </F>
              <F label="Mill / Company Name" req err={errors.millName}>
                <input className={`enqf-in${errors.millName ? ' enqf-in--err' : ''}`}
                  placeholder="e.g. Sri Balaji Rice Mill"
                  value={form.millName} onChange={e => set('millName', e.target.value)} />
              </F>
              <F label="Mobile No." req err={errors.mobile}>
                <input className={`enqf-in${errors.mobile ? ' enqf-in--err' : ''}`}
                  placeholder="10-digit mobile number"
                  inputMode="numeric" value={form.mobile}
                  onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </F>
              <F label="Email Address">
                <input className="enqf-in" type="email" placeholder="e.g. rajesh@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </F>
              <F label="GST No.">
                <input className="enqf-in" placeholder="e.g. 29ABCDE1234F1Z5"
                  value={form.gst} onChange={e => set('gst', e.target.value.toUpperCase())} maxLength={15} />
              </F>
              <F label="Lead Source">
                <CustomDropdown
                  value={form.source}
                  onChange={(val) => set('source', val)}
                  options={SOURCES.map(s => ({ value: s, label: s }))}
                  placeholder="Select source"
                />
              </F>
            </div>

            {/* ── Section 2 : Location ── */}
            <Divider num="2" label="Location Details" />
            <div className="g2">
              <F label="City / Location" req err={errors.location}>
                <input className={`enqf-in${errors.location ? ' enqf-in--err' : ''}`}
                  placeholder="e.g. Nagpur"
                  value={form.location} onChange={e => set('location', e.target.value)} />
              </F>
              <F label="State">
                <CustomDropdown
                  value={form.state}
                  onChange={(val) => set('state', val)}
                  options={STATES.map(s => ({ value: s, label: s }))}
                  placeholder="Select state"
                />
              </F>
              <F label="Full Address" req err={errors.address} cls="full">
                <textarea className={`enqf-ta${errors.address ? ' enqf-ta--err' : ''}`}
                  placeholder="Street, area, city, state, PIN..."
                  rows={3} value={form.address} onChange={e => set('address', e.target.value)} />
              </F>
            </div>

            {/* ── Section 3 : Requirement ── */}
            <Divider num="3" label="Requirement" />

            <F label="Does the customer have an immediate requirement?" req err={errors.hasRequirement}>
              <div className="enqf-toggle">
                <button type="button"
                  className={`enqf-toggle-btn${form.hasRequirement === true ? ' enqf-toggle-btn--yes' : ''}`}
                  onClick={() => set('hasRequirement', true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Yes — Immediate
                </button>
                <button type="button"
                  className={`enqf-toggle-btn${form.hasRequirement === false ? ' enqf-toggle-btn--no' : ''}`}
                  onClick={() => set('hasRequirement', false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  No — Future
                </button>
              </div>
            </F>

            {/* Commodity — shown when requirement type is selected */}
            {form.hasRequirement !== null && (
              <div style={{ marginTop: 16 }}>
                <F label="Commodity">
                  <CustomDropdown
                    value={form.commodity}
                    onChange={(val) => set('commodity', val)}
                    options={COMMODITIES.map(c => ({ value: c, label: c }))}
                    placeholder="Select commodity"
                  />
                </F>
              </div>
            )}

            {/* YES → items */}
            {form.hasRequirement === true && (
              <div className="enqf-items">
                {form.items.map((item, idx) => (
                  <div key={item.id} className="enqf-item">
                    <div className="enqf-item-head">
                      <span className="enqf-item-label">Item {idx + 1}</span>
                      {form.items.length > 1 && (
                        <button type="button" className="enqf-item-remove" onClick={() => removeItem(item.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="enqf-item-body">
                      <div className="g2">
                        <F label="Model" req err={errors[`item_${idx}_modelNo`]}>
                          <CustomDropdown
                            value={item.modelNo}
                            onChange={(val) => setItem(item.id, 'modelNo', val)}
                            options={MODELS.map(m => ({ value: m, label: m }))}
                            placeholder="Select model"
                            error={!!errors[`item_${idx}_modelNo`]}
                          />
                        </F>
                        <F label="Size">
                          <CustomDropdown
                            value={item.size}
                            onChange={(val) => setItem(item.id, 'size', val)}
                            options={SIZES.map(s => ({ value: s, label: s }))}
                            placeholder="Select size"
                          />
                        </F>
                        <F label="Quantity" req err={errors[`item_${idx}_qty`]}>
                          <input className={`enqf-in${errors[`item_${idx}_qty`] ? ' enqf-in--err' : ''}`}
                            placeholder="e.g. 2" inputMode="numeric"
                            value={item.qty} onChange={e => setItem(item.id, 'qty', e.target.value.replace(/\D/g, ''))} />
                        </F>
                        <F label="Price">
                          <div className={`enqf-in`} style={{
                            background: item.price ? 'rgba(26,55,170,0.05)' : '#f8f9fc',
                            color: item.price ? '#1A37AA' : '#b0bbc9',
                            fontWeight: item.price ? 700 : 400,
                            cursor: 'default',
                          }}>
                            {item.price || 'Auto-filled based on state & size'}
                          </div>
                        </F>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="enqf-add-btn" onClick={addItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Another Item
                </button>
              </div>
            )}

            {/* NO → future notes + follow-up date */}
            {form.hasRequirement === false && (
              <div style={{ marginTop: 16 }}>
                <div className="enqf-future-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Future Requirement
                </div>
                <div className="g2">
                  <F label="Requirement Update / Notes" req err={errors.futureNote} cls="full">
                    <textarea className={`enqf-ta${errors.futureNote ? ' enqf-ta--err' : ''}`}
                      placeholder="Describe what the customer might need in the future, expected timeline, or follow-up notes..."
                      rows={4} value={form.futureNote} onChange={e => set('futureNote', e.target.value)} />
                  </F>
                  <F label="Next Follow-up Date">
                    <input className="enqf-in" type="date"
                      value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
                  </F>
                  <F label="Probable Month of Order">
                    <input className="enqf-in" placeholder="e.g. June 2025"
                      value={form.probableMonth} onChange={e => set('probableMonth', e.target.value)} />
                  </F>
                  <F label="% Chances of Order">
                    <input className="enqf-in" placeholder="e.g. 70%" inputMode="numeric"
                      value={form.orderChances} onChange={e => set('orderChances', e.target.value)} />
                  </F>
                </div>
              </div>
            )}

            {/* ── Section 4 : Remarks ── */}
            <Divider num="4" label="Remarks" />
            <F label="Additional Remarks">
              <textarea className="enqf-ta" placeholder="Any additional notes, observations, or remarks about this enquiry..."
                rows={4} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </F>

            {/* Mobile-only submit buttons - Reset + Save */}
            <div className="enqf-submit-row">
              <button type="button" className="enqf-btn-reset" onClick={handleReset}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                Reset
              </button>
              <button type="submit" className="enqf-btn-save" disabled={status === 'loading' || status === 'confirm'}>
                {status === 'loading' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ animation: 'enqf-spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Enquiry
                  </>
                )}
              </button>
            </div>

            {/* ── Bottom save (desktop only) ── */}
            <div className="enqf-bottom-save" style={{ alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 36, paddingTop: 24, borderTop: '2px solid rgba(13,24,40,.08)' }}>

              {/* Error message */}
              {status === 'error' && (
                <span style={{ fontSize: 13, color: '#c0392b', fontWeight: 500 }}>
                  ⚠ {errorMsg}
                </span>
              )}

              {/* Success message */}
              {status === 'success' && (
                <span style={{ fontSize: 13, color: '#2e8c2b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Enquiry for <strong style={{ marginLeft: 4 }}>{savedName}</strong>&nbsp;saved successfully!
                </span>
              )}

              {status === 'success' ? (
                <button type="button" className="enqf-btn-save" onClick={handleReset}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Enquiry
                </button>
              ) : (
                <button type="submit" className="enqf-btn-save" disabled={status === 'loading' || status === 'confirm'}
                  style={{ opacity: status === 'loading' ? 0.8 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
                  {status === 'loading' ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        style={{ animation: 'enqf-spin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Save Enquiry
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {status === 'confirm' && (
        <div className="enqf-confirm-overlay" onClick={e => e.target === e.currentTarget && setStatus('idle')}>
          <div className="enqf-confirm-dialog">
            <div className="enqf-confirm-header">
              <div className="enqf-confirm-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div>
                <h3>Confirm Enquiry Details</h3>
                <p>Please review the details before saving.</p>
              </div>
            </div>
            <div className="enqf-confirm-body">
              <div className="enqf-confirm-section">Customer Information</div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">Customer</span><span className="enqf-confirm-val">{form.customerName || '—'}</span></div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">Mill / Company</span><span className="enqf-confirm-val">{form.millName || '—'}</span></div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">Mobile</span><span className="enqf-confirm-val">{form.mobile || '—'}</span></div>
              {form.email && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Email</span><span className="enqf-confirm-val">{form.email}</span></div>}
              {form.gst && <div className="enqf-confirm-row"><span className="enqf-confirm-label">GST No.</span><span className="enqf-confirm-val">{form.gst}</span></div>}
              {form.source && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Lead Source</span><span className="enqf-confirm-val">{form.source}</span></div>}

              <div className="enqf-confirm-section">Location</div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">City</span><span className="enqf-confirm-val">{form.location || '—'}</span></div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">State</span><span className="enqf-confirm-val">{form.state || '—'}</span></div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">Address</span><span className="enqf-confirm-val">{form.address || '—'}</span></div>

              <div className="enqf-confirm-section">Requirement</div>
              <div className="enqf-confirm-row"><span className="enqf-confirm-label">Type</span><span className="enqf-confirm-val">{form.hasRequirement === true ? 'Immediate' : form.hasRequirement === false ? 'Future' : '—'}</span></div>

              {form.hasRequirement === true && form.items?.map((it, i) => (
                <div className="enqf-confirm-row" key={i}>
                  <span className="enqf-confirm-label">Item {i + 1}</span>
                  <span className="enqf-confirm-val">{it.modelNo || '—'} · {it.size || '—'} chute · Qty: {it.qty || '—'}{it.price ? ` · ₹${Number(it.price).toLocaleString('en-IN')}` : ''}</span>
                </div>
              ))}

              {form.hasRequirement === false && (
                <>
                  {form.commodity && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Commodity</span><span className="enqf-confirm-val">{form.commodity}</span></div>}
                  {form.futureNote && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Notes</span><span className="enqf-confirm-val">{form.futureNote}</span></div>}
                  {form.followUpDate && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Follow-up</span><span className="enqf-confirm-val">{form.followUpDate}</span></div>}
                  {form.probableMonth && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Probable Month</span><span className="enqf-confirm-val">{form.probableMonth}</span></div>}
                  {form.orderChances && <div className="enqf-confirm-row"><span className="enqf-confirm-label">Chances</span><span className="enqf-confirm-val">{form.orderChances}%</span></div>}
                </>
              )}

              {form.remarks && (
                <>
                  <div className="enqf-confirm-section">Remarks</div>
                  <div className="enqf-confirm-row"><span className="enqf-confirm-val" style={{ width: '100%' }}>{form.remarks}</span></div>
                </>
              )}
            </div>
            <div className="enqf-confirm-footer">
              <button className="enqf-confirm-btn ghost" onClick={() => setStatus('idle')}>Edit</button>
              <button className="enqf-confirm-btn primary" onClick={confirmSubmit}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Divider({ num, label }) {
  return (
    <div className="enqf-divider">
      <span className="enqf-divider-num">{num}</span>
      <span className="enqf-divider-label">{label}</span>
      <span className="enqf-divider-line" />
    </div>
  );
}

/* Custom Dropdown Component */
function CustomDropdown({ value, onChange, options, placeholder, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    setSelectedValue(optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder;

  return (
    <div className="enqf-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`enqf-dropdown-trigger${error ? ' enqf-dropdown-trigger--err' : ''}${isOpen ? ' active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValue ? 'enqf-dropdown-value' : 'enqf-dropdown-placeholder'}>
          {selectedLabel}
        </span>
        <svg className="enqf-dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="#8898aa" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <div className={`enqf-dropdown-menu${isOpen ? ' open' : ''}`}>
        {options.map((option) => (
          <div
            key={option.value}
            className={`enqf-dropdown-item${option.value === selectedValue ? ' selected' : ''}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function F({ label, req, err, cls, children }) {
  return (
    <div className={`enqf-f${cls ? ` ${cls}` : ''}`}>
      <label className="enqf-lbl">
        {label}{req && <span className="req">*</span>}
      </label>
      {children}
      {err && <span className="enqf-err">{err}</span>}
    </div>
  );
}
