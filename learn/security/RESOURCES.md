# Resources: Security & Encryption for Enchat

Primary sources first, always. When in doubt: **MDN > blog posts**.

## Threat Modeling (Lesson 1)

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling) — the process overview
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) — bookmark this
- STRIDE — Wikipedia is fine for a first pass; it's a brainstorming mnemonic, not a law

## The Crypto You'll Actually Use (Lessons 2–4)

- [MDN: Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — your main reference
  - `SubtleCrypto.encrypt()` / `decrypt()`
  - `SubtleCrypto.generateKey()` / `exportKey()` / `importKey()`
  - `crypto.getRandomValues()`
- [Excalidraw's E2EE write-up](https://blog.excalidraw.com/end-to-end-encryption/) — a real production app using the exact URL-fragment-key pattern you'll build. Same browser constraints as you.
- NIST SP 800-38D — the GCM spec. Skim the intro; just know it exists and what it guarantees.

## Good Search Terms (what to look up, per your request)

- `"SubtleCrypto AES-GCM encrypt string example"` — stick to MDN results
- `"URL fragment encryption key sharing"` / `"end-to-end encryption fragment identifier"`
- `"secure context crypto.subtle undefined http"` — this will bite you in production; know it now
- `"PBKDF2 deriveKey SubtleCrypto"` — lesson 5
- `"ECDH deriveKey web crypto"` — lesson 5 (stretch)
- `"Content-Security-Policy header MDN"` — lesson 6

## What to Avoid

- Tutorials telling you to `npm install crypto-js` (or any crypto package). The browser
  has audited, native crypto built in (`window.crypto.subtle`) — zero dependencies.
  "Zero-dependency E2EE using the Web Crypto API" is the better resume line anyway.
- Any "AES in JavaScript" article that never mentions the **IV/nonce**. Close the tab.
- Anything mentioning **ECB** mode as a solution. Close the tab faster.
- Rolling your own cipher. You will be tempted as a learning exercise — fine for a toy,
  never in the app. The industry rule: *use vetted primitives, design your own protocol
  around them as little as possible.*

## Deeper (when you want them)

- [Crypto 101](https://www.crypto101.io) — free, programmer-oriented intro course
- *Serious Cryptography* — Jean-Philippe Aumasson (chapter on authenticated encryption)
- [Signal Protocol docs](https://signal.org/docs/) — where these ideas end up at scale

## Web Security Companions (Lesson 6)

- [OWASP: Cross-Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
