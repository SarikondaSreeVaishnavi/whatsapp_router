# Router — a standalone WhatsApp-style app with a live AI notification router

A full-stack messaging app (MongoDB + Express + React + Socket.io) where
every incoming message is automatically routed to **Notify** / **Digest**
/ **Muted** for the receiving user, in real time. This is the same
trust/urgency/risk/fatigue engine from the HackerRank Orchestrate
submission, ported from the offline CSV-based version to run live against
real accounts and a real database.

**This is a separate personal project, not part of the hackathon
submission.** It is not integrated with WhatsApp in any way — it's a
standalone chat app.

## What's real here

- Real signup/login with bcrypt-hashed passwords and JWT sessions in
  httpOnly cookies (not readable by client-side JS — mitigates XSS token
  theft)
- Real MongoDB storage (Atlas) for users, groups, messages, and routing
  decisions
- Real-time delivery over Socket.io, authenticated off the same session
  cookie
- The AI router runs on every message, for every recipient, computing
  trust/urgency/risk/fatigue from actual relationship history in the
  database (not sample CSVs) — see `server/src/router-ai/`

## What's intentionally not included (be aware of this)

- **Image OCR / voice transcription**: the original Python submission
  had pytesseract OCR and a Whisper hook; this Node port does not (yet)
  extract text from attached media, to keep the initial build shippable.
  Media messages are still routed correctly using sender/context signals,
  just without inspecting the file content. This is flagged in the
  `reason` field on any message with an attachment, not hidden.
- Password reset / email verification flows
- Production file storage (uploads go to local disk — fine for a demo,
  swap for S3/Cloudinary before any real deployment)
- Refresh-token rotation (single JWT with a 7-day expiry, in this MVP)

## Security implemented

- Passwords hashed with bcrypt (cost factor 12), never stored or logged
  in plaintext
- JWT in an httpOnly, sameSite cookie — not accessible to JavaScript, so
  a successful XSS injection still can't steal the session token
- `helmet` for standard security headers
- `express-mongo-sanitize` strips `$`/`.` operators from request
  bodies/queries, blocking NoSQL injection
- Rate limiting on auth endpoints (brute-force protection) and the API
  generally
- Server-side input validation (`express-validator`) on every write
  endpoint, not just client-side form checks
- File upload restrictions: type allowlist + 15MB size cap
- Centralized error handler that never leaks stack traces to the client
- No secrets in code — everything sensitive comes from `.env`, which is
  gitignored
- The router's own scam/prompt-injection detection still applies here:
  a message that tries to instruct the system directly is muted as
  `scam`, regardless of who sent it

**Not claimed: "100% secure."** No real system can honestly claim that.
This is solid, real-world practice for a project at this stage — not a
guarantee, and not a substitute for a security review before handling
real users' real data at scale.

## Setup

### 1. MongoDB Atlas

You already have Atlas — grab your connection string (Atlas dashboard →
Database → Connect → Drivers), and make sure your current IP is allow-
listed under Network Access (or allow `0.0.0.0/0` for local dev only).

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `MONGODB_URI` — your real Atlas connection string
- `JWT_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- leave `CLIENT_ORIGIN`, `PORT`, `NODE_ENV` as-is for local dev

```bash
npm run dev
```

You should see `[db] connected to MongoDB` and `[server] listening on
http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api`, `/uploads`,
and `/socket.io` to the backend on port 5000, so the browser sees
everything as one origin — no CORS/cookie headaches in dev.

### 4. Try it

1. Sign up two accounts in two browser windows (or one normal + one
   incognito, since sessions are per-browser-profile cookies)
2. Start a chat between them, or create a group with both
3. Send a message with urgent language ("need this asap") vs. a plain
   one vs. something with scam-shaped text ("verify your OTP now or your
   account will be blocked") — watch the route badge and click it to see
   the reason, confidence, and raw signals
4. Check the **Smart Inbox** tab to see everything grouped by decision
   across all your conversations

## Project structure

```
whatsapp-router/
├── server/                  # Express + MongoDB + Socket.io API
│   └── src/
│       ├── models/           User, Group, Message, MessageRoute
│       ├── router-ai/        the router itself (patterns, signals, decide)
│       ├── controllers/      auth, users, groups, messages
│       ├── routes/
│       ├── middleware/       auth, security, upload, error handling
│       └── sockets/          real-time delivery
└── client/                  # React + Vite + Tailwind
    └── src/
        ├── pages/            Login, Signup, ChatShell
        ├── components/       Sidebar, ChatWindow, SmartInbox, RouteBadge, ...
        └── context/          Auth, Socket
```

## A note on how this was built

I wrote and syntax-validated every file (backend via `node --check`,
frontend via the TypeScript compiler's parser in transpile-only mode),
but I could not run `npm install` or connect to a live MongoDB instance
while building this — my working environment has no internet access. So:
this has **not** been integration-tested end-to-end. Budget time for a
first real run to surface anything that only shows up when the pieces
actually talk to each other (a typo in a field name, an edge case in
how Mongoose populates a ref, etc.) — the architecture and logic have
been carefully reasoned through, but "compiles" and "works" are
different claims, and I want to be honest about which one I can make.
