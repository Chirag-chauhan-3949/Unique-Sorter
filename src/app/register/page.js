'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Register user - stores in Firebase
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || 'User ' + formData.phone.slice(-4),
          phone: formData.phone,
          password: formData.password,
          role: formData.role.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to register. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <style>{`
          @media (max-width: 480px) {
            .reg-success-card { padding: 28px 20px !important; border-radius: 16px !important; }
            .reg-success-title { font-size: 22px !important; }
            .reg-success-btn { min-height: 48px !important; font-size: 15px !important; }
          }
        `}</style>
        <div className="reg-success-card" style={styles.card}>
          <div style={styles.successIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="reg-success-title" style={styles.successTitle}>Registration Successful!</h2>
          <p style={styles.successText}>
            Your account has been created. You can now login with your phone number and password.
          </p>
          <div style={styles.buttonGroup}>
            <button onClick={() => router.push('/login')} className="reg-success-btn" style={styles.button}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .reg-card {
            padding: 28px 20px !important;
            border-radius: 16px !important;
          }
          .reg-title {
            font-size: 22px !important;
          }
          .reg-input {
            padding: 12px 14px !important;
            font-size: 16px !important;
          }
          .reg-phone-input {
            padding-left: 52px !important;
          }
          .reg-btn {
            padding: 14px 20px !important;
            font-size: 15px !important;
            min-height: 48px !important;
          }
          .reg-logo-icon {
            width: 48px !important;
            height: 48px !important;
          }
          .reg-logo-icon svg {
            width: 26px !important;
            height: 26px !important;
          }
        }
        @media (max-width: 360px) {
          .reg-card {
            padding: 24px 16px !important;
          }
          .reg-title {
            font-size: 20px !important;
          }
        }
      `}</style>
      {/* Background decoration */}
      <div style={styles.bgDecoration}></div>
      <div style={styles.bgDecoration2}></div>
      
      <div className="reg-card" style={styles.card}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div className="reg-logo-icon" style={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="reg-title" style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Register to access the inquiry system</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="reg-input"
              style={styles.input}
              required
            />
          </div>

          {/* Phone */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number *</label>
            <div style={styles.phoneInputWrapper}>
              <span style={styles.countryCode}>+91</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="reg-input reg-phone-input"
                style={{...styles.input, ...styles.phoneInput}}
                required
              />
            </div>
            <p style={styles.hint}>Enter 10-digit mobile number</p>
          </div>


          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="reg-input"
              style={styles.input}
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="reg-input"
              style={styles.input}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="reg-btn" style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}>
            {loading ? (
              <>
                <span style={styles.spinner}></span>
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div style={styles.loginLink}>
          <span style={styles.loginText}>Already have an account? </span>
          <button onClick={() => router.push('/login')} style={styles.loginButton}>
            Login here
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            © {new Date().getFullYear()} Unique Sorter And Equipment Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecoration: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    top: '-200px',
    right: '-200px',
    filter: 'blur(60px)',
  },
  bgDecoration2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    bottom: '-100px',
    left: '-100px',
    filter: 'blur(40px)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
    padding: '36px 28px',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #1A37AA 0%, #2a4fc4 100%)',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 8px 20px rgba(26,55,170,0.25)',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f1923',
    margin: '0 0 6px 0',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8898aa',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: '#dc2626',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#0f1923',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: "inherit",
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  phoneInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  countryCode: {
    position: 'absolute',
    left: '14px',
    fontWeight: 600,
    color: '#1A37AA',
    fontSize: '14px',
    zIndex: 1,
  },
  phoneInput: {
    paddingLeft: '52px',
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '2px 0 0 0',
  },
  button: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #1A37AA 0%, #2a4fc4 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(26,55,170,0.35)',
    transition: 'all 0.2s ease',
    marginTop: '8px',
    fontFamily: "inherit",
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  loginText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  loginButton: {
    background: 'none',
    border: 'none',
    color: '#1A37AA',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "inherit",
    padding: 0,
    marginLeft: '4px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  // Success State
  successIcon: {
    width: '80px',
    height: '80px',
    background: '#f0fdf4',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f1923',
    textAlign: 'center',
    margin: '0 0 12px 0',
  },
  successText: {
    fontSize: '15px',
    color: '#5a6a7e',
    textAlign: 'center',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
  },
};
