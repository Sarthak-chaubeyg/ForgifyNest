# Security Policy

## Reporting a Vulnerability

We take the security of ForgifyNest seriously. Since ForgifyNest is a privacy-focused local encryption tool, any vulnerability that could lead to data leakage, key compromise, or integrity failures is considered high priority.

**Please do not open a public GitHub issue for security vulnerabilities.** Instead, use one of the following private channels:

- **GitHub Security Advisories:** [Report via GitHub](https://github.com/Sarthak-chaubeyg/ForgifyNest/security/advisories/new)
- **Email:** callmechaubey@gmail.com

### What to Include

1. A clear description of the vulnerability and its potential impact
2. Step-by-step instructions or a proof-of-concept to reproduce the issue
3. Your recommended fix or mitigation, if applicable
4. Your name/handle for credit in the advisory (optional)

---

## Response Timeline

| Milestone | Target |
| :--- | :--- |
| Acknowledgment | Within **48 hours** |
| Triage & severity assessment | Within **7 days** |
| Fix released (critical/high) | Within **30 days** |
| Fix released (medium/low) | Within **90 days** |

---

## Vulnerability Classification

| Severity | Description | Example |
| :--- | :--- | :--- |
| **Critical** | Key compromise or data leakage | XSS injecting a key-stealing script |
| **High** | Integrity bypass | Chunk reordering without GCM detection |
| **Medium** | Information disclosure | Metadata leakage via side-channel |
| **Low** | Minor issues | UI rendering exposing non-sensitive info |

---

## Scope

### In Scope

- Cryptographic layer (`src/crypto/`)
- `.cnest` binary file format parsing & generation
- Content Security Policy and security headers
- Web Worker and Service Worker isolation
- Client-side key derivation and memory handling

### Out of Scope

- Browser-level vulnerabilities (report to the browser vendor)
- Operating system-level attacks (keyloggers, memory scrapers)
- Social engineering attacks against end-users
- Denial-of-service against the static hosting provider

---

## Supported Versions

| Version | Supported |
| :--- | :--- |
| 1.0.x | ✅ Yes |
| < 1.0.0 | ❌ No |
