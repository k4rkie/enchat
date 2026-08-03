# 0001: Threat Modeling — Who Are You Hiding From?

**Time:** ~25 min
**Goal:** By the end, you'll have a written threat model for Enchat (`THREAT_MODEL.md`) that tells you exactly what encryption must solve — and what it can't.

## Before You Start

- Read (skim, ~10 min): [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- **Pre-check** (answer before reading on): A message in your app travels sender's browser → your server → recipient's browser. List every point along that path where someone other than the recipient could read it. Do this now, on paper or in your head — this is the exercise that matters.

## Core Concept

Encryption is not a feature you sprinkle on. It's a defense against a *specific
adversary*, and different adversaries require different defenses. Encrypt first
and ask questions later, and you'll build something that *feels* secure but
protects against nothing — the industry calls this **security theater**.

A threat model answers four questions (Adam Shostack's formulation):

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

For Enchat, three adversaries are worth naming right now:

- **The network observer** — someone on the same coffee-shop WiFi, an ISP,
  anyone between browser and server. Your app currently runs plain HTTP/WS, so
  this person reads *everything*. Defense: TLS (HTTPS/WSS) — *transport*
  encryption. Note this has nothing to do with encrypting message content.
- **The server itself** — the machine, the hosting provider, or anyone who
  compromises it sees every message in `roomStore` in plaintext. Your README
  promises privacy enforced by time, but a server-side breach — or a curious
  operator, i.e. *you* — breaks it instantly. Defense: **end-to-end**
  encryption, where plaintext never exists on the server. That's the track
  you're on.
- **Anyone holding the room link** — rooms are protected only by the secrecy of
  their ID. How hard is your room ID to guess, really? Go look at how you
  generate it. Defense: unguessability/authorization — *not* a crypto problem.

And one adversary you **cannot** defend against in a browser app: the server
that serves your JavaScript. A malicious server could serve JS that steals
keys. You can't code that away — but being able to *name* it in an interview is
senior-engineer thinking, and it belongs in your threat model's "out of scope"
section.

> **Reference:** [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) — bookmark this.

## Mental Model

Server-side encryption for a chat app is like sealing your diary in a safe,
then handing the safe **and the combination** to the courier. The courier is
one of the people you're hiding from.

E2EE is locking the safe *before* the courier arrives: the sender locks it,
only the recipient holds the combination, and the courier just carries a box
they can't open.

## Your Turn

1. **Map the data flow.** Take one message from keypress to display. List every
   hop (sender's JS → WebSocket frame → server memory in `roomStore` →
   broadcast → recipient's DOM). Annotate each: *who can read plaintext here?*
2. **Write `THREAT_MODEL.md`** at the repo root. For each adversary: what they
   can do today, what defense addresses them, which lesson in this track covers
   it. Include the three adversaries above plus an honest "out of scope"
   section.
3. **Classify each defense** as *transport encryption* / *end-to-end
   encryption* / *not crypto*. This classification is the actual skill being
   trained here.

<details><summary>Hint (try first!)</summary>

For exercise 1, you know the code best — trace `socket.emit("newMessage", ...)`
in `client/chat.js` through `handleNewMessage` in `src/handlers/chat.handlers.ts`
to `renderMessages`. At each step ask: "what does this variable contain, and
could a stranger see it?"

For the room-ID question: `crypto.randomUUID().split("-")[0]` — how many
possible values is that? Roughly how long would it take to try them all against
your own `/check-room` endpoint?
</details>

<details><summary>Reference solution (last resort)</summary>

A minimal `THREAT_MODEL.md` skeleton:

```markdown
# Enchat Threat Model

## Adversaries
| Adversary | Can do today | Defense | Type |
|-----------|--------------|---------|------|
| Network observer | Read all messages (plain HTTP/WS) | HTTPS/WSS | Transport |
| Server operator / breach | Read roomStore plaintext | Client-side E2EE | End-to-end |
| Stranger guessing room IDs | Join rooms uninvited (~32-bit IDs) | Longer IDs + rate limiting | Not crypto |

## Out of scope (honest limits)
- A malicious server serving key-stealing JavaScript — unavoidable in
  browser-delivered apps; mitigated only by trust + delivery integrity.
```

Yours should have *more* reasoning than this. The table is not the point — the
reasoning is.
</details>

## Check Your Understanding

1. Your app will soon encrypt every message with AES. Why does *where* the
   encryption happens (client vs. server) matter more than *which algorithm*
   you pick?
2. TLS already encrypts browser↔server traffic. Once you add HTTPS, why bother
   with E2EE at all? Which adversary survives TLS?
3. Name one attack no amount of message encryption can prevent in this
   architecture.

## What's Next

- Next lesson: `0002-the-key-problem.md` — where keys live is the whole game
- Read ahead: [MDN: Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- Try in your browser console right now: type `crypto.subtle` and just confirm
  it exists. No code yet.

> **Stuck?** Ask me a specific question. I won't give you code — I'll ask you
> questions until you figure it out.
