# Mission: End-to-End Encrypt Enchat

Turn Enchat from "zero-persistence" into "zero-knowledge": the server relays
messages it cannot read. This is the security layer of my resume project and
my entry point into web security from a backend perspective.

## What I'll Build

- A written threat model for Enchat (`THREAT_MODEL.md` — a resume artifact in itself)
- Client-side message encryption with the native Web Crypto API (AES-GCM, zero dependencies)
- A key-sharing mechanism the server never sees (URL-fragment secret)
- (Stretch) Real multi-party key exchange with ECDH
- Transport hardening: HTTPS/WSS + security headers + XSS audit

## Curriculum

| Lesson | Topic | I'll be able to... |
|--------|-------|--------------------|
| 1 | Threat modeling | Say exactly who I'm defending against, and what crypto can't fix |
| 2 | The key problem | Explain why where the key lives matters more than the cipher |
| 3 | AES-GCM + Web Crypto | Encrypt/decrypt strings in the browser and explain IV reuse |
| 4 | E2EE integration | Relay ciphertext through socket.io while the server stays blind |
| 5 | Key exchange | Compare URL-fragment keys, password-derived keys (PBKDF2), and ECDH |
| 6 | Transport & headers | Serve over HTTPS/WSS, add CSP, audit XSS sinks |

## Definition of Done

I can demo the app, open DevTools on the server side, show that the server
only ever sees ciphertext — and defend every design choice in an interview.
