# Product Requirements Document (PRD)
## NITER Club Website

**Document Version:** 1.0
**Date:** August 10, 2026
**Status:** Draft
**Repository:** https://github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE

---

### 1. Overview

National Institute of Textile Engineering and Research (NITER) hosts several active student clubs and societies (Business & Innovation Club, Computer Club, Career Club, Cultural Club, Science Society, Language Club, and others), each currently relying on scattered channels — Facebook pages, WhatsApp/Messenger groups, and word of mouth — to manage membership, publicize events, and share updates. The **NITER Club Website** is a dedicated web platform that gives a club a single, professional, always-available home online: a place for visitors to learn who the club is, for prospective members to apply, for current members to stay informed, and for the executive committee to manage everything without needing a developer on hand.

> **Assumption:** This PRD is scoped for a single club's official website (the pattern implied by the repo name and typical "club website" projects). If the goal is instead a shared portal listing *all* NITER clubs, the core modules below still apply — Events, Notices, Gallery, Membership — just multiplied across club profiles instead of one club. Flag this and the rest of the doc set can be adjusted before development starts.

### 2. Problem Statement

- Club information is fragmented across Facebook, Google Forms, and group chats, making it hard for new students to discover the club or trust that it's active.
- Membership applications and renewals are handled manually (forms, spreadsheets), which doesn't scale and loses data year over year.
- Event promotion and registration have no central, searchable record — past events and their outcomes are effectively invisible after a few weeks.
- The executive committee has no easy way to publish notices/announcements without going through a designer or developer.
- There's no single, credible link to point new students, university administration, or sponsors toward.

### 3. Goals & Objectives

**Business goals**
- Establish a credible, permanent web presence for the club, independent of any single social platform.
- Reduce the manual overhead of running membership drives and event registrations.
- Increase event attendance and membership sign-ups through better visibility.

**User goals**
- Visitors can quickly understand what the club does and how to join.
- Students can apply for membership and register for events online in a few minutes.
- Members can see what's coming up and what they're already registered for.
- Executive committee members can publish an event or notice in under 5 minutes without touching code.

### 4. Target Users / Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Visitor** | Prospective student or outsider browsing the site | Learn about the club, see past activity, find contact info |
| **Applicant** | Student applying for membership | Simple application form, clear status on their application |
| **Member** | Approved club member | Event registration, notices, member profile |
| **Executive/Panel** | Committee member (event lead, secretary, etc.) | Publish events/notices, view registrations, manage gallery |
| **Admin (President/Moderator)** | Full club administrator | Everything above, plus manage members, executives, and site content |

### 5. Scope

**In scope (v1)**
- Public marketing site: Home, About, Executive Committee, Events, Notices, Gallery, Contact
- Membership application & approval workflow
- Event listing and registration
- Notice/announcement board
- Photo gallery, organized per event
- Admin dashboard for managing members, events, notices, gallery, and executives
- Authentication for members and admins (role-based)
- Contact form with email delivery

**Out of scope (v1)**
- Native mobile app
- Real-time chat/messaging between members
- Multi-club/multi-tenant support (unless the assumption above is corrected)
- Payment gateway integration (add only if a paid event is actually needed)
- Automated certificate generation (candidate for v2)

### 6. Functional Requirements

#### 6.1 Public Website
- FR1.1: Home page summarizing the club's mission, highlights, and latest 3 events/notices.
- FR1.2: About page with club history, mission/vision, and achievements.
- FR1.3: Executive Committee page listing the current panel with photo, name, role, and contact/social links.
- FR1.4: Events page listing upcoming and past events with filters (upcoming/past, category).
- FR1.5: Event detail page with description, date/time, venue, registration button, and linked gallery.
- FR1.6: Notices page listing announcements in reverse-chronological order.
- FR1.7: Gallery page grouped by event/album.
- FR1.8: Contact page with a form (name, email, message) and the club's official contact details/social links.

#### 6.2 Membership
- FR2.1: Membership application form capturing student ID, department, semester, and reason for joining.
- FR2.2: Application status tracking (Pending / Approved / Rejected) visible to the applicant.
- FR2.3: On approval, an account is auto-created and credentials/activation link emailed.
- FR2.4: Member profile page (edit contact info, view membership status).
- FR2.5: Admin view to review, approve, or reject pending applications, individually or in bulk.

#### 6.3 Events
- FR3.1: Admin/Executive can create, edit, and delete events (title, description, date, venue, banner image, capacity, registration deadline).
- FR3.2: Members can register for an event; visitor-open registration is a per-event toggle.
- FR3.3: Registration confirmation shown on-screen and sent by email.
- FR3.4: Admin can export the registrant list (CSV) per event.
- FR3.5: Capacity limits — registration closes automatically once an event is full.

#### 6.4 Notices
- FR4.1: Admin/Executive can publish, edit, pin, and archive notices.
- FR4.2: Notices support rich text and an optional attachment (PDF/image).

#### 6.5 Gallery
- FR5.1: Admin/Executive can upload photos to an event/album.
- FR5.2: Visitors can browse albums, with a lightbox view for individual photos.

#### 6.6 Admin Dashboard
- FR6.1: Role-based access: Admin (full access) vs. Executive (content only, no member/role management).
- FR6.2: Dashboard summary: member count, pending applications, upcoming events, recent notices.
- FR6.3: User/role management (Admin only) — promote a member to Executive, deactivate accounts.

### 7. Non-Functional Requirements

- **Performance:** Public pages load in under 2.5s on a typical mobile connection.
- **Responsiveness:** Fully usable on mobile, tablet, and desktop — most visitors will be on phones.
- **Security:** Passwords hashed (never stored in plaintext); role-based authorization enforced server-side, not just hidden in the UI.
- **Accessibility:** Reasonable color contrast, alt text on images, keyboard-navigable forms.
- **Availability:** Should tolerate the free/low-cost hosting tiers typical for a student project (design for occasional cold starts, not 99.99% uptime).
- **Data privacy:** Student personal data (ID, contact info) visible only to Admin/Executive roles, never public.

### 8. Success Metrics

- Number of membership applications submitted per semester.
- Event registration rate (registrations ÷ page views on event detail pages).
- Admin time-to-publish for an event or notice (target: under 5 minutes).
- Returning visitor rate (visitors who come back within 30 days).

### 9. Assumptions & Constraints

- Built and maintained by a small student team (likely 1–3 developers) with limited budget — favors free-tier hosting and open-source tools.
- No dedicated design or legal resource — the design system should be simple to implement and reuse (see `DESIGN.md`).
- English is the primary language for v1; Bangla localization is a possible v2 addition.

### 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Low initial adoption (students keep using Facebook) | Site looks empty, undermines credibility | Seed content before launch; cross-promote from the existing Facebook page |
| Single point of maintenance (one student graduates/leaves) | Site goes stale or breaks | Keep the codebase simple, documented, and hand it off each year |
| Spam membership/contact submissions | Wastes admin time, pollutes data | Basic rate-limiting + CAPTCHA on public forms |

### 11. Milestones (high-level)

1. **Phase 1:** Public site (Home, About, Events, Notices, Gallery, Contact) — static/read-only content
2. **Phase 2:** Auth + membership application/approval flow
3. **Phase 3:** Event registration + admin dashboard
4. **Phase 4:** Polish, gallery uploads, notice attachments, launch
