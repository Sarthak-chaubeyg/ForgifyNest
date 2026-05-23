# Contributing to ForgifyNest

Thank you for your interest in contributing to ForgifyNest! We welcome contributions that keep our code clean, auditable, and secure.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## Getting Started

### Development Workflow

1. **Fork** the repository and **clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/ForgifyNest.git
   cd ForgifyNest
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Start** the development server:
   ```bash
   npm run dev
   ```

4. **Make your changes** in a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

5. **Lint and test** before committing:
   ```bash
   npm run lint
   npm test
   ```

6. **Submit a Pull Request** describing your changes and referencing any related issues.

---

## Architecture Overview

| Layer | Location | Technology |
| :--- | :--- | :--- |
| **Landing Page** | `src/components/LandingPage.tsx` | React + Three.js |
| **Vault Engine UI** | `src/components/VaultEngine.tsx` | React |
| **Vault Page** | `src/components/VaultPage.tsx` | React + React Router |
| **Crypto Worker** | `src/crypto/crypto.worker.ts` | Web Worker + Web Crypto API |
| **Key Utilities** | `src/crypto/keys.ts` | Web Crypto API |
| **Service Worker** | `public/sw.js` | Service Worker API |
| **Design System** | `src/styles/index.css` | Vanilla CSS |

---

## How to Contribute

### Reporting Bugs

- Search existing [GitHub Issues](https://github.com/Sarthak-chaubeyg/ForgifyNest/issues) first
- Open a new issue with a clear description, reproducible steps, OS, and browser version
- **Security vulnerabilities** must be reported privately via [SECURITY.md](SECURITY.md)

### Suggesting Features

- Open a feature request issue to discuss the enhancement before writing code
- Ensure it aligns with ForgifyNest's zero-storage, local-only, privacy-first architecture

### Pull Requests

- Fork the repo and create your branch from `main`
- Write clear, readable TypeScript
- If modifying `src/crypto/`, you **must** write corresponding tests in `tests/`
- Ensure `npm run lint` and `npm test` both pass

---

## Cryptographic Guidelines

All contributions to the cryptographic layer (`src/crypto/`) must:

- ✅ Use the native **Web Crypto API** (`crypto.subtle`) exclusively
- ✅ Run all heavy crypto operations inside a **Web Worker**
- ✅ Maintain compatibility with the `.cnest` binary file format
- ✅ Ensure zero-storage: no passwords or keys written to localStorage, IndexedDB, or transmitted over the network
- ✅ Wipe sensitive data from memory after use
- ❌ **No external cryptographic libraries** (CryptoJS, Forge, etc.)

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
| :--- | :--- |
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code refactoring (no behavior change) |
| `test:` | Adding or modifying tests |
| `chore:` | Build/tooling changes |
| `style:` | CSS/formatting changes (no logic) |

**Example:** `feat: add password strength meter to vault engine`
