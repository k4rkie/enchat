# Teaching Notes (scratchpad)

## Learner Profile

- Junior/intern-level. Building Enchat (Bun + Express + socket.io + vanilla JS) as a resume project.
- **Explicitly asked NOT to be handed implementations** — wants teaching + pointers to resources. Honor this strictly.
- First contact with applied cryptography ("haven't done manual encryption before").
- Broader goal: learn web security from a backend, user-focused perspective.
- Other learning tracks: Go (primary), Backend/TS (secondary — this track feeds it), C (deferred).

## Observations from Code Review (Enchat)

- Renders messages with `textContent`, not `innerHTML` — good XSS instinct. Praise; reinforce in lesson 6.
- Room IDs are `crypto.randomUUID().split("-")[0]` → 8 hex chars = 32 bits, brute-forceable via `/check-room`. **Deliberately left as a discovery** in lesson 0001's exercises — do not hand it over.
- Empty `client/utils/encryptMessage.js` stub exists — they had this idea before. Natural home for lessons 3–4 code.
- Server stores plaintext messages in `roomStore` (memory-only, 30-min TTL) — the core motivation for E2EE over server-side encryption.
- No HTTPS/WSS yet. `crypto.subtle` requires a secure context (localhost counts, prod won't).
- Data flow: client `socket.emit("newMessage")` → `handleNewMessage` → `roomStore` + broadcast → `renderMessages`. All plaintext, all the way.

## Pace / Adjustments

- 2026-08-03: Track created. Lesson 0001 (threat modeling) assigned.
  Awaiting: THREAT_MODEL.md + answers to calibration questions
  (prior Web Crypto exposure, symmetric/asymmetric basics, TLS mental model).
