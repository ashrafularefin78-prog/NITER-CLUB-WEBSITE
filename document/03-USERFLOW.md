# User Flow
## NITER Club Website

**Document Version:** 1.0
**Date:** August 10, 2026
**Companion to:** `01-PRD.md`, `04-APPLICATION_FLOW.md`

---

### 1. Purpose

This document maps how each type of user moves through the site — what they see, what decisions they make, and where they can get stuck. It complements `04-APPLICATION_FLOW.md`, which covers the underlying technical/system flow for the same journeys.

### 2. Roles Covered

- **Visitor** — anyone not logged in
- **Applicant** — submitted a membership application, awaiting a decision
- **Member** — approved, logged-in student
- **Executive** — committee member with content-management access
- **Admin** — full administrative access

### 3. Visitor Journey — Discovering the Club

```mermaid
flowchart TD
    A[Land on Home page] --> B{What are they looking for?}
    B -->|General info| C[About page]
    B -->|What's happening| D[Events page]
    B -->|Proof it's active| E[Gallery / Notices]
    B -->|Who runs it| F[Executive Committee page]
    C --> G{Interested in joining?}
    D --> G
    E --> G
    F --> G
    G -->|Yes| H[Click 'Join the Club']
    G -->|No, just curious| I[Leave site]
    H --> J[Membership Application form]
```

### 4. Applicant Journey — Joining the Club

```mermaid
flowchart TD
    A[Fill membership application] --> B[Submit]
    B --> C[Confirmation screen: 'Application received']
    C --> D[Email sent: application received]
    D --> E{Admin reviews}
    E -->|Approved| F[Email: Welcome + login instructions]
    E -->|Rejected| G[Email: Not approved this cycle]
    F --> H[Applicant logs in as Member]
    G --> I[Can reapply next cycle]
```

**Edge cases:**
- Duplicate application with the same student ID → rejected at submission with a clear message.
- Applicant never receives the email (spam filter) → a "resend confirmation" option on a status-check page.

### 5. Member Journey — Registering for an Event

```mermaid
flowchart TD
    A[Member logs in] --> B[Browses Events page]
    B --> C[Opens an event they like]
    C --> D{Registration open & seats available?}
    D -->|No| E[Show 'Registration closed / Full']
    D -->|Yes| F[Click 'Register']
    F --> G{Logged in?}
    G -->|No| H[Redirect to login, then return to event]
    G -->|Yes| I[Confirm registration]
    I --> J[Registration saved]
    J --> K[Confirmation shown + email sent]
    K --> L[Event appears in 'My Registrations']
```

### 6. Member Journey — Managing Their Profile

```mermaid
flowchart TD
    A[Member logs in] --> B[Opens Profile page]
    B --> C[Views membership status]
    B --> D[Edits contact info]
    D --> E[Saves changes]
    B --> F[Views registered events]
    B --> G[Views notices relevant to them]
```

### 7. Executive Journey — Publishing an Event

```mermaid
flowchart TD
    A[Executive logs in] --> B[Opens Admin Dashboard]
    B --> C[Goes to Events tab]
    C --> D[Click 'New Event']
    D --> E[Fill title, description, date, venue, banner, capacity]
    E --> F[Save as Draft or Publish]
    F -->|Publish| G[Event goes live on public Events page]
    F -->|Draft| H[Saved, not visible publicly]
    G --> I[Registrations start coming in]
    I --> J[Executive monitors registrant list / exports CSV]
```

### 8. Admin Journey — Reviewing Membership Applications

```mermaid
flowchart TD
    A[Admin logs in] --> B[Dashboard shows 'X pending applications']
    B --> C[Opens Applications tab]
    C --> D[Reviews an applicant's details]
    D --> E{Decision}
    E -->|Approve| F[Status to Approved, account activated, email sent]
    E -->|Reject| G[Status to Rejected, email sent]
    E -->|Need more info| H[Leave pending, contact applicant manually]
```

### 9. Admin Journey — Managing Roles

```mermaid
flowchart TD
    A[Admin logs in] --> B[Opens Members tab]
    B --> C[Selects a member]
    C --> D{Action}
    D -->|Promote| E[Change role: Member to Executive]
    D -->|Deactivate| F[Status to Deactivated, login blocked]
    D -->|No change| G[Close panel]
```

### 10. Cross-Cutting Error & Empty States

| Situation | What the user sees |
|---|---|
| No upcoming events | "No upcoming events right now — check back soon" + link to past events |
| Event full | Disabled "Register" button, "Fully booked" label |
| Not logged in, tries to register | Redirected to login with a "log in to register" message, returned to the event afterward |
| Application already pending | "You already have an application under review" instead of a duplicate form |
| Session expired mid-action | Prompted to log in again; form data preserved where possible |
