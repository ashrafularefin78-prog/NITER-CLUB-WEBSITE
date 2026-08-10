# Application Flow
## NITER Club Website

**Document Version:** 1.0
**Date:** August 10, 2026
**Companion to:** `02-TRD.md`, `03-USERFLOW.md`

---

### 1. Purpose

Where `03-USERFLOW.md` describes what the *person* experiences, this document describes what the *system* does underneath each of those journeys — requests, middleware, database writes, and side effects like emails. Read it alongside `02-TRD.md` for the API and data model it references.

### 2. Request Lifecycle (every API call)

```mermaid
flowchart TD
    A[Client sends HTTPS request] --> B[CORS check]
    B --> C[Rate limiter]
    C --> D{Route requires auth?}
    D -->|No| G[Controller]
    D -->|Yes| E[Verify JWT]
    E -->|Invalid/expired| F[401 Unauthorized]
    E -->|Valid| E2{Role sufficient?}
    E2 -->|No| F2[403 Forbidden]
    E2 -->|Yes| G
    G --> H[Input validation]
    H -->|Invalid| I[400 Bad Request + field errors]
    H -->|Valid| J[Business logic / DB operation]
    J --> K[Response serialization]
    K --> L[JSON response to client]
```

### 3. Authentication Flow (Login)

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant DB as MongoDB

    C->>A: POST /auth/login (email, password)
    A->>DB: Find user by email
    DB-->>A: User document
    A->>A: bcrypt.compare(password, passwordHash)
    alt Password matches
        A->>A: Sign access token (15m) + refresh token (7d)
        A-->>C: 200 accessToken, Set-Cookie refreshToken (httpOnly)
    else Password mismatch or no user
        A-->>C: 401 Invalid credentials
    end
```

### 4. Membership Application → Approval Flow

```mermaid
sequenceDiagram
    participant C as Applicant (Client)
    participant A as API
    participant DB as MongoDB
    participant M as Email Service

    C->>A: POST /auth/register (name, email, studentId, ...)
    A->>DB: Check for existing user/application (email or studentId)
    alt Duplicate found
        A-->>C: 409 Conflict, already applied
    else No duplicate
        A->>DB: Create User (status pending) + Application
        A->>M: Send "Application received" email
        A-->>C: 201 Created
    end

    Note over A,DB: Later, Admin reviews
    A->>DB: Admin fetches pending Applications
    A->>DB: Admin updates Application status: approved or rejected
    alt Approved
        A->>DB: User status becomes active
        A->>M: Send "Welcome" email with login instructions
    else Rejected
        A->>M: Send "Not approved" email
    end
```

### 5. Event Registration Flow

```mermaid
sequenceDiagram
    participant C as Member (Client)
    participant A as API
    participant DB as MongoDB
    participant M as Email Service

    C->>A: POST /events/:id/register (JWT)
    A->>A: Verify JWT + role is member/executive/admin
    A->>DB: Fetch event (capacity, registrationDeadline, current count)
    alt Deadline passed or full
        A-->>C: 409 Registration closed
    else Open
        A->>DB: Check existing registration for this user+event
        alt Already registered
            A-->>C: 409 Already registered
        else Not yet registered
            A->>DB: Create EventRegistration
            A->>M: Send confirmation email
            A-->>C: 201 Registered
        end
    end
```

### 6. Image Upload Flow (Gallery / Event Banner)

```mermaid
sequenceDiagram
    participant C as Executive/Admin (Client)
    participant A as API
    participant S as Cloudinary

    C->>A: GET /uploads/signature (requests a signed upload)
    A->>A: Verify JWT + role is executive/admin
    A->>A: Generate Cloudinary signature (server-side, using secret)
    A-->>C: signature, timestamp, apiKey, cloudName
    C->>S: Direct upload (file + signature)
    S-->>C: secure_url
    C->>A: POST /gallery/:albumId/photos, url = secure_url
    A->>DB: Save Photo document referencing the URL
```

This keeps large binary files off the API server entirely — it only ever handles the signature and the resulting URL.

### 7. Frontend Route → Data Flow

| Route | Data fetched on load | Auth required |
|---|---|---|
| `/` | Latest 3 events, latest 3 notices | No |
| `/about` | Static content | No |
| `/events` | Paginated event list | No |
| `/events/:id` | Event detail + registration status (if logged in) | No (register action requires login) |
| `/notices` | Paginated notice list | No |
| `/gallery` | Album list | No |
| `/gallery/:albumId` | Photos in album | No |
| `/contact` | — (form only) | No |
| `/apply` | — (form only) | No |
| `/login` | — (form only) | No |
| `/profile` | Current user + their registrations | Yes (member+) |
| `/dashboard` | Role-appropriate summary (events, notices, applications, members) | Yes (executive/admin) |

### 8. State Management (Frontend)

- **Server state** (events, notices, gallery, applications, members) — managed by React Query: cached, revalidated on window focus, invalidated after mutations (e.g., creating an event invalidates the events list query).
- **Client/UI state** (form inputs, modal open/closed, active tab) — local component state via `useState`; no global store needed at this scale.
- **Auth state** — access token held in memory (React context), refreshed silently via the httpOnly refresh cookie; not persisted to `localStorage`, to reduce XSS token-theft risk.

### 9. Error Handling Pipeline

```mermaid
flowchart LR
    A[Error thrown in controller/middleware] --> B[Central error-handling middleware]
    B --> C{Known error type?}
    C -->|Validation| D[400 + field-level messages]
    C -->|Auth| E[401/403 + generic message]
    C -->|Not found| F[404]
    C -->|Unknown| G[500, logged server-side, generic message to client]
```

The frontend's API client catches all non-2xx responses in one place and surfaces a toast/inline error, so individual pages only need to handle the "happy path" plus any field-specific validation messages.

### 10. Notification/Email Touchpoints

| Trigger | Recipient | Channel |
|---|---|---|
| Membership application submitted | Applicant | Email |
| Application approved/rejected | Applicant | Email |
| Event registration confirmed | Member | Email |
| New contact form submission | Admin | Email |
| (Optional v2) Event reminder, 24h before | Registered members | Email |
