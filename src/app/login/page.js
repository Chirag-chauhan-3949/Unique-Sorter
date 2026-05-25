'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&display=swap');

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }

  .login-root * { box-sizing:border-box; margin:0; padding:0; }
  .login-root {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#f4f6fb; font-family:'Barlow Condensed',sans-serif; padding:24px 16px;
  }
  .lp-card {
    width:100%; max-width:440px; background:#fff; border-radius:16px;
    border:1px solid #e8ecf4; box-shadow:0 8px 40px rgba(15,25,35,0.1);
    padding:48px 44px; animation:fadeUp 0.55s ease both;
  }
  .lp-header { margin-bottom:32px; }
  .lp-title {
    font-size:clamp(1.8rem,3vw,2.4rem); font-weight:700; color:#0f1923;
    letter-spacing:0.02em; line-height:1.1; margin-bottom:8px; text-transform:uppercase;
  }
  .lp-subtitle { font-size:1rem; color:#8898aa; line-height:1.5; }
  .lp-subtitle strong { color:#0f1923; }

  .lp-error {
    display:flex; align-items:flex-start; gap:10px;
    background:#fff5f5; border:1px solid #fecaca; border-left:3px solid #dc2626;
    border-radius:8px; padding:12px 14px; margin-bottom:20px; animation:shake 0.35s ease;
  }
  .lp-error-text { font-size:0.85rem; color:#dc2626; font-weight:500; line-height:1.4; }

  .lp-success {
    display:flex; align-items:flex-start; gap:10px;
    background:#f0fdf4; border:1px solid #bbf7d0; border-left:3px solid #16a34a;
    border-radius:8px; padding:12px 14px; margin-bottom:20px;
  }
  .lp-success-text { font-size:0.85rem; color:#16a34a; font-weight:500; line-height:1.4; }

  .lp-field { margin-bottom:20px; }
  .lp-label { display:block; font-size:0.9rem; font-weight:600; color:#374151; margin-bottom:7px; text-transform:uppercase; letter-spacing:0.02em; }
  .lp-input-wrap { position:relative; }
  .lp-input {
    width:100%; padding:13px 16px 13px 52px; font-size:1rem; font-family:inherit;
    color:#0f1923; background:#f8f9fc; border:1.5px solid #e8ecf4; border-radius:10px;
    outline:none; transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
  }
  .lp-input:focus { border-color:#1A37AA; background:#fff; box-shadow:0 0 0 3px rgba(26,55,170,0.08); }
  .lp-input-prefix {
    position:absolute; left:14px; top:50%; transform:translateY(-50%);
    font-size:0.875rem; font-weight:700; color:#1A37AA; pointer-events:none; z-index:1;
  }

  .lp-btn {
    width:100%; padding:14px 24px;
    background:linear-gradient(135deg,#1A37AA 0%,#2a4fc4 100%);
    color:#fff; border:none; border-radius:10px; font-size:1rem; font-weight:600;
    font-family:inherit; cursor:pointer; display:flex; align-items:center;
    justify-content:center; gap:8px; box-shadow:0 4px 16px rgba(26,55,170,0.32);
    transition:transform 0.18s,box-shadow 0.22s; text-transform:uppercase; letter-spacing:0.03em;
  }
  .lp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(26,55,170,0.42); }
  .lp-btn:disabled { opacity:0.65; cursor:not-allowed; }

  .lp-btn-secondary {
    width:100%; padding:12px 24px; background:transparent; color:#1A37AA;
    border:1.5px solid #1A37AA; border-radius:10px; font-size:0.9rem; font-weight:600;
    font-family:inherit; cursor:pointer; display:flex; align-items:center;
    justify-content:center; gap:8px; transition:background 0.2s; margin-top:12px; text-transform:uppercase;
  }
  .lp-btn-secondary:hover { background:#f0f4ff; }

  .lp-btn-link {
    background:none; border:none; color:#1A37AA; cursor:pointer; font-weight:600;
    font-size:0.85rem; font-family:inherit; text-decoration:underline; padding:0;
  }
  .lp-btn-link:disabled { color:#8898aa; cursor:not-allowed; text-decoration:none; }

  .lp-spinner {
    width:17px; height:17px; border:2px solid rgba(255,255,255,0.3);
    border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite;
    display:inline-block;
  }

  .lp-otp-inputs { display:flex; gap:10px; justify-content:center; margin:20px 0; }
  .lp-otp-input {
    width:48px; height:56px; text-align:center; font-size:1.4rem; font-weight:700;
    font-family:inherit; color:#0f1923; background:#f8f9fc;
    border:1.5px solid #e8ecf4; border-radius:10px; outline:none;
    transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
  }
  .lp-otp-input:focus { border-color:#1A37AA; background:#fff; box-shadow:0 0 0 3px rgba(26,55,170,0.08); }

  .lp-timer { text-align:center; font-size:0.85rem; color:#8898aa; margin-top:12px; }
  .lp-footer { text-align:center; margin-top:28px; padding-top:22px; border-top:1px solid #f0f2f8; }
  .lp-copyright { font-size:0.8rem; color:#c5cdd8; }
  .lp-register-link { text-align:center; margin-top:20px; padding-top:18px; border-top:1px solid #f0f2f8; font-size:0.9rem; color:#6b7280; }
  .lp-register-link a { color:#1A37AA; font-weight:600; text-decoration:none; margin-left:4px; }
  .lp-register-link a:hover { text-decoration:underline; }

  @media (max-width:520px) {
    .lp-card { padding:32px 24px; border-radius:12px; }
    .lp-title { font-size:1.5rem; }
    .lp-otp-input { width:42px; height:50px; font-size:1.2rem; }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpRefs = useRef([]);

  useEffect(() => {
    const id = '__login_styles__';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to send OTP');
        return;
      }
      setSuccessMsg(data.devOtp ? 'DEV MODE — your OTP is: ' + data.devOtp : data.message);
      setStep('otp');
      setTimer(60);
    } catch {
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    setSuccessMsg('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('OTP resent successfully');
        setTimer(60);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted.length) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const goBack = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccessMsg('');
    setTimer(0);
  };

  return (
    <div className="login-root">
      <div className="lp-card">

        {step === 'phone' && (
          <>
            <div className="lp-header">
              <h1 className="lp-title">Sign In</h1>
              <p className="lp-subtitle">Enter your registered phone number to receive an OTP.</p>
            </div>

            {error && <div className="lp-error"><ErrIcon /><span className="lp-error-text">{error}</span></div>}

            <form onSubmit={handleSendOtp}>
              <div className="lp-field">
                <label className="lp-label" htmlFor="phone">Phone Number</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-prefix">+91</span>
                  <input
                    id="phone" type="tel" inputMode="numeric" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210" className="lp-input" autoComplete="tel" required autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? <><span className="lp-spinner" /> Sending OTP...</> : <>Send OTP <ArrowIcon /></>}
              </button>
            </form>

            <div className="lp-register-link">
              Don&apos;t have an account?<a href="/register">Register here</a>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="lp-header">
              <h1 className="lp-title">Enter OTP</h1>
              <p className="lp-subtitle">Enter the 6-digit code sent to <strong>+91 {phone}</strong></p>
            </div>

            {successMsg && <div className="lp-success"><CheckIcon /><span className="lp-success-text">{successMsg}</span></div>}
            {error && <div className="lp-error"><ErrIcon /><span className="lp-error-text">{error}</span></div>}

            <form onSubmit={handleVerifyOtp}>
              <div className="lp-otp-inputs">
                {otp.map((digit, i) => (
                  <input
                    key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="lp-otp-input" autoFocus={i === 0}
                  />
                ))}
              </div>

              <div className="lp-timer">
                {timer > 0
                  ? <span>Resend OTP in <strong>{timer}s</strong></span>
                  : <button type="button" className="lp-btn-link" onClick={handleResendOtp} disabled={loading}>Resend OTP</button>
                }
              </div>

              <button type="submit" className="lp-btn" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? <><span className="lp-spinner" /> Verifying...</> : <>Verify & Sign In <ArrowIcon /></>}
              </button>

              <button type="button" className="lp-btn-secondary" onClick={goBack} disabled={loading}>
                <BackIcon /> Back
              </button>
            </form>
          </>
        )}

        <div className="lp-footer">
          <p className="lp-copyright">&copy; {new Date().getFullYear()} Unique Sorter And Equipment Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  );
}

const ErrIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
