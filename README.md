<div align="center">
  <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
    <img src="./public/enchat.jpg" alt="Enchat" width="90" style="margin: 0; display: block;" />
    <h1 style="margin: 0; line-height: 1; display: flex; align-items: center; border-bottom: none">Enchat</h1>
  </div>
  <p>A minimalist, high-security, ephemeral chat application.</p>
  <img src="./public/preview/preview.webp" width="500" alt="enchat preview" />
</div>

## The Idea

Enchat is designed for time-sensitive conversations. It operates on a "zero-persistence & fully secure" model where privacy is enforced by time.

- **Ephemeral by Default:** Chatrooms exist only for a set duration. Once the timer expires, the room and its entire history are purged.
- **E2E Encryption:** Messages in rooms are fully encrypted so chats stay private.
- **No Persistence:** Messages are never stored in a database. Data lives only in memory and is cleared when the session ends.
- **No Login:** No login required to create rooms and start conversing.
- **On-Demand Rooms:** Users can generate unique, temporary room IDs to invite participants.

## Core Features

- **Real-time Synchronization:** Instant message delivery via WebSockets.
- **E2EE:** Fully End-To-End encrypted messages via ECDH key exchange and AES-GCM for maximum privacy.
- **Join/Create Logic:** Simple entry via unique Room IDs.
- **Session Countdown:** Visible timer indicating when the chat will be destroyed.
