import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThreeHero from './ThreeHero';

/* ── FAQ Accordion Item ────────────────────────────────────────────────── */
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button className="faq-trigger" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span>{question}</span>
        <span className={`faq-chevron ${isOpen ? 'open' : ''}`}>+</span>
      </button>
      <div className={`faq-content ${isOpen ? 'open' : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
};

/* ── Landing Page ──────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon"><span>CN</span></div>
            <span className="nav-logo-text">CipherNest</span>
          </Link>

          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollTo('security')}>Security</button>
            <button className="nav-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
            <a href="https://github.com/Sarthak-chaubeyg/CipherNest" target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
            <Link to="/vault" className="nav-cta">Open Vault Engine</Link>
          </div>

          <button
            className={`nav-hamburger ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`nav-drawer-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-drawer ${mobileOpen ? 'open' : ''}`}>
        <button className="nav-link" onClick={() => scrollTo('security')}>Security Model</button>
        <button className="nav-link" onClick={() => scrollTo('features')}>Features</button>
        <button className="nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
        <a href="https://github.com/Sarthak-chaubeyg/CipherNest" target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
        <Link to="/vault" className="nav-cta" onClick={() => setMobileOpen(false)}>Open Vault Engine</Link>
      </div>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <header className="hero-section">
        <div className="container hero-grid">
          <div className="hero-text">
            <div className="section-label">✓ Client-Side · Zero-Storage</div>

            <h1>
              Your files,{' '}
              <span className="gradient-text">completely hidden</span>{' '}
              on your device.
            </h1>

            <p className="hero-desc">
              CipherNest is a private encrypted file vault. Files of any size are processed and encrypted directly in your browser. No data ever touches a server.
            </p>

            <div className="hero-cta-row">
              <Link to="/vault" className="btn btn-cyan btn-shimmer" style={{ padding: '15px 36px', fontSize: '1rem' }}>
                🔐 Open Vault Engine
              </Link>
              <button onClick={() => scrollTo('security')} className="btn btn-secondary" style={{ padding: '15px 32px' }}>
                View Security Model
              </button>
            </div>

            <p className="hero-meta">
              <span className="hero-meta-bullet">●</span>
              Powered by native Web Crypto API (AES-256-GCM) · 600K PBKDF2 iterations · Fully offline-capable
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-glow" />
            <div className="hero-3d-wrapper">
              <ThreeHero />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Problem / Solution ───────────────────────────────────────────── */}
      <section style={{ background: 'rgba(255,255,255,0.008)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container section">
          <div className="section-header">
            <div className="section-label" style={{ margin: '0 auto var(--space-lg)' }}>The Problem</div>
            <h2>Traditional Cloud Storage is a Liability</h2>
            <p>Cloud servers get breached, hosting policies change, and centralized services can expose your private files. CipherNest takes a different approach.</p>
          </div>

          <div className="comparison-grid">
            <div className="card card-lift" style={{ padding: 'var(--space-xl)' }}>
              <div className="feature-icon feature-icon-red">⚠️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>The Cloud Vulnerability</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', lineHeight: 1.7 }}>
                When you upload files to standard cloud lockers, you trust their staff, their security architecture, and their hosting provider. If their database is compromised, your raw files and metadata are exposed.
              </p>
            </div>
            <div className="card card-lift" style={{ padding: 'var(--space-xl)', borderLeft: '2px solid var(--cyan)' }}>
              <div className="feature-icon feature-icon-cyan">🔒</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>The CipherNest Solution</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', lineHeight: 1.7 }}>
                We convert your browser into a local, high-speed encryption engine. Your file never uploads. It is encrypted using client-side keys and saved back to your device under a randomized filename (<code>cn_*.cnest</code>). You hold the lock and the key.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Security, Explained ──────────────────────────────────────────── */}
      <section id="security">
        <div className="container section">
          <div className="section-header">
            <div className="section-label" style={{ margin: '0 auto var(--space-lg)' }}>Cryptographic Architecture</div>
            <h2>Security, Explained</h2>
            <p>We believe in transparency. Here is the mathematical blueprint of our security architecture, described honestly.</p>
          </div>

          <div className="security-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'start' }}>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Key Derivation Function (KDF)</h3>
                  <p>
                    Human passwords have low entropy. To harden yours, we generate a cryptographically random 32-byte salt and derive a Key Encryption Key (KEK) using <strong>PBKDF2-HMAC-SHA256 with 600,000 iterations</strong>. This forces an attacker to perform 600,000 hashing rounds per guess, making brute force computationally unviable.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Authenticated Encryption (AES-GCM 256)</h3>
                  <p>
                    Files are encrypted using <strong>AES-256-GCM</strong>, the industry gold standard. GCM mode provides both confidentiality and <strong>integrity protection</strong> — if even a single bit is modified on disk, decryption fails immediately with an authentication error, revealing tampering.
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Envelope Key Design & Filename Hiding</h3>
                  <p>
                    Every file is isolated under a unique, random File Key (FK). The FK is encrypted under a Master Key (MK), which is encrypted under your password-derived key. Your file's original name is encrypted <em>inside</em> this envelope. The output is a randomized name like <code>cn_7b82fa0c.cnest</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="card disclaimer-card" style={{ borderRadius: 'var(--radius-xl)' }}>
              <h3><span>⚠️</span> What we do not claim</h3>
              <ul className="disclaimer-list">
                <li>
                  <strong>No protection against compromised devices:</strong> If your computer has an active keylogger or remote access Trojan running while you type your password, no cryptographic client can protect you.
                </li>
                <li>
                  <strong>No magical "quantum-proof" shields:</strong> AES-256 is post-quantum resilient (Grover's algorithm reduces it to a still-unbreakable 128-bit equivalent), but we do not claim magical immunity. Our versioned format is ready for future algorithm migration.
                </li>
                <li>
                  <strong>Password recovery is impossible:</strong> We operate with zero-knowledge and zero storage. If you lose your passphrase, <strong>we cannot recover your files</strong>. There are no backdoors.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: 'rgba(255,255,255,0.008)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container section">
          <div className="section-header">
            <div className="section-label" style={{ margin: '0 auto var(--space-lg)' }}>Engineering</div>
            <h2>Core Engineering Features</h2>
            <p>CipherNest is a technical security tool designed for reliability, speed, and privacy.</p>
          </div>

          <div className="features-grid">
            {[
              { icon: '⚡', title: 'Background Web Worker', desc: 'Offloads KDF calculations and AES encryption to a background thread to prevent browser tab freezing during large file operations.' },
              { icon: '📦', title: 'Streaming Chunked Architecture', desc: 'Processes files in 2MB chunks. Enables encrypting huge files (1GB, 5GB, 10GB+) with low, flat RAM consumption under 15MB.' },
              { icon: '📂', title: 'Service Worker Streams', desc: 'Streams decrypted bytes directly to your browser\'s download manager, avoiding memory overflows on extremely large files.' },
              { icon: '🕵️', title: 'Filename Obfuscation', desc: 'Hides the original name and MIME type, downloading files with a randomized hex tag (cn_a8d29f0e.cnest). No metadata leaks.' },
              { icon: '🔌', title: '100% Offline-Capable', desc: 'All scripts run locally on your device. Disconnect your internet completely and the app will work perfectly offline.' },
              { icon: '🛠', title: 'Open-Source & Auditable', desc: 'Zero telemetry, zero trackers, zero hidden servers. Inspect the source code, review the math, and run it locally.' },
            ].map((f, i) => (
              <div key={i} className="card card-lift feature-card">
                <div className="feature-icon feature-icon-cyan">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Open Source Banner ────────────────────────────────────────────── */}
      <section>
        <div className="container section">
          <div className="card oss-banner" style={{ borderRadius: 'var(--radius-2xl)' }}>
            <h2>Open Source & Verifiable</h2>
            <p>
              True security is verifiable. All CipherNest client code, helper modules, and deployment scripts are public and open source. Audit our code, verify our claims, or host it yourself.
            </p>
            <div className="oss-buttons">
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-shimmer">
                ⭐ View Source on GitHub
              </a>
              <Link to="/vault" className="btn btn-secondary">
                Try Vault Engine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container section" style={{ maxWidth: '800px' }}>
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
          </div>

          <div>
            <FAQItem
              question="Where are my files stored?"
              answer="Your files are not stored on any server, nor in your browser's database. CipherNest operates on-the-fly: when you encrypt a file, it is processed locally in browser memory and immediately downloaded back to your hard drive as an encrypted .cnest package. Close the tab, and your memory is entirely cleared."
            />
            <FAQItem
              question="Do you see my password?"
              answer="Never. All key derivation (PBKDF2) is executed inside a local Web Worker thread on your CPU. No password or derived key is ever transmitted over the network or logged in console output."
            />
            <FAQItem
              question="Can the site read my files?"
              answer="No. The application is served as static HTML, CSS, and JS with a strict Content Security Policy (CSP). It has no server connections and cannot upload your data. You can inspect the source code, or load the page and disconnect your internet — the app works perfectly offline."
            />
            <FAQItem
              question="What happens if I lose my password?"
              answer="Because we have zero storage and zero knowledge of your keys, we cannot recover your password or files. Without your master passphrase, the files are mathematically unrecoverable."
            />
            <FAQItem
              question="Is this truly quantum-proof?"
              answer="We do not make hype-based claims. Standard symmetric encryption like AES-256 is theoretically resilient to quantum brute-forcing (reducing its strength to a still-unbreakable 128-bits of security under Grover's algorithm). We've built versioning into our file format so that if future quantum-safe algorithms are standardized, the structure is ready for migration."
            />
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="nav-logo" style={{ marginBottom: '4px' }}>
                <div className="nav-logo-icon" style={{ width: 24, height: 24, borderRadius: 6 }}><span style={{ fontSize: '0.65rem' }}>CN</span></div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>CipherNest</span>
              </Link>
              <p>Open-source, privacy-first local file encryption utility. No tracking, no telemetry, no servers.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <Link to="/vault">Vault Engine</Link>
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a>
              <a href="#security" onClick={(e) => { e.preventDefault(); scrollTo('security'); }}>Security Model</a>
            </div>
            <div className="footer-col">
              <h4>Developers</h4>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">Security Policy</a>
              <a href="https://github.com/Sarthak-chaubeyg/CipherNest/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">Code of Conduct</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} CipherNest. MIT License.</span>
            <span>Built with transparency. No data leaves your device.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
