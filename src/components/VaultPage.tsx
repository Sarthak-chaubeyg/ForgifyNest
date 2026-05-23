import React from 'react';
import { Link } from 'react-router-dom';
import VaultEngine from './VaultEngine';

const VaultPage: React.FC = () => {
  return (
    <div className="vault-page">
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ─── Vault Header ──────────────────────────────────────────────── */}
      <header className="vault-header">
        <div className="container vault-header-inner">
          <Link to="/" className="vault-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>

          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon" style={{ width: 28, height: 28, borderRadius: 7 }}>
              <span style={{ fontSize: '0.72rem' }}>CN</span>
            </div>
            <span className="nav-logo-text" style={{ fontSize: '1.05rem' }}>ForgifyNest</span>
          </Link>

          <a
            href="https://github.com/Sarthak-chaubeyg/ForgifyNest"
            target="_blank"
            rel="noopener noreferrer"
            className="vault-back"
            style={{ gap: '6px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Source
          </a>
        </div>
      </header>

      {/* ─── Vault Main ────────────────────────────────────────────────── */}
      <main className="vault-main">
        <div className="vault-container">
          <div className="vault-title">
            <h1>
              <span className="gradient-text">Vault Engine</span>
            </h1>
            <p>
              Encrypt files to locked <code>.cnest</code> packages, or unlock them with your master password. Everything runs locally on your device.
            </p>
          </div>
          <VaultEngine />

          {/* Security Notice */}
          <div style={{
            marginTop: 'var(--space-xl)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 240, 255, 0.02)',
            border: '1px solid rgba(0, 240, 255, 0.06)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cyan)' }}>🔒</span>{' '}
              AES-256-GCM · PBKDF2-HMAC-SHA256 (600K iterations) · Web Crypto API · Zero-Knowledge · Fully Offline
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VaultPage;
