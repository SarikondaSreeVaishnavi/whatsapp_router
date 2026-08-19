# Router — Real-Time AI Notification Router

A standalone WhatsApp-style messaging application with a live intelligent notification router.

Every incoming message is automatically classified for the receiving user as:

- **Notify** — important messages that should be surfaced immediately
- **Digest** — useful messages that can be reviewed later
- **Muted** — low-priority or high-risk messages that should not interrupt the user

The router evaluates signals such as **trust, urgency, risk, relationship history, and notification fatigue** using real user and message data stored in MongoDB.

> **Note:** This is a standalone personal project. It is not integrated with WhatsApp and is not part of any official WhatsApp product.

---

## What the Project Does

Traditional messaging applications treat every incoming message similarly: every message generates a notification.

Router takes a different approach.

Instead of asking:

> "Did I receive a message?"

it asks:

> **"Does this message actually deserve my attention right now?"**

For every incoming message, the routing engine evaluates the message and its context before deciding whether it should be:

**Notify → Digest → Muted**

For example:

| Message | Route | Reason |
|---|---|---|
| "I need this ASAP" | Notify | High urgency |
| "Hey, check this when you're free" | Digest | Low urgency |
| "Your account will be blocked. Verify your OTP now." | Muted | Scam-like/high-risk pattern |

The application performs this routing **in real time for every recipient**.

---

## Key Features

### Real-Time Messaging

- One-to-one conversations
- Group conversations
- Real-time message delivery using Socket.io
- Session-based authentication
- Messages stored in MongoDB

### Intelligent Notification Routing

Every incoming message is evaluated using contextual signals including:

- Urgency
- Trust
- Risk
- Relationship history
- Notification fatigue
- Message patterns
- Sender/context signals

The router produces:

- Routing decision
- Confidence score
- Reason
- Raw signals used for the decision

### Smart Inbox

Messages are organized according to their routing decision.

Instead of one large notification stream, users can view:

- Notify
- Digest
- Muted

This allows users to focus on messages that actually require their attention.

### Authentication and Security

- bcrypt password hashing with cost factor 12
- JWT-based sessions
- JWT stored in `httpOnly` cookies
- `sameSite` cookie protection
- Helmet security headers
- MongoDB query sanitization
- Authentication rate limiting
- API rate limiting
- Server-side request validation
- File upload type restrictions
- 15 MB upload size limit
- Centralized error handling
- Secrets stored in environment variables
- `.env` excluded from Git

---

# How the Router Works

The routing pipeline can be summarized as:

```text
Incoming Message
       |
       v
Message + Sender Context
       |
       v
Signal Extraction
       |
       +-- Urgency
       +-- Trust
       +-- Risk
       +-- Relationship History
       +-- Notification Fatigue
       |
       v
Routing Decision
       |
       +-- Notify
       +-- Digest
       +-- Muted
       |
       v
Recipient's Smart Inbox
