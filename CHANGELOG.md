# Changelog

All notable changes to ForgifyNest will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No unreleased changes._

---

## [1.0.0] - 2026-05-23

### Added

- **Initial Release** of ForgifyNest
- **On-the-fly streaming encryption/decryption** using AES-256-GCM via the native Web Crypto API
- **Background Web Worker execution** for PBKDF2 (600,000 iterations) and encryption tasks to prevent UI freezing
- **Service Worker integration** for memory-safe streaming downloads of large files (1GB, 5GB, 10GB+)
- **Filename obfuscation** — original names and extensions are encrypted inside the `.cnest` package; output files use randomized hex names (e.g., `cn_a8d29f0e.cnest`)
- **Interactive 3D vault visualization** on the landing page using Three.js
- **Dedicated `/vault` route** for the encryption engine, separated from the landing page
- **Responsive design** with mobile hamburger navigation and breakpoints at 480px, 768px, and 1024px
- **Strict security headers** for Netlify deployment (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- **Automated unit tests** using Vitest for KDF and AES-GCM operations
- **Deploy-ready documentation** — README, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CHANGELOG.md
