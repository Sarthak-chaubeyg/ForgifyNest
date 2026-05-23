# 🔒 ForgifyNest

**Private Encrypted File Vault**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](CONTRIBUTING.md)

ForgifyNest is an open-source, privacy-first, client-side encryption utility. It operates with a **zero-storage security posture**: no files, metadata, or keys are saved in any browser database or transmitted to any server. Your browser acts entirely as a local, secure processing engine.

> **[Live Demo →](https://forgifynest.netlify.app)** · **[Report a Vulnerability →](SECURITY.md)**

---

## ✨ Features

- **Zero-Storage Architecture** — No files, passwords, or keys are stored in any database or transmitted to any server
- **AES-256-GCM Encryption** — Industry-standard authenticated encryption via the native Web Crypto API
- **Streaming 2MB Chunks** — Processes files of any size (1GB, 5GB, 10GB+) with flat ~15MB RAM consumption
- **Background Web Worker** — PBKDF2 (600,000 iterations) and encryption run in a background thread to prevent UI freezing
- **Service Worker Downloads** — Streams decrypted bytes directly to the browser download manager for large files
- **Filename Obfuscation** — Original names, extensions, and MIME types are fully encrypted; output files use randomized hex names (`cn_a8d29f0e.cnest`)
- **100% Offline-Capable** — Disconnect your internet completely and the app works perfectly
- **Open-Source & Auditable** — Zero telemetry, zero trackers, zero hidden endpoints

---

## 🔐 Cryptographic Design & `.cnest` Format Specification

ForgifyNest compiles files into a custom binary container format with the **`.cnest`** extension.

### Binary Layout

| Field | Size (Bytes) | Type | Description |
| :--- | :--- | :--- | :--- |
| **Magic Bytes** | 5 | ASCII | Static identifier string `CNEST` |
| **Version** | 1 | uint8 | Format version (currently `0x01`) |
| **Salt** | 32 | Binary | PBKDF2 salt for Key Encryption Key (KEK) derivation |
| **MK Envelope IV** | 12 | Binary | AES-256-GCM IV for the Master Key (MK) payload |
| **MK Envelope Length** | 4 | uint32 | Length of the encrypted Master Key envelope (big-endian) |
| **MK Envelope Payload** | variable (48) | Binary | Master Key encrypted under password-derived KEK |
| **FK Envelope IV** | 12 | Binary | AES-256-GCM IV for the File Key (FK) payload |
| **FK Envelope Length** | 4 | uint32 | Length of the encrypted File Key envelope (big-endian) |
| **FK Envelope Payload** | variable (48) | Binary | File Key encrypted under the Master Key |
| **Metadata Envelope IV** | 12 | Binary | AES-256-GCM IV for the Metadata payload |
| **Metadata Length** | 4 | uint32 | Length of the encrypted Metadata payload (big-endian) |
| **Metadata Payload** | variable | Binary | JSON object (original name, size, type, UUID) encrypted under the Master Key |
| **Encrypted Chunks** | variable | Stream | Sequence of encrypted 2MB file chunks (see below) |

### Encrypted Chunk Structure

```text
+-------------------+----------------------+------------------------------------------+
| CHUNK_IV (12B)    | PAYLOAD_LENGTH (4B)  | ENCRYPTED_PAYLOAD (variable size)        |
| (Random 8B +      | uint32 (big-endian)  | AES-256-GCM encrypted using the File Key |
| 4B Big-Endian Ctr)|                      | Includes 16-byte GCM authentication tag  |
+-------------------+----------------------+------------------------------------------+
```

**Sequence Integrity (AAD):** Each chunk is encrypted with Associated Authenticated Data consisting of `[fileUuid]_[chunkIndex]`. If an attacker deletes, rearranges, or swaps chunks, the GCM tag verification fails immediately during decryption.

---

## 🛡️ Threat Model

### In-Scope Protection
- **Local Hard Drive Theft** — `.cnest` files remain uncrackable without the master passphrase
- **Server/Cloud Interception** — No files or passwords are ever sent to a server
- **Metadata Scraping** — File names, sizes, and extensions are fully encrypted inside the header

### Out-of-Scope Threats
- **Compromised Host Device** — Active keyloggers or memory scrapers can capture the passphrase at input time
- **Weak Passwords** — Dictionary passwords can be brute-forced locally. Mitigated by 600,000 PBKDF2 iterations and a visual strength meter

---

## 🧰 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | UI framework |
| **TypeScript** | Type-safe application code |
| **Vite** | Build toolchain & dev server |
| **Three.js** | Interactive 3D hero visualization |
| **Web Crypto API** | Native browser AES-256-GCM & PBKDF2 |
| **Web Workers** | Background thread for crypto operations |
| **Service Workers** | Streaming large file downloads |
| **React Router** | Client-side SPA routing |

---

## 🛠️ Build & Development

### Prerequisites

- [Node.js](https://nodejs.org) v18+ installed

### Installation

```bash
git clone https://github.com/Sarthak-chaubeyg/ForgifyNest.git
cd ForgifyNest
npm install
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
npm run test
```

### Build for Production

```bash
npm run build
```

Output is compiled into the `dist/` directory.

---

## 🚀 Deployment (Netlify)

ForgifyNest is designed for static hosting on Netlify.

| Setting | Value |
| :--- | :--- |
| Build Command | `npm run build` |
| Publish Directory | `dist` |

**Security Headers** deployed via `_headers`:
- Strict **Content-Security-Policy** restricting scripts/workers to `'self'`
- **HSTS** forcing HTTPS with preload
- **X-Frame-Options: DENY** preventing clickjacking
- **Referrer-Policy: no-referrer** protecting navigation leakage

---

## 📄 License & Policies

- **License:** [MIT](LICENSE)
- **Security Disclosures:** [SECURITY.md](SECURITY.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
