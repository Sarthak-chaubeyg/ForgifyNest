import React, { useState, useEffect, useRef } from 'react';

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dropzone-icon">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dropzone-icon">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const FileIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--cyan)' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Vault Engine Component ────────────────────────────────────────────── */
export const VaultEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');

  // File inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Passwords
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Decrypt Metadata specific state
  const [decryptedMeta, setDecryptedMeta] = useState<{ name: string; size: number; type: string } | null>(null);

  // Refs
  const encryptFileRef = useRef<HTMLInputElement>(null);
  const decryptFileRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeDownloadId = useRef<string | null>(null);
  const inMemoryChunks = useRef<ArrayBuffer[]>([]);
  const isSWActive = useRef<boolean>(false);

  // Check Service Worker status
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      isSWActive.current = true;
    } else {
      isSWActive.current = false;
    }
  }, []);

  // Compute password strength
  useEffect(() => {
    if (!password) { setPwdStrength(0); return; }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
    setPwdStrength(strength);
  }, [password]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => { if (workerRef.current) workerRef.current.terminate(); };
  }, []);

  const resetState = () => {
    setSelectedFile(null);
    setPassword('');
    setDecryptedMeta(null);
    setProgressPercent(0);
    setStatusText('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(false);
    inMemoryChunks.current = [];
    if (encryptFileRef.current) encryptFileRef.current.value = '';
    if (decryptFileRef.current) decryptFileRef.current.value = '';
  };

  const handleTabChange = (tab: 'encrypt' | 'decrypt') => {
    resetState();
    setActiveTab(tab);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, mode: 'encrypt' | 'decrypt') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelection(files[0], mode);
  };

  const handleFileSelection = (file: File, mode: 'encrypt' | 'decrypt') => {
    setErrorMessage('');
    setSuccessMessage('');
    if (mode === 'decrypt' && !file.name.endsWith('.cnest')) {
      setErrorMessage('Please select a valid .cnest encrypted file.');
      return;
    }
    setSelectedFile(file);
    setDecryptedMeta(null);
  };

  const handleVerifyPassphrase = () => {
    if (!selectedFile || !password) return;
    setErrorMessage('');
    setStatusText('Verifying passphrase...');

    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = new Worker(new URL('../crypto/crypto.worker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'METADATA_RESULT') {
        if (msg.success) {
          setDecryptedMeta(msg.metadata);
          setStatusText('');
        } else {
          setErrorMessage(msg.error || 'Failed to decrypt file metadata. Make sure the passphrase is correct.');
          setStatusText('');
        }
        workerRef.current?.terminate();
      }
    };

    workerRef.current.postMessage({ type: 'READ_METADATA', file: selectedFile, password: password });
  };

  const startCryptoProcess = async () => {
    if (!selectedFile || !password) return;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProgressPercent(0);
    setStatusText('Initializing...');
    inMemoryChunks.current = [];

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      isSWActive.current = true;
    }

    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = new Worker(new URL('../crypto/crypto.worker.ts', import.meta.url), { type: 'module' });

    const downloadId = crypto.randomUUID();
    activeDownloadId.current = downloadId;

    workerRef.current.onmessage = async (event) => {
      const msg = event.data;

      switch (msg.type) {
        case 'PROGRESS':
          setProgressPercent(msg.percent);
          setStatusText(msg.status);
          break;

        case 'ENCRYPT_HEADER': {
          const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
          const downloadName = `cn_${randomHex}.cnest`;

          const totalSize = selectedFile.size;
          const chunkSize = 2 * 1024 * 1024;
          const numChunks = Math.ceil(totalSize / chunkSize);
          const chunkOverhead = numChunks * (12 + 4 + 16);
          const totalOutputSize = msg.header.byteLength + totalSize + chunkOverhead;

          if (isSWActive.current) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (e) => {
              if (e.data.success) triggerDownloadStream(downloadId);
            };
            navigator.serviceWorker.controller?.postMessage({
              type: 'REGISTER_DOWNLOAD', id: downloadId, filename: downloadName,
              size: totalOutputSize, mimeType: 'application/octet-stream'
            }, [messageChannel.port2]);
            navigator.serviceWorker.controller?.postMessage({
              type: 'DOWNLOAD_CHUNK', id: downloadId, chunk: msg.header
            });
          } else {
            inMemoryChunks.current.push(msg.header);
          }
          break;
        }

        case 'ENCRYPT_CHUNK': {
          if (isSWActive.current) {
            navigator.serviceWorker.controller?.postMessage({
              type: 'DOWNLOAD_CHUNK', id: downloadId, chunk: msg.chunk
            }, [msg.chunk]);
          } else {
            inMemoryChunks.current.push(msg.chunk);
          }
          break;
        }

        case 'ENCRYPT_COMPLETE': {
          if (isSWActive.current) {
            navigator.serviceWorker.controller?.postMessage({ type: 'DOWNLOAD_COMPLETE', id: downloadId });
          } else {
            triggerBlobDownload(
              inMemoryChunks.current,
              `cn_${Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('')}.cnest`
            );
          }
          setSuccessMessage('File encrypted and downloaded successfully!');
          setIsProcessing(false);
          workerRef.current?.terminate();
          break;
        }

        case 'DECRYPT_START': {
          const meta = msg.metadata;
          if (isSWActive.current) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (e) => {
              if (e.data.success) triggerDownloadStream(downloadId);
            };
            navigator.serviceWorker.controller?.postMessage({
              type: 'REGISTER_DOWNLOAD', id: downloadId, filename: meta.name,
              size: meta.size, mimeType: meta.type || 'application/octet-stream'
            }, [messageChannel.port2]);
          }
          break;
        }

        case 'DECRYPT_CHUNK': {
          if (isSWActive.current) {
            navigator.serviceWorker.controller?.postMessage({
              type: 'DOWNLOAD_CHUNK', id: downloadId, chunk: msg.chunk
            }, [msg.chunk]);
          } else {
            inMemoryChunks.current.push(msg.chunk);
          }
          break;
        }

        case 'DECRYPT_COMPLETE': {
          if (isSWActive.current) {
            navigator.serviceWorker.controller?.postMessage({ type: 'DOWNLOAD_COMPLETE', id: downloadId });
          } else {
            const resolvedName = decryptedMeta?.name || 'decrypted_file';
            triggerBlobDownload(inMemoryChunks.current, resolvedName);
          }
          setSuccessMessage('File decrypted and downloaded successfully!');
          setIsProcessing(false);
          workerRef.current?.terminate();
          break;
        }

        case 'ERROR':
          if (isSWActive.current) {
            navigator.serviceWorker.controller?.postMessage({
              type: 'DOWNLOAD_ERROR', id: downloadId, reason: msg.error
            });
          }
          setErrorMessage(msg.error || 'Decryption failed. Please check your password.');
          setIsProcessing(false);
          workerRef.current?.terminate();
          break;
      }
    };

    if (activeTab === 'encrypt') {
      workerRef.current.postMessage({ type: 'ENCRYPT_FILE', file: selectedFile, password: password });
    } else {
      workerRef.current.postMessage({ type: 'DECRYPT_FILE', file: selectedFile, password: password });
    }
  };

  const triggerDownloadStream = (id: string) => {
    const link = document.createElement('a');
    link.href = `/download-stream?id=${id}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  };

  const triggerBlobDownload = (chunks: ArrayBuffer[], filename: string) => {
    const blob = new Blob(chunks, { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
  };

  const getPasswordStrengthLabel = () => {
    switch (pwdStrength) {
      case 1: return { text: 'Weak', color: 'var(--error)' };
      case 2: return { text: 'Fair', color: 'var(--warning)' };
      case 3: return { text: 'Strong', color: 'var(--success)' };
      case 4: return { text: 'Excellent', color: 'var(--cyan)' };
      default: return { text: '', color: 'var(--text-muted)' };
    }
  };

  const getFormattedSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card" style={{ width: '100%', padding: 'var(--space-xl)', borderRadius: 'var(--radius-2xl)' }}>
      {/* ── Tab Toggle ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
        {(['encrypt', 'decrypt'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
              border: activeTab === tab ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === tab ? 'var(--cyan)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-base)',
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            {tab === 'encrypt' ? '🔑 Encrypt' : '🔓 Decrypt'}
          </button>
        ))}
      </div>

      {/* ── Alerts ──────────────────────────────────────────────────── */}
      {errorMessage && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '14px 18px', borderRadius: 'var(--radius-md)', color: '#fca5a5', marginBottom: 'var(--space-lg)', fontSize: '0.88rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span>⚠️</span> <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '14px 18px', borderRadius: 'var(--radius-md)', color: '#a7f3d0', marginBottom: 'var(--space-lg)', fontSize: '0.88rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span>✓</span> <span>{successMessage}</span>
        </div>
      )}
      {!isSWActive.current && !isProcessing && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', color: '#fcd34d', marginBottom: 'var(--space-lg)', fontSize: '0.78rem' }}>
          ⚠️ Service worker pending. Files over 100MB may exhaust browser RAM. Reload the tab if this is your first visit.
        </div>
      )}

      {/* ── Forms ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {/* File Dropzone */}
        {!selectedFile ? (
          <div
            className="dropzone"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('active'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('active')}
            onDrop={(e) => handleFileDrop(e, activeTab)}
            onClick={() => (activeTab === 'encrypt' ? encryptFileRef : decryptFileRef).current?.click()}
          >
            <input type="file" ref={encryptFileRef} style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0], 'encrypt')} />
            <input type="file" ref={decryptFileRef} style={{ display: 'none' }} accept=".cnest"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0], 'decrypt')} />
            {activeTab === 'encrypt' ? <LockIcon /> : <UnlockIcon />}
            <div>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {activeTab === 'encrypt' ? 'Drop your file here or click to browse' : 'Drop encrypted .cnest file here or click'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {activeTab === 'encrypt' ? 'Any file type supported. Encryption is processed fully on-device.' : 'Upload the locked package to initiate client-side decryption.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)' }}>
            <FileIcon />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {getFormattedSize(selectedFile.size)} • {activeTab === 'decrypt' ? 'Encrypted Payload' : (selectedFile.type || 'unknown type')}
              </p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} onClick={resetState} disabled={isProcessing}>
              Change
            </button>
          </div>
        )}

        {/* Password Input */}
        <div className="form-group">
          <label className="label">
            <span>Master Passphrase</span>
            {activeTab === 'encrypt' && password && (
              <span style={{ color: getPasswordStrengthLabel().color, fontWeight: 600, fontSize: '0.82rem' }}>
                {getPasswordStrengthLabel().text}
              </span>
            )}
          </label>
          <div className="input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder={activeTab === 'encrypt' ? 'Enter a long, secure password' : 'Enter the passphrase used for encryption'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
              style={{ paddingRight: '48px' }}
            />
            <button className="btn-eye" onClick={() => setShowPassword(!showPassword)} type="button">
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {activeTab === 'encrypt' && password && (
            <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
              {[1, 2, 3, 4].map((step) => (
                <div key={step} style={{
                  height: '3px', flex: 1,
                  backgroundColor: step <= pwdStrength ? getPasswordStrengthLabel().color : 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '2px',
                  transition: 'background-color 0.3s ease'
                }} />
              ))}
            </div>
          )}
          {activeTab === 'encrypt' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              💡 We recommend a passphrase using 4+ random words (e.g., <code>correct-horse-battery-staple</code>).
            </p>
          )}
        </div>

        {/* Verify Button (Decrypt only) */}
        {activeTab === 'decrypt' && selectedFile && password && !decryptedMeta && !isProcessing && (
          <button className="btn btn-secondary" style={{ width: '100%', borderStyle: 'dashed' }} onClick={handleVerifyPassphrase}>
            Verify Passphrase & View Original File Details
          </button>
        )}

        {/* Decrypted Metadata */}
        {decryptedMeta && (
          <div style={{
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.12)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '6px' }}>
              ✓ Passphrase Verified
            </p>
            <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              Original Name: <code style={{ color: 'var(--text-primary)' }}>{decryptedMeta.name}</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Size: {getFormattedSize(decryptedMeta.size)}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          className="btn btn-primary btn-shimmer"
          style={{ width: '100%', padding: '16px', fontSize: '0.95rem' }}
          disabled={!selectedFile || !password || isProcessing}
          onClick={startCryptoProcess}
        >
          {isProcessing
            ? 'Processing Cryptography...'
            : activeTab === 'encrypt'
              ? '🔐 Encrypt & Download'
              : '🔓 Decrypt & Download'}
        </button>
      </div>

      {/* ── Progress ────────────────────────────────────────────────── */}
      {isProcessing && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>{statusText}</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{progressPercent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultEngine;
