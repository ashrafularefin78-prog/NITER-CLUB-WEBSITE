#!/usr/bin/env node
/**
 * NITER Clubs Portal — documentation.docx generator.
 *
 * Builds a professional Word document (OOXML) with zero external dependencies:
 * cover page with logo, auto-updating table of contents, styled headings,
 * tables, code blocks, page header/footer with page numbers.
 *
 * Usage:  node scripts/generate-docx.mjs
 * Output: documentation.docx  (project root)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "documentation.docx");
const LOGO = path.join(ROOT, "niter-logo-192.png");

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Render a run with optional bold / italic / code / color / size. */
function run(text, opts = {}) {
  const rPr = [];
  if (opts.b) rPr.push("<w:b/>");
  if (opts.i) rPr.push("<w:i/>");
  if (opts.code)
    rPr.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>');
  if (opts.color) rPr.push(`<w:color w:val="${opts.color}"/>`);
  if (opts.size) rPr.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
  return `<w:r>${rPrXml}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

/**
 * Inline mini-markup: **bold**, *italic*, `code`.
 * Returns concatenated run XML.
 */
function inline(text) {
  const tokens = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens
    .filter((t) => t !== "")
    .map((t) => {
      if (t.startsWith("**") && t.endsWith("**") && t.length > 4)
        return run(t.slice(2, -2), { b: true });
      if (t.startsWith("`") && t.endsWith("`") && t.length > 2)
        return run(t.slice(1, -1), { code: true });
      if (t.startsWith("*") && t.endsWith("*") && t.length > 2)
        return run(t.slice(1, -1), { i: true });
      return run(t);
    })
    .join("");
}

/** Body paragraph from inline-markup text. */
function p(text, opts = {}) {
  const pPr = [];
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);
  if (opts.style) pPr.push(`<w:pStyle w:val="${opts.style}"/>`);
  if (opts.before !== undefined) pPr.push(`<w:spacing w:before="${opts.before}"/>`);
  if (opts.after !== undefined) pPr.push(`<w:spacing w:after="${opts.after}"/>`);
  return `<w:p>${pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : ""}${inline(text)}</w:p>`;
}

function heading(level, text) {
  const style = `Heading${level}`;
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${inline(text)}</w:p>`;
}

const h1 = (t) => heading(1, t);
const h2 = (t) => heading(2, t);
const h3 = (t) => heading(3, t);

/** Bulleted paragraph — literal bullet with hanging indent. */
function bullet(text) {
  return (
    `<w:p><w:pPr><w:ind w:left="420" w:hanging="220"/></w:pPr>` +
    `<w:r><w:t xml:space="preserve">•\u00A0\u00A0</w:t></w:r>${inline(text)}</w:p>`
  );
}

/** Code block — one-cell shaded table containing monospace paragraphs. */
function code(lines) {
  const paras = lines
    .map(
      (l) =>
        `<w:p><w:pPr><w:pStyle w:val="Code"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`
    )
    .join("");
  return (
    `<w:tbl>` +
    `<w:tblPr><w:tblW w:w="9026" w:type="dxa"/><w:tblBorders>` +
    `<w:top w:val="single" w:sz="4" w:color="D9DEE8"/><w:left w:val="single" w:sz="4" w:color="D9DEE8"/>` +
    `<w:bottom w:val="single" w:sz="4" w:color="D9DEE8"/><w:right w:val="single" w:sz="4" w:color="D9DEE8"/>` +
    `<w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>` +
    `<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="160" w:type="dxa"/>` +
    `<w:bottom w:w="80" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid><w:gridCol w:w="9026"/></w:tblGrid>` +
    `<w:tr><w:tc><w:tcPr><w:tcW w:w="9026" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F5F7FB"/></w:tcPr>` +
    paras +
    `</w:tc></w:tr></w:tbl>` +
    `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`
  );
}

/** Professional table: navy header row, alternating body rows. */
function table(headers, rows, opts = {}) {
  const widths = opts.widths || rows.length ? null : null;
  const nCols = headers.length;
  const gridCols = Array.from({ length: nCols }, () => 1)
    .map(() => `<w:gridCol w:w="${Math.round(9026 / nCols)}"/>`)
    .join("");
  const headerCells = headers
    .map(
      (h) =>
        `<w:tc><w:tcPr><w:tcW w:w="${Math.round(9026 / nCols)}" w:type="dxa"/>` +
        `<w:shd w:val="clear" w:color="auto" w:fill="002147"/><w:vAlign w:val="center"/></w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:after="0" w:line="260" w:lineRule="auto"/></w:pPr>` +
        `<w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
        `<w:t xml:space="preserve">${esc(h)}</w:t></w:r></w:p></w:tc>`
    )
    .join("");
  const bodyCells = rows
    .map((row, ri) => {
      const fill = ri % 2 === 0 ? "FFFFFF" : "F5F7FB";
      const cells = row
        .map((c) => {
          const cellText =
            typeof c === "string"
              ? inline(c)
              : c
                  .map((line) => inline(line))
                  .join(`<w:r><w:br/></w:r>`);
          return (
            `<w:tc><w:tcPr><w:tcW w:w="${Math.round(9026 / nCols)}" w:type="dxa"/>` +
            `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/><w:vAlign w:val="center"/></w:tcPr>` +
            `<w:p><w:pPr><w:spacing w:after="0" w:line="260" w:lineRule="auto"/></w:pPr>` +
            cellText +
            `</w:p></w:tc>`
          );
        })
        .join("");
      return `<w:tr>${cells}</w:tr>`;
    })
    .join("");
  return (
    `<w:tbl>` +
    `<w:tblPr><w:tblW w:w="9026" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>` +
    `<w:top w:val="single" w:sz="4" w:color="C9D2E0"/><w:left w:val="single" w:sz="4" w:color="C9D2E0"/>` +
    `<w:bottom w:val="single" w:sz="4" w:color="C9D2E0"/><w:right w:val="single" w:sz="4" w:color="C9D2E0"/>` +
    `<w:insideH w:val="single" w:sz="4" w:color="C9D2E0"/><w:insideV w:val="single" w:sz="4" w:color="C9D2E0"/>` +
    `</w:tblBorders>` +
    `<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>` +
    `<w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${gridCols}</w:tblGrid>` +
    `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headerCells}</w:tr>` +
    bodyCells +
    `</w:tbl>` +
    `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`
  );
}

/** Horizontal amber rule (paragraph with bottom border). */
function rule() {
  return (
    `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="FFB606"/></w:pBdr>` +
    `<w:spacing w:before="0" w:after="0"/></w:pPr></w:p>`
  );
}

const pageBreak = () =>
  `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`;

/** TOC field — Word refreshes it automatically on open (updateFields). */
function tocField() {
  return (
    `<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr></w:p>` +
    `<w:p><w:pPr><w:pStyle w:val="TOCField"/></w:pPr>` +
    `<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>` +
    `<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>` +
    `<w:r><w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r><w:t>Table of contents — right-click and choose "Update Field" if it is empty.</w:t></w:r>` +
    `<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`
  );
}

/** One-row key/value line for the cover metadata. */
function kv(k, v) {
  return (
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:color w:val="002147"/></w:rPr><w:t xml:space="preserve">${esc(k)}:</w:t></w:r>` +
    `<w:r><w:t xml:space="preserve">\u00A0\u00A0${esc(v)}</w:t></w:r></w:p>`
  );
}

/* ------------------------------------------------------------------ */
/* Document content                                                    */
/* ------------------------------------------------------------------ */

const NAVY = "002147";
const NAVY_LIGHT = "1A3A5C";
const SKY = "428BCA";
const GRAY = "666666";

const B = []; // blocks

/* ---------- Cover page ---------- */
B.push(
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="2400" w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="1524000" cy="1524000"/><wp:docPr id="1" name="NITER Logo"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="niter-logo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1524000" cy="1524000"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`,
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="68"/><w:szCs w:val="68"/></w:rPr>` +
    `<w:t>NITER Clubs Portal</w:t></w:r></w:p>`,
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr>` +
    `<w:t>Project Documentation &amp; User Guide</w:t></w:r></w:p>`,
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="600" w:after="200"/></w:pPr>` +
    `<w:r><w:rPr><w:color w:val="${SKY}"/></w:rPr><w:t>One portal for every club at NITER</w:t></w:r></w:p>`,
  rule(),
  kv("Version", "4.0"),
  kv("Date", "August 18, 2026"),
  kv("Status", "Released"),
  kv("Repository", "github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE"),
  pageBreak()
);

/* ---------- Document control ---------- */
B.push(
  h1("Document Control"),
  p("This document is the single reference for the NITER Clubs Portal — its purpose, architecture, features, data model, setup, deployment and security model."),
  table(
    ["Version", "Date", "Author", "Description"],
    [
      ["1.0", "10 Aug 2026", "NITER Clubs Portal team", "Initial release — full project documentation."],
      ["2.0", "15 Aug 2026", "NITER Clubs Portal team", "Added club ads, events, memberships, committee editor, student directory and Appwrite mirroring."],
      ["3.0", "18 Aug 2026", "NITER Clubs Portal team", "Added club admin/moderator system, membership auto-creation from forms, email notifications, user profile enhancements."],
      ["4.0", "18 Aug 2026", "NITER Clubs Portal team", "Bug fixes: duplicate admin validation, signup form fields, TypeScript errors. Added Apache 2.0 license. Updated documentation."],
    ]
  ),
  h2("Revision History"),
  table(
    ["Version", "Date", "Change"],
    [
      ["1.0", "10 Aug 2026", "Initial release."],
      ["2.0", "15 Aug 2026", "Documented the moderator-published ads feature, club events, membership approvals, the committee editor with email notifications, the admin-only student directory and the Appwrite mirroring routes."],
      ["3.0", "18 Aug 2026", "Added club admin/moderator system: moderator approval workflow, auto-membership from forms, club admin panel, email notifications, user profile enhancements (phone, classId, role badges)."],
      ["4.0", "18 Aug 2026", "Bug fixes: duplicate admin validation error handling, signup form missing email/password for admin, TypeScript strict mode errors. Added Apache 2.0 license. Regenerated documentation."],
    ]
  ),
  h2("Related Documents"),
  bullet("**Product Requirements Document (PRD)** — `document/01-PRD.md`"),
  bullet("**Technical Requirements Document (TRD)** — `document/02-TRD.md`"),
  bullet("**User Flow** — `document/03-USERFLOW.md`"),
  bullet("**Application Flow** — `document/04-APPLICATION_FLOW.md`"),
  bullet("**Design System** — `document/05-DESIGN.md`"),
  bullet("**Firebase backend guide** — `firebase/README.md`"),
  bullet("**Appwrite provisioning guide** — `appwrite/README.md`"),
  bullet("**Next.js frontend guide** — `web/README.md`"),
  pageBreak()
);

/* ---------- TOC ---------- */
B.push(tocField(), pageBreak());

/* ---------- 1. Introduction ---------- */
B.push(
  h1("1. Introduction"),
  h2("1.1 Purpose"),
  p("This document describes the **NITER Clubs Portal**, the official web platform for the student clubs and societies of the National Institute of Textile Engineering and Research (NITER), Dhaka, Bangladesh. It covers the product goals, system architecture, feature set, technology stack, data model, installation and deployment instructions, security model and maintenance practices, so that developers, club executives and new contributors can understand and operate the project."),
  h2("1.2 Scope"),
  p("The portal ships as two interchangeable frontends sharing one backend model:"),
  bullet("the **legacy static application** — a single self-contained `index.html` that talks directly to Firebase, and"),
  bullet("the **modern Next.js rewrite** in `web/` — an industry-standard React 19 + TypeScript implementation of the same product."),
  p("Both are backed by **Firebase** (Firestore, Authentication, Storage); an **Appwrite** provisioning kit is included as an alternative backend option. This document covers both frontends, the shared data model, and all deployment paths."),
  h2("1.3 Intended Audience"),
  bullet("Developers and maintainers of the portal"),
  bullet("Club executives and administrators who manage content"),
  bullet("University administration and prospective contributors"),
  h2("1.4 Conventions"),
  p("Code, commands and identifiers are shown in `monospace`. Navigation paths such as *Portal → Settings → Members & roles* describe menu selections in the web interface.")
);

/* ---------- 2. Project Overview ---------- */
B.push(
  h1("2. Project Overview"),
  h2("2.1 Background"),
  p("NITER hosts more than ten active student clubs and societies — including the Computer Club, Science Society, Career Club, Language Club, Cultural Club, Games & Sports Club, Islamic Society, Robotics Club, Film and Photography Club, Journalism Society and Social Welfare Club. Historically, club activity was scattered across Facebook pages, WhatsApp and Messenger groups and word of mouth, which made it difficult for students to discover clubs, apply for membership, follow notices and register for events."),
  h2("2.2 The Product"),
  p("The NITER Clubs Portal gives every club a single, professional, always-available home online. Students can browse all clubs, read live notices, fill membership and event forms, export their own submissions, and file complaints. Club executives and admins get a member portal where they publish notices, build forms, review submissions, manage complaints and administer roles — all in real time, with no developer required."),
  h2("2.3 Goals"),
  bullet("Establish a credible, permanent web presence for every club, independent of any single social platform."),
  bullet("Reduce the manual overhead of membership drives, event registrations and announcements."),
  bullet("Increase event attendance and membership sign-ups through better visibility and live feedback."),
  bullet("Let club executives publish an event, notice or sponsored ad in under five minutes without touching code."),
  bullet("Protect student data — personal information is visible only to club staff, never to the public."),
  h2("2.4 Implementations"),
  p("The project contains two frontends with identical functionality:"),
  table(
    ["Implementation", "Location", "Description"],
    [
      ["Legacy static app", "`index.html` (repo root)", "Single-file HTML/CSS/JavaScript SPA. Zero build step — opens directly in a browser, talks to Firebase in-browser and mirrors submissions/accounts to Appwrite via optional API routes."],
      ["Next.js rewrite", "`web/`", "Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4. The recommended codebase for new feature work."],
    ]
  ),
  p("Both implementations share the same seeded demo dataset, the same Firebase project (`niter-club-website`) and the same Firestore security rules, so switching between them is transparent.")
);

/* ---------- 3. System Architecture ---------- */
B.push(
  h1("3. System Architecture"),
  h2("3.1 High-Level Overview"),
  p("The portal follows a serverless architecture: the frontend is a static web application that communicates directly with Firebase Backend-as-a-Service (BaaS). There is no application server to operate; authentication, database, file storage and security rules are all provided by Firebase."),
  code([
    "+----------------------+        +----------------------------------------+",
    "|   Browser (SPA)      |        |   Firebase (BaaS)                       |",
    "|                      |  HTTPS |                                        |",
    "|  Static index.html   |<------>|  Firestore  — structured data          |",
    "|  or Next.js (web/)   |        |  Auth       — email/password accounts  |",
    "|                      |        |  Storage    — photos & attachments     |",
    "|  Store: localStorage |        |  Rules      — per-collection security  |",
    "+----------------------+        +----------------------------------------+",
    "        |  ^                              ^",
    "        v  |                              |",
    "  Offline demo mode            Appwrite (alternative backend kit",
    "  (no Firebase config)         in appwrite/ — schema + MCP setup)",
  ]),
  h2("3.2 Frontend Layer"),
  bullet("**Routing** — hash-based routes (`#/clubs`, `#/club/:id`, `#/form/:id`, `#/portal`, …) render server-side-style views; unknown routes show a friendly 404 page with suggestions."),
  bullet("**Views** — every page (home, notices, clubs, club detail, form, complaints, IT helpdesk, portal) is a render function over a single in-memory database object."),
  bullet("**Live UI** — a live clock, per-form countdowns, relative timestamps, live stat chips and a realtime activity feed update automatically."),
  bullet("**Theming** — light/dark themes persisted in `localStorage` (`niter-theme`), fully responsive layouts."),
  h2("3.3 Data & Sync Layer"),
  p("All content lives in one `Database` object (`clubs`, `notices`, `forms`, `submissions`, `complaints`, `config`):"),
  code([
    "1. Load   — read localStorage (key niter-clubs-db-v8) or seed demo data with dates rebased to today",
    "2. React  — useDb() subscribes to the store via useSyncExternalStore (Next.js)",
    "3. Mutate — mutate(fn) applies a change, persists locally, schedules a push",
    "4. Sync   — hydrate from Firestore respecting the signed-in user's read scope;",
    "             a 30s poll plus storage events keep multiple tabs/devices in sync",
  ]),
  p("Public collections (`clubs`, `notices`, `forms`) are subscribed with Firestore `onSnapshot`, so edits made on one device appear live on all others. Restricted collections (`submissions`, `complaints`) subscribe per the user's read scope and re-subscribe when auth changes. A snapshot never overwrites a collection that holds un-pushed local changes."),
  h2("3.4 Offline Demo Mode"),
  p("If no Firebase configuration is present (`FB_CONFIG.apiKey` empty), the site runs fully offline: data persists in `localStorage` and the member portal is entered with the demo member code `niter2025`. This lets anyone evaluate the product without a backend.")
);

/* ---------- 4. Feature Overview ---------- */
B.push(
  h1("4. Feature Overview"),
  h2("4.1 Public Website"),
  table(
    ["Page", "Route", "Highlights"],
    [
      ["Home", "`#/`", "Hero with live clock and next deadline, live stat chips (clubs, open forms, submissions, reactions), sponsored ads carousel (§4.7), clubs grid, forms open now with countdowns, realtime activity feed, latest notices, student tools."],
      ["Notices", "`#/notices`", "Live feed of all club notices, pinned-first ordering, full-text search, club filter, emoji reactions."],
      ["Clubs", "`#/clubs`", "Directory of all 11 clubs and societies with search."],
      ["Club detail", "`#/club/:id`", "About, notices, forms, executives panel, contact info, complaint box, live forms-status panel."],
      ["Form filling", "`#/form/:id`", "Guided application forms with live countdown, validation, photo upload, payment TrxID capture, submission receipt with export."],
      ["Complaints", "`#/complaint/:clubId`", "Confidential complaint box per club with category, subject, details and optional contact."],
      ["IT support", "`#/it-support`", "Campus IT complaint box (WiFi, computer labs, portal, hardware, software)."],
      ["IT helpdesk", "`#/it-desk`", "Staff view of student-reported IT issues with status management."],
      ["Student directory", "`#/students`", "Official student roster — admin-only (hidden from the public navigation)."],
      ["Student profile", "`#/student/:key`", "Public per-student profile page with an initials avatar."],
    ]
  ),
  h2("4.2 Member Portal"),
  p("Signed-in executives and admins manage their club from the portal dashboard — eight tabs in the legacy app, seven in the Next.js app:"),
  table(
    ["Tab", "Capabilities"],
    [
      ["Notices", "Post, edit, pin and delete notices; optionally link a notice to a form."],
      ["Forms", "Build forms with a visual field builder (see §4.5), edit scheduling, view per-form analytics and submission counts."],
      ["Submissions", "Review, search and export submissions; view per-form analysis."],
      ["Memberships", "Review club join requests and approve or decline them (legacy: membership requests)."],
      ["Events", "Post club events with date, venue and capacity (legacy app)."],
      ["Ads", "Publish image/video ads for events — see §4.7."],
      ["Complaints", "Review complaints for the club, reply and update status (open / in progress / resolved)."],
      ["Settings", "Edit the club's committee & photos (§4.9), add a new club, manage members & roles, export/import JSON backups, reset local data, load sample data to the cloud."],
    ]
  ),
  h2("4.3 Authentication & Roles"),
  p("Authentication is email/password via Firebase Auth. The **first account created becomes the portal admin** (guarded by a `meta/bootstrap` marker so it can happen only once). Admins promote other users to executive and assign the clubs each executive manages."),
  p("During signup, users choose an **account type**. Members and moderators provide their name, class ID, phone number and email. Admins provide their name, student ID and select a club. Each club has exactly **one admin** — duplicate admin assignments are blocked with a validation error."),
  table(
    ["Role", "Access", "Approval"],
    [
      ["Visitor", "Browse all public content; fill forms; file complaints.", "—"],
      ["Member", "Public access plus the ability to track their own submissions, join requests and dashboard.", "Instant"],
      ["Moderator", "Helps manage a club (after admin approval) — same access as executive.", "Requires admin approval"],
      ["Executive", "Manage the clubs they are assigned to — notices, forms, submissions, complaints, ads and the committee.", "Admin promotes"],
      ["IT Staff", "Admin-granted role that unlocks the campus IT helpdesk.", "Admin promotes"],
      ["Club Admin", "Manages a single club — approves moderators, reviews memberships, everything the club needs.", "Instant (one per club)"],
      ["Global Admin", "Everything, plus role management and the ability to manage any club.", "First account"],
    ]
  ),
  p("**Moderator workflow** — when a student signs up as a moderator, a `ModeratorRequest` is created with status `pending`. The club admin is emailed immediately. The admin reviews the request in Portal → Settings → Moderator requests and approves or rejects it. Approved moderators are promoted to `executive` and gain portal access for their club."),
  h2("4.5 Form Engine"),
  p("Executives build forms from typed fields. Supported field types:"),
  table(
    ["Field type", "Behaviour"],
    [
      ["Text / Email / Phone / Number / Date / URL", "Validated input; phone validates the Bangladeshi 11-digit format (01XXXXXXXXX), email checks format."],
      ["Textarea", "Multi-line answer."],
      ["Select", "Dropdown with predefined options."],
      ["Radio", "Single choice from options."],
      ["Photo", "Camera/gallery picker; images are compressed client-side (max 480px, JPEG) and uploaded to Firebase Storage under `submission-photos/` — signed-in users under their own uid folder, guests under `guest/`."],
      ["Payment", "Payment-method dropdown (bKash, Nagad, Rocket, Bank transfer, Cash at venue, Other) plus a required Transaction Number (TrxID) for digital methods, with format validation."],
    ]
  ),
  p("Forms have an **open date**, **deadline** and live status (`opens soon` / `open` / `closed`); countdowns update in real time. After submission, the student sees a receipt screen and can export their submission as **JSON, CSV or print/PDF**."),
  h2("4.6 Realtime & Live Feedback"),
  bullet("Live clock and per-form countdowns on the home page and club pages."),
  bullet("Live stat chips — clubs, forms open now, forms opening soon, notices this week, total submissions, reactions."),
  bullet("Realtime activity feed of recent submissions across all clubs."),
  bullet("Emoji reactions on notices (👍 ❤️ 🎉 …), persisted and synchronised."),
  h2("4.7 Student Tools"),
  p("The home page links a dedicated **IT Complaint Box** for reporting campus IT issues — WiFi/internet, computer labs, email/portal, hardware/equipment, software/access and other categories. Complaints may be filed anonymously and carry a status lifecycle (open → in progress → resolved) with staff replies."),
  h2("4.8 Club Ads (moderator-published)"),
  p("Every club moderator can publish **image or video ads** for events from the portal's *Ads* tab. A published ad appears in the **sponsored carousel** on the homepage (and in the legacy app it also advertises the club's own page), rotating every six seconds with dots and prev/next controls. Autoplay honours `prefers-reduced-motion` and pauses on hover."),
  bullet("**Media** — upload an image or video file, or paste a URL. Images are downscaled client-side (max 1200 px, JPEG) and videos are capped at 15 MB; images at 8 MB."),
  bullet("**Uploads** — in the Next.js app, media is uploaded to Firebase Storage under `ad-media/{clubId}/` when connected, keeping Firestore documents small; offline mode stores an inline data URL (matching the legacy app)."),
  bullet("**Link target** — each ad links to the club page, a specific club form (\"Apply now\"), or an external URL."),
  bullet("**Lifecycle** — ads are `active` or `paused`; moderators can pause, resume, edit or delete their club's ads. Paused ads disappear from the carousel immediately."),
  bullet("**Access control** — the Ads tab is role-gated: only the club's moderators (executives assigned to the club) and admins can manage its ads (`canManageClub`)."),
  h2("4.9 Club Events"),
  p("Clubs post **events** (title, description, start/end time, venue, capacity) from the portal. Events appear on the club page, the homepage and each member's dashboard, and are capped by capacity."),
  h2("4.10 Memberships & Committee Management"),
  bullet("**Membership forms** — when a student submits a form whose title contains \"membership\", the system **automatically creates a membership request** (status: `pending`) in addition to storing the submission. This means club moderators can publish membership forms and get instant join requests."),
  bullet("**Approval workflow** — both the club admin and club moderators (executives) can approve or reject membership requests from the portal's Memberships tab. Approved members see their club on the dashboard. When approved, the student is emailed a notification."),
  bullet("**Notifications** — every membership form submission triggers an email to all club admins and moderators (`POST /api/membership-notify`). Every approval or rejection sends an email to the student (`POST /api/membership-decision-notify`)."),
  bullet("**Club admin panel** — global admins can reassign or remove a club's admin from Portal → Settings → Club Admin. The panel shows the current admin, allows selecting a new admin (validated for one-per-club), and supports removing the admin (demotes to member)."),
  bullet("**Committee editor** — the Settings tab lets a club's moderator edit the executive committee (role, name, photo — upload or URL). Every save is logged in a public *committee history* on the club page and the club's moderators are emailed via `POST /api/committee-notify`."),
  bullet("**Student dashboard** — signed-in students get a personal dashboard tracking their memberships, submissions and approvals. Profile badges show their role and which clubs they belong to."),
  h2("4.11 Student Directory & Public Profiles"),
  p("The portal ships an **official student roster** (B.Sc. CSE session 2025–26 and the full institute section lists). The directory is **admin-only** — the footer link is hidden for everyone else — and is backed by the Appwrite `students` collection when configured, falling back to the bundled roster offline. Each student gets a public profile page with an initials avatar."),
  h2("4.12 Appwrite Mirroring"),
  p("Both apps can optionally **mirror data to Appwrite** alongside Firebase/local storage. The static site mirrors form submissions and student accounts through its `DATA_API` origin; the Next.js app writes through `POST /api/submissions` (idempotent per form + submitter email, photo data-URLs dropped, payload capped) and `POST /api/users`. The Appwrite write is always best-effort — a slow or offline backend never blocks the student.")
);

/* ---------- 5. Technology Stack ---------- */
B.push(
  h1("5. Technology Stack"),
  h2("5.1 Shared Backend"),
  table(
    ["Service", "Technology", "Purpose"],
    [
      ["Database", "Firebase Firestore", "Structured, realtime-synchronised data (clubs, notices, forms, submissions, complaints, memberships, events, ads, users)."],
      ["Authentication", "Firebase Auth (email/password)", "Accounts and role-based sign-in for executives and admins."],
      ["File storage", "Firebase Storage", "Submission photos under `submission-photos/` and ad media under `ad-media/{clubId}/`."],
      ["Security", "Firestore & Storage security rules", "Role-based read/write enforcement, first-admin bootstrap marker."],
      ["Alternative backend", "Appwrite (kit in `appwrite/`)", "Provisioning + seed scripts and MCP server configs for an Appwrite-hosted schema; the web app reads the student directory and mirrors submissions/accounts through `/api` routes."],
    ]
  ),
  h2("5.2 Legacy Static App"),
  table(
    ["Layer", "Technology"],
    [
      ["Markup / UI", "HTML5 + CSS3, single `index.html`, Poppins font"],
      ["Logic", "Vanilla JavaScript (no framework), hash-based SPA routing"],
      ["Persistence", "localStorage (key `niter-clubs-db-v8`) + Firestore sync"],
      ["Build", "None — the file runs as-is"],
    ]
  ),
  h2("5.3 Next.js Frontend (web/)"),
  table(
    ["Layer", "Technology"],
    [
      ["Framework", "Next.js 15 (App Router), React 19"],
      ["Language", "TypeScript 5 (strict mode)"],
      ["Styling", "Tailwind CSS v4 with NITER brand tokens and `data-theme` dark mode"],
      ["Firebase", "Modular Firebase SDK v12 (`web/lib/firebase.ts`)"],
      ["State", "Custom client store with `useSyncExternalStore`, cross-tab sync, Firestore hydrate/push"],
      ["API routes", "`app/api/` — `/api/students` (directory), `/api/submissions` and `/api/users` (mirror), `/api/committee-notify`, `/api/moderator-notify`, `/api/membership-notify`, `/api/membership-decision-notify` (email notifications)"],
      ["Tooling", "ESLint 9, Prettier 3, `tsc --noEmit` typecheck"],
    ]
  ),
  h2("5.4 Design System"),
  p("The interface follows the design system in `document/05-DESIGN.md` — a deep navy foundation (`#002147`) with golden-amber accents (`#FFB606`), Poppins typography, a 4px spacing scale, WCAG-AA contrast and fully responsive breakpoints.")
);

/* ---------- 6. Data Model ---------- */
B.push(
  h1("6. Data Model"),
  h2("6.1 Firestore Collections"),
  table(
    ["Collection", "Document", "Who reads", "Who writes"],
    [
      ["`clubs`", "One doc per club (`computer-club`, …)", "Everyone", "Admins; executives of that club"],
      ["`notices`", "One doc per notice", "Everyone", "Admins / executives of the club"],
      ["`forms`", "One doc per form", "Everyone", "Admins / executives of the club"],
      ["`submissions`", "One doc per application", "Club staff", "Anyone (public application forms)"],
      ["`complaints`", "One doc per complaint", "Club staff", "Anyone (filing)"],
      ["`memberships`", "One doc per join request", "Self / club staff", "Anyone (requesting); staff (reviewing)"],
      ["`events`", "One doc per club event", "Everyone", "Admins / executives of the club"],
      ["`ads`", "One doc per ad (`ad-…`)", "Everyone", "Admins / executives of the club"],
      ["`users/{uid}`", "Profile + `role` + `clubs[]` + `phone` + `classId`", "Self / staff", "Self (name only), admins (roles)"],
      ["`moderatorRequests`", "One doc per moderator signup request", "Club admins", "System (on signup); admins (reviewing)"],
      ["`config/site`", "Institute name + semester list", "Everyone", "Admins"],
      ["`meta/bootstrap`", "First-admin marker", "Everyone", "Created once"],
    ]
  ),
  h2("6.2 Key Entities & Statuses"),
  bullet("**Roles** — `admin`, `executive`, `moderator`, `it-staff`, `member` (visitors have no record). Moderators start as `member` with a pending request; approved moderators become `executive`."),
  bullet("**ModeratorRequest** — `id`, `userId`, `clubId`, `status` (`pending`/`approved`/`rejected`), `requestedAt`, `reviewedAt`, `reviewedBy`, `userName`, `userEmail`, `studentId`."),
  bullet("**User profile fields** — `phone` and `classId` are stored for member and moderator accounts."),
  bullet("**Form status** — derived from `openAt` / `deadline`: `soon`, `open`, `closed`."),
  bullet("**Complaint status** — `open`, `in-progress`, `resolved`."),
  bullet("**Membership status** — `pending`, `approved`, `rejected`."),
  bullet("**Ad status** — `active` / `paused`; ads carry `clubId`, `title`, `tagline`, `media`, `mediaType` (image/video) and a `link` target."),
  bullet("**Submissions** — carry `formId`, `clubId` (for club-scoped queries), the field data and a `submittedAt` timestamp."),
  h2("6.3 Appwrite Alternative Schema"),
  p("The `appwrite/` kit can provision an equivalent backend on Appwrite: a `niter_club` database with `users`, `events`, `event_registrations`, `applications`, `notices`, `albums`, `photos` and `executives` collections, plus public storage buckets for event banners, gallery photos and notice attachments. `appwrite/seed-students.mjs` seeds the `students` collection used by the student directory, and `appwrite/seed-site-data.mjs` seeds clubs/notices/forms/events. The kit also includes MCP server configs so AI assistants and IDEs can operate the backend directly. See `appwrite/README.md`.")
);

/* ---------- 7. Setup & Installation ---------- */
B.push(
  h1("7. Setup & Installation"),
  h2("7.1 Prerequisites"),
  bullet("Node.js 18+ (LTS 20+ recommended) for the Next.js app and provisioning scripts."),
  bullet("A Firebase project (or an Appwrite instance) for the cloud backend."),
  bullet("A modern browser — no build step needed for the legacy app."),
  h2("7.2 Running the Legacy Static App"),
  p("Open `index.html` directly in a browser, or serve the project root with any static file server. Without Firebase configuration the site runs in offline demo mode."),
  h2("7.3 Running the Next.js App"),
  code([
    "cd web",
    "npm install",
    "npm run dev        # http://localhost:3000",
  ]),
  p("Scripts: `build`, `start`, `typecheck`, `lint` / `lint:fix`, `format` / `format:check`."),
  h2("7.4 Firebase Configuration"),
  p("The Firebase console setup is a one-time, ~3-minute task documented in `firebase/README.md`:"),
  code([
    "1. Console → create/enable the niter-club-website project (Firestore in Native mode, Email/Password auth, Storage bucket)",
    "2. Register a web app and paste the config snippet into the FB_CONFIG block in index.html",
    "3. Deploy the security rules:",
    "   cd firebase",
    "   npm i -g firebase-tools",
    "   firebase login",
    "   firebase deploy --only firestore:rules,storage",
  ]),
  p("After the first admin signs in, use *Portal → Settings → Cloud → Load sample data to cloud* to publish the seeded demo content to Firestore (only missing documents are added, so it is safe to press repeatedly)."),
  h2("7.5 Appwrite Provisioning (Alternative Backend)"),
  code([
    "cd appwrite",
    "cp .env.example .env     # then edit .env with your endpoint, project ID and API key",
    "npm install",
    "npm run setup:dry-run    # optional preview",
    "npm run setup            # creates database, collections, indexes and buckets (idempotent)",
    "npm run seed:students    # seeds the student roster (powers the directory)",
    "npm run seed:site        # seeds clubs, notices, forms and events",
  ]),
  p("To use the student directory and the Appwrite mirror in the web app, copy the three values into `web/.env.local` (see `appwrite/README.md`):"),
  code([
    "APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1",
    "APPWRITE_PROJECT_ID=…",
    "APPWRITE_API_KEY=…          # server key with databases.read — never sent to the browser",
  ]),
  h2("7.6 Demo Mode"),
  p("With no Firebase config, the member portal uses the demo member code `niter2025` and stores everything locally — ideal for evaluation and development.")
);

/* ---------- 8. Deployment ---------- */
B.push(
  h1("8. Deployment"),
  h2("8.1 Firebase Hosting (Legacy App)"),
  p("The static app can be hosted anywhere — Firebase Hosting, GitHub Pages, Netlify, or even opened locally, since the Firebase SDK works from `file://`. To deploy on Firebase Hosting:"),
  code([
    "cd firebase",
    "firebase init hosting    # point \"public\" at the project root (one level up)",
    "firebase deploy --only hosting",
  ]),
  h2("8.2 Next.js App"),
  code([
    "cd web",
    "npm run build",
    "npm start                # production server (default http://localhost:3000)",
  ]),
  p("The Next.js app includes `robots.ts`, `sitemap.ts`, `manifest.ts` and OpenGraph/JSON-LD metadata for search and social sharing."),
  h2("8.3 Continuous Integration"),
  p("GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, format check and a production build on every push, guarding the `main` branch."),
  h2("8.4 Environment Configuration"),
  p("The Firebase configuration defaults to the live `niter-club-website` project; the `apiKey` is public by design — security lives in the Firestore rules, not in the key. To point at another project, copy `web/.env.example` to `web/.env.local` and fill in the values.")
);

/* ---------- 9. Security ---------- */
B.push(
  h1("9. Security Model"),
  h2("9.1 Firestore Rules"),
  p("The rules in `firebase/firestore.rules` enforce the read/write matrix in §6.1 server-side — a client can never grant itself access by editing the UI. Key protections:"),
  bullet("Public collections (`clubs`, `notices`, `forms`, `events`, `ads`) are readable by anyone but writable only by the club's admins/executives."),
  bullet("Restricted collections (`submissions`, `complaints`, `memberships`) are readable only by club staff and scoped by club."),
  bullet("The ads and committee editors are double-guarded in code (`canManageClub` / `isPortalAdmin`), so a moderator can only touch their own club's content."),
  bullet("The student directory is hidden from the public navigation and gated to portal admins."),
  bullet("`users/{uid}` documents are writable by the owner (name only) and by admins (roles)."),
  bullet("The `meta/bootstrap` marker ensures the first admin account is created exactly once."),
  h2("9.2 Storage Rules"),
  p("`firebase/storage.rules` restrict uploads to `submission-photos/` paths; signed-in users write under their own `uid` folder while anonymous visitors write under `guest/`. Files are validated as images client-side (type and ≤ 8 MB) before upload."),
  h2("9.3 Data Privacy"),
  p("Student personal data — student IDs, phone numbers, photos, application details — is never exposed publicly. Only the club's staff can read submissions and complaints for their club."),
  h2("9.4 Platform Notes"),
  bullet("Passwords are handled entirely by Firebase Auth — they are never stored or logged in the application."),
  bullet("Role checks are re-verified from the user's Firestore profile on every restricted read, so revoking a role takes effect immediately."),
  bullet("The Appwrite variant (if used) keeps server-side API keys in `.env` (gitignored) and enforces roles in the backend; the web app's `/api` routes use those keys server-side only, so they never reach the browser.")
);

/* ---------- 10. Project Structure ---------- */
B.push(
  h1("10. Project Structure"),
  code([
    "NITER-CLUB-WEBSITE/",
    "├── index.html              # Legacy static SPA (Firebase + optional Appwrite mirroring)",
    "├── css/styles.css          # Legacy stylesheet",
    "├── campus/                 # Campus photography used by the web app hero",
    "├── committee/              # Committee portrait photos (local copies)",
    "├── document/               # PRD, TRD, user flow, application flow, design system",
    "├── plan/                   # Implementation plan & working notes",
    "├── firebase/               # Firestore rules, storage rules, hosting config",
    "│   ├── firestore.rules",
    "│   ├── storage.rules",
    "│   ├── firebase.json",
    "│   └── README.md",
    "├── appwrite/               # Alternative backend: setup + seed scripts + MCP configs",
    "│   ├── setup-appwrite.mjs",
    "│   ├── verify-appwrite.mjs",
    "│   ├── seed-students.mjs",
    "│   ├── seed-site-data.mjs",
    "│   ├── mcp.json / mcp.cloud.json",
    "│   └── README.md",
    "├── web/                    # Next.js 15 rewrite (recommended for new work)",
    "│   ├── app/                # Routes + /api (students, submissions, users, committee-notify, moderator-notify, membership-notify, membership-decision-notify)",
    "│   ├── components/         # layout, cards, ads carousel, countdown, views/…",
    "│   ├── lib/                # types, seed, store, firebase, auth, utils, appwrite-*",
    "│   ├── package.json",
    "│   └── README.md",
    "├── .github/workflows/ci.yml  # Typecheck + lint + format + build on push",
    "├── scripts/generate-docx.mjs  # This document's generator",
    "└── documentation.docx      # This document",
  ])
);

/* ---------- 11. Quality & Maintenance ---------- */
B.push(
  h1("11. Quality & Maintenance"),
  h2("11.1 Quality Gates"),
  table(
    ["Check", "Command (in web/)", "Purpose"],
    [
      ["Typecheck", "`npm run typecheck`", "TypeScript strict-mode validation."],
      ["Lint", "`npm run lint`", "ESLint 9 static analysis."],
      ["Format", "`npm run format:check`", "Prettier style consistency."],
      ["Build", "`npm run build`", "Production build verification."],
    ]
  ),
  h2("11.2 Maintenance Practices"),
  bullet("The codebase is deliberately small and self-documenting so it can be handed off each year as students graduate."),
  bullet("Seed data dates are rebased to today at runtime, so the demo always looks fresh."),
  bullet("Provisioning scripts (`appwrite/setup-appwrite.mjs`) are idempotent and safe to re-run."),
  bullet("Data can be backed up from the portal (Settings → Data → Export backup) and restored via import.")
);

/* ---------- 12. Roadmap ---------- */
B.push(
  h1("12. Roadmap & Future Work"),
  table(
    ["Area", "Planned improvement"],
    [
      ["Localisation", "Bangla (বাংলা) language support alongside English."],
      ["Notifications", "Email notifications for application status, event reminders and complaint replies (committee-edit emails already shipped via `/api/committee-notify`)."],
      ["Payments", "Direct integration with bKash / Nagad / SSLCommerz instead of manual TrxID capture."],
      ["Certificates", "Automated certificate generation for event participants and members."],
      ["Community", "Per-club discussion/chat and richer member profiles."],
      ["Analytics", "Deeper analytics — per-form conversion, club engagement and exportable reports."],
      ["Accessibility", "Formal WCAG AA audit and keyboard-navigation pass."],
      ["Mobile", "PWA installability polish and push notifications."],
    ]
  )
);

/* ---------- Appendix A ---------- */
B.push(
  h1("Appendix A — Reference"),
  table(
    ["Item", "Value"],
    [
      ["Repository", "https://github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE"],
      ["Firebase project", "`niter-club-website`"],
      ["Demo member code", "`niter2025` (offline demo mode)"],
      ["Local storage key", "`niter-clubs-db-v8`"],
      ["Ad media storage path", "`ad-media/{clubId}/` (Firebase Storage)"],
      ["Submission photos path", "`submission-photos/` (Firebase Storage)"],
      ["Next.js dev server", "http://localhost:3000"],
      ["Appwrite env vars", "`APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY` (web/.env.local)"],
      ["Primary documentation", "`document/01-PRD.md` … `document/05-DESIGN.md`"],
    ]
  ),
  h2("Key Commands"),
  code([
    "# Legacy app — open index.html directly, or:",
    "python -m http.server          # or any static server",
    "",
    "# Next.js app",
    "cd web && npm install && npm run dev",
    "",
    "# Firebase rules",
    "cd firebase && firebase deploy --only firestore:rules,storage,hosting",
    "",
    "# Appwrite provisioning",
    "cd appwrite && npm run setup",
  ])
);

/* ---------- Appendix B ---------- */
B.push(
  h1("Appendix B — Glossary"),
  table(
    ["Term", "Definition"],
    [
      ["BaaS", "Backend-as-a-Service — prebuilt cloud services (database, auth, storage) used instead of a self-managed server."],
      ["Firestore", "Firebase's realtime NoSQL document database."],
      ["onSnapshot", "Firestore subscription API that pushes document changes to the client in real time."],
      ["SPA", "Single-Page Application — one HTML page that swaps views in the browser."],
      ["PWA", "Progressive Web App — an installable web application."],
      ["TrxID", "Transaction ID — the reference number of a mobile-banking (bKash/Nagad/Rocket) or bank transfer."],
      ["MCP", "Model Context Protocol — a standard that lets AI assistants operate tools such as the Appwrite console."],
      ["Security rules", "Server-side Firestore/Storage policies that decide who may read or write each document."],
      ["CI/CD", "Continuous Integration / Continuous Deployment — automated checks and releases on every push."],
    ]
  ),
  p("", { after: 0 })
);

/* ------------------------------------------------------------------ */
/* OOXML part builders                                                 */
/* ------------------------------------------------------------------ */

const NS =
  'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ' +
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ' +
  'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
  'mc:Ignorable="w14 w15"';

const SECT_PR =
  `<w:sectPr>` +
  `<w:headerReference w:type="default" r:id="rIdHeader"/>` +
  `<w:footerReference w:type="default" r:id="rIdFooter"/>` +
  `<w:titlePg/>` +
  `<w:pgSz w:w="11906" w:h="16838"/>` +
  `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>` +
  `</w:sectPr>`;

function documentXml() {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `\r\n<w:document ${NS}><w:body>` +
    B.join("") +
    SECT_PR +
    `</w:body></w:document>`
  );
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" mc:Ignorable="w14 w15">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:latentStyles w:defLockedState="0" w:defUIPriority="99" w:defSemiHidden="0" w:defUnhideWhenUsed="0" w:defQFormat="0" w:count="376"/>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="120" w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="340" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY_LIGHT}"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="180" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:color w:val="${SKY}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="160"/><w:jc w:val="center"/><w:outlineLvl w:val="9"/></w:pPr><w:rPr><w:b/><w:color w:val="${NAVY}"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOCField"><w:name w:val="TOC Field"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:pPr><w:spacing w:after="60"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:pPr><w:spacing w:after="40"/><w:ind w:left="240"/></w:pPr><w:rPr><w:color w:val="${GRAY}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOC3"><w:name w:val="toc 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:autoRedefine/><w:pPr><w:spacing w:after="40"/><w:ind w:left="480"/></w:pPr><w:rPr><w:color w:val="${GRAY}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:right="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:color w:val="1F2937"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:i/><w:color w:val="${GRAY}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
</w:styles>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:zoom w:percent="100"/>
<w:updateFields w:val="true"/>
<w:defaultTabStop w:val="720"/>
<w:characterSpacingControl w:val="doNotCompress"/>
<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>
</w:settings>`;
}

function fontTableXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:font w:name="Calibri"><w:panose1 w:val="020F0502020204030204"/><w:charset w:val="00"/><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font>
<w:font w:name="Consolas"><w:panose1 w:val="020B0609020204030204"/><w:charset w:val="00"/><w:family w:val="modern"/><w:pitch w:val="fixed"/></w:font>
</w:fonts>`;
}

function headerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="FFB606"/></w:pBdr><w:jc w:val="right"/><w:spacing w:after="60"/></w:pPr>
<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>NITER Clubs Portal — Project Documentation v2.0</w:t></w:r>
</w:p></w:hdr>`;
}

function footerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60"/></w:pPr>
<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">Page </w:t></w:r>
<w:r><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r>
<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r>
<w:r><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:rPr><w:color w:val="${GRAY}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r>
</w:p></w:ftr>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function docRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>
</Relationships>`;
}

function coreXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>NITER Clubs Portal — Project Documentation</dc:title>
<dc:subject>Project documentation and user guide</dc:subject>
<dc:creator>NITER Clubs Portal team</dc:creator>
<cp:keywords>NITER, clubs, portal, documentation, Firebase, Next.js</cp:keywords>
<dc:description>Technical documentation and user guide for the NITER Clubs Portal — architecture, features, data model, setup, deployment and security.</dc:description>
<cp:lastModifiedBy>NITER Clubs Portal team</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-08-10T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-15T00:00:00Z</dcterms:modified>
<cp:revision>2</cp:revision>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>NITER Documentation Generator</Application>
<AppVersion>1.0</AppVersion>
</Properties>`;
}

/* ------------------------------------------------------------------ */
/* Minimal ZIP writer (store method, CRC-32)                           */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  // entries: [{ name, data: Buffer }]
  const local = [];
  const central = [];
  let offset = 0;
  const dosTime = ((9 << 11) | (30 << 5) | (30 >> 1)) & 0xffff; // 2026-08-30 09:30 approx
  const dosDate = (((2026 - 1980) << 9) | (8 << 5) | 30) & 0xffff;

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const size = data.length;

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // UTF-8 flag
    lh.writeUInt16LE(0, 8); // method: store
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(size, 18);
    lh.writeUInt32LE(size, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    local.push(lh, nameBuf, data);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); // version made by
    ch.writeUInt16LE(20, 6); // version needed
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(dosTime, 12);
    ch.writeUInt16LE(dosDate, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(size, 20);
    ch.writeUInt32LE(size, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38); // external attributes
    ch.writeUInt32LE(offset, 42); // local header offset
    central.push(ch, nameBuf);

    offset += 30 + nameBuf.length + size;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...local, centralBuf, eocd]);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

if (!fs.existsSync(LOGO)) {
  console.error(`Logo not found: ${LOGO}`);
  process.exit(1);
}

const logo = fs.readFileSync(LOGO);

const entries = [
  { name: "[Content_Types].xml", data: Buffer.from(contentTypesXml(), "utf8") },
  { name: "_rels/.rels", data: Buffer.from(rootRelsXml(), "utf8") },
  { name: "docProps/core.xml", data: Buffer.from(coreXml(), "utf8") },
  { name: "docProps/app.xml", data: Buffer.from(appXml(), "utf8") },
  { name: "word/document.xml", data: Buffer.from(documentXml(), "utf8") },
  { name: "word/styles.xml", data: Buffer.from(stylesXml(), "utf8") },
  { name: "word/settings.xml", data: Buffer.from(settingsXml(), "utf8") },
  { name: "word/fontTable.xml", data: Buffer.from(fontTableXml(), "utf8") },
  { name: "word/header1.xml", data: Buffer.from(headerXml(), "utf8") },
  { name: "word/footer1.xml", data: Buffer.from(footerXml(), "utf8") },
  { name: "word/_rels/document.xml.rels", data: Buffer.from(docRelsXml(), "utf8") },
  { name: "word/media/logo.png", data: logo },
];

const zip = buildZip(entries);
fs.writeFileSync(OUT, zip);
console.log(`Wrote ${OUT} (${(zip.length / 1024).toFixed(1)} KB, ${entries.length} parts)`);
