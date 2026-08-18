#!/usr/bin/env node
/**
 * NITER Clubs Portal — Project Summary .docx generator.
 *
 * Generates a professional Word document covering:
 *   1. Project Name
 *   2. Problem Statement
 *   3. Solution
 *   4. Tech Stack
 *   5. Future Impact
 *
 * Usage:  node scripts/generate-project-doc.mjs
 * Output: project-summary.docx (project root)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "project-summary.docx");
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

function table(headers, rows, opts = {}) {
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
          const cellText = typeof c === "string" ? inline(c) : c.map((line) => inline(line)).join(`<w:r><w:br/></w:r>`);
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

function rule() {
  return (
    `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="FFB606"/></w:pBdr>` +
    `<w:spacing w:before="0" w:after="0"/></w:pPr></w:p>`
  );
}

const pageBreak = () =>
  `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`;

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
const SKY = "428BCA";
const GRAY = "666666";

const B = [];

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
    `<w:t>Project Summary Document</w:t></w:r></w:p>`,
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="600" w:after="200"/></w:pPr>` +
    `<w:r><w:rPr><w:color w:val="${SKY}"/></w:rPr><w:t>One portal for every club at NITER</w:t></w:r></w:p>`,
  rule(),
  kv("Version", "1.0"),
  kv("Date", "August 18, 2026"),
  kv("Status", "Released"),
  kv("Repository", "github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE"),
  pageBreak()
);

/* ================================================================== */
/* 1. PROJECT NAME                                                     */
/* ================================================================== */
B.push(
  h1("1. Project Name"),
  p("**NITER Clubs Portal**", { align: "center", after: 200 }),
  p("The **NITER Clubs Portal** is a comprehensive web platform designed to centralize and streamline the operations of all student clubs and societies at the National Institute of Textile Engineering and Research (NITER), Dhaka, Bangladesh."),
  p("It serves as a single, professional, always-available home for every club — replacing the fragmented use of Facebook pages, WhatsApp groups, and word-of-mouth communication with a unified digital ecosystem."),
  pageBreak()
);

/* ================================================================== */
/* 2. PROBLEM STATEMENT                                                */
/* ================================================================== */
B.push(
  h1("2. Problem Statement"),
  p("NITER hosts more than ten active student clubs and societies, including the Computer Club, Science Society, Career Club, Language Club, Cultural Club, Games & Sports Club, Islamic Society, Robotics Club, Film and Photography Club, Journalism Society and Social Welfare Club."),
  h2("2.1 Core Problems"),
  bullet("**Fragmented Communication** — Club activities were scattered across Facebook pages, WhatsApp/Messenger groups, and word-of-mouth, making it difficult for students to discover and engage with clubs."),
  bullet("**No Centralized Membership System** — Membership drives were manual, paper-based, or依赖 onGoogle Forms with no integrated approval workflow. Students had no way to track their membership status."),
  bullet("**Event Management Chaos** — Event registrations were handled through separate Google Forms or Facebook events, with no capacity management, RSVP tracking, or attendance verification."),
  bullet("**No Digital Identity** — Clubs had no professional web presence independent of social media. When Facebook pages were taken down or groups became inactive, the club's digital footprint vanished."),
  bullet("**Manual Administrative Overhead** — Club executives spent hours manually collecting forms, sending reminders, and tracking applications with no automation or digital tools."),
  bullet("**Student Discovery Gap** — New students had no easy way to learn about available clubs, their activities, or how to get involved."),
  h2("2.2 Impact of These Problems"),
  p("These challenges led to reduced student engagement, lower event attendance, missed membership opportunities, and a fragmented campus culture where clubs operated in silos rather than as a cohesive community."),
  pageBreak()
);

/* ================================================================== */
/* 3. SOLUTION                                                         */
/* ================================================================== */
B.push(
  h1("3. Solution"),
  p("The **NITER Clubs Portal** addresses every problem identified above through a modern, feature-rich web application that serves students, club executives, and administrators."),
  h2("3.1 For Students"),
  bullet("**Discover Clubs** — Browse all 11+ clubs with search, detailed profiles, executive committee info, and contact details."),
  bullet("**Join Clubs** — Submit membership applications through digital forms with real-time status tracking (pending → approved/rejected)."),
  bullet("**Track Applications** — View all submitted forms, membership requests, and their statuses in a personal dashboard."),
  bullet("**Attend Events** — RSVP to club events, receive door codes for check-in, and earn participation certificates."),
  bullet("**File Complaints** — Submit confidential complaints about clubs with category-based routing and status tracking."),
  bullet("**Build Profile** — Maintain a public student profile with role badges, club memberships, and submission history."),
  h2("3.2 For Club Executives & Moderators"),
  bullet("**Publish Notices** — Post, pin, and manage club notices with emoji reactions and optional form attachments."),
  bullet("**Build Forms** — Create custom forms with a visual field builder (text, email, phone, photo upload, payment TrxID capture)."),
  bullet("**Review Submissions** — Approve or reject applications with one click, export data as CSV, and view analytics."),
  bullet("**Manage Memberships** — Review join requests, approve/reject with email notifications to students."),
  bullet("**Organize Events** — Post events with date, venue, capacity, door codes, and RSVP/waitlist management."),
  bullet("**Publish Ads** — Create image/video ads for events that appear in the homepage carousel."),
  h2("3.3 For Administrators"),
  bullet("**Role Management** — Promote members to executives, assign clubs, manage IT staff roles."),
  bullet("**Club Admin System** — Each club has exactly one admin who manages moderators, reviews memberships, and oversees operations."),
  bullet("**Moderator Approval** — Students can request to become moderators; admins review and approve/reject with email notifications."),
  bullet("**Audit Log** — Track all administrative actions with timestamps and actor information."),
  bullet("**Site Settings** — Configure institute name, hero content, and announcements from the portal."),
  h2("3.4 Key Features"),
  table(
    ["Feature", "Description"],
    [
      ["Real-time Sync", "Edits appear instantly across all devices via Firestore subscriptions."],
      ["Email Notifications", "Automated emails for membership submissions, approvals/rejections, and moderator requests."],
      ["Role-based Access", "Granular permissions: admin, executive, moderator, IT staff, member."],
      ["Offline Demo Mode", "Fully functional without Firebase — ideal for evaluation and development."],
      ["Responsive Design", "Works on desktop, tablet, and mobile with dark/light themes."],
      ["Data Export", "Export submissions as JSON, CSV, or print/PDF from any form."],
      ["Club Passport", "Gamified event attendance tracking across multiple clubs."],
      ["Student Directory", "Official roster with search and public profiles."],
    ]
  ),
  pageBreak()
);

/* ================================================================== */
/* 4. TECH STACK                                                       */
/* ================================================================== */
B.push(
  h1("4. Tech Stack"),
  h2("4.1 Frontend"),
  table(
    ["Technology", "Version", "Purpose"],
    [
      ["Next.js", "15 (App Router)", "React framework with server-side rendering and API routes."],
      ["React", "19", "UI component library with hooks and concurrent features."],
      ["TypeScript", "5 (strict)", "Type-safe JavaScript with compile-time error checking."],
      ["Tailwind CSS", "v4", "Utility-first CSS framework with NITER brand tokens."],
      ["Firebase SDK", "v12 (modular)", "Client-side Firebase integration (Auth, Firestore, Storage)."],
    ]
  ),
  h2("4.2 Backend & Services"),
  table(
    ["Service", "Technology", "Purpose"],
    [
      ["Database", "Firebase Firestore", "Realtime NoSQL document database for all content."],
      ["Authentication", "Firebase Auth", "Email/password accounts with role-based access."],
      ["File Storage", "Firebase Storage", "Submission photos and ad media uploads."],
      ["Security", "Firestore Rules", "Server-side role enforcement per collection."],
      ["Alternative Backend", "Appwrite", "Optional backend with MCP server integration."],
    ]
  ),
  h2("4.3 Development Tools"),
  table(
    ["Tool", "Purpose"],
    [
      ["ESLint 9", "Static code analysis and best practices enforcement."],
      ["Prettier 3", "Automatic code formatting for consistency."],
      ["GitHub Actions", "CI/CD pipeline running typecheck, lint, format, and build on every push."],
      ["Firebase CLI", "Deploy security rules, hosting, and Firestore indexes."],
    ]
  ),
  h2("4.4 Architecture"),
  p("The portal follows a **serverless architecture** — the frontend communicates directly with Firebase Backend-as-a-Service (BaaS). There is no application server to operate; authentication, database, file storage, and security rules are all provided by Firebase."),
  code([
    "+----------------------+        +----------------------------------------+",
    "|   Browser (SPA)      |        |   Firebase (BaaS)                       |",
    "|                      |  HTTPS |                                        |",
    "|  Static index.html   |<------>|  Firestore  — structured data          |",
    "|  or Next.js (web/)   |        |  Auth       — email/password accounts  |",
    "|                      |        |  Storage    — photos & attachments     |",
    "+----------------------+        +----------------------------------------+",
  ]),
  pageBreak()
);

/* ================================================================== */
/* 5. FUTURE IMPACT                                                    */
/* ================================================================== */
B.push(
  h1("5. Future Impact"),
  h2("5.1 For NITER Campus"),
  bullet("**Unified Digital Ecosystem** — All 11+ clubs operate from one platform, creating a cohesive campus culture."),
  bullet("**Increased Student Engagement** — Easy club discovery and digital membership drives will boost participation."),
  bullet("**Professional Club Presence** — Every club gets a permanent, professional web presence independent of social media."),
  bullet("**Data-Driven Decisions** — Analytics on membership, event attendance, and form submissions help clubs optimize."),
  h2("5.2 Scalability"),
  bullet("**Multi-Institute Support** — The architecture supports extending to other institutes by adding new club configurations."),
  bullet("**Plugin Architecture** — New features (payments, push notifications, chat) can be added modularly."),
  bullet("**Mobile App Potential** — The Next.js app can be wrapped as a PWA or converted to React Native."),
  h2("5.3 Social Impact"),
  bullet("**Inclusive Access** — Students from all backgrounds can discover and join clubs regardless of their social network."),
  bullet("**Transparency** — Public notices, form statuses, and audit logs create accountability."),
  bullet("**Community Building** — Features like the club passport and XP system encourage cross-club participation."),
  h2("5.4 Long-term Sustainability"),
  bullet("**Low Maintenance** — Serverless architecture means no servers to maintain; Firebase handles scaling."),
  bullet("**Knowledge Transfer** — The codebase is documented and designed for handoff between graduating student batches."),
  bullet("**Open Source** — MIT/Apache 2.0 license allows community contributions and forks."),
  h2("5.5 Expected Outcomes"),
  table(
    ["Metric", "Current State", "Expected After Portal"],
    [
      ["Club Discovery", "Word-of-mouth, Facebook only", "Centralized directory with search"],
      ["Membership Drives", "Manual/paper forms", "Digital forms with auto-approval workflow"],
      ["Event Attendance", "Untracked", "RSVP tracking, check-in, certificates"],
      ["Communication", "Scattered across platforms", "Unified notices with reactions"],
      ["Student Engagement", "Low visibility", "Dashboard with XP, badges, passport"],
      ["Administrative Time", "Hours per week", "Minutes with automation"],
    ]
  ),
  pageBreak()
);

/* ---------- Conclusion ---------- */
B.push(
  h1("Conclusion"),
  p("The **NITER Clubs Portal** is more than a website — it is a **digital transformation** for campus club life. By centralizing communication, automating administrative workflows, and providing a professional platform for every club, the portal empowers students to engage more deeply with their campus community."),
  p("With its modern tech stack, serverless architecture, and comprehensive feature set, the portal is built to scale, sustain, and evolve with NITER's growing club ecosystem for years to come."),
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

<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="002147"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="1A3A5C"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="200" w:after="60"/></w:pPr><w:rPr><w:b/><w:color w:val="428BCA"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>

<w:style w:type="header" w:styleId="Header"><w:name w:val="header"/><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="999999"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
<w:style w:type="footer" w:styleId="Footer"><w:name w:val="footer"/><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="999999"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
</w:styles>`;
}

function headerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:t>NITER Clubs Portal — Project Summary</w:t></w:r></w:p>
</w:hdr>`;
}

function footerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>
<w:r><w:t xml:space="preserve">Page </w:t></w:r>
<w:r><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:t>1</w:t></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r>
</w:p>
</w:ftr>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header.xml"/>
  <Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer.xml"/>
  <Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="niter-logo-192.png"/>
</Relationships>`;
}

/* ------------------------------------------------------------------ */
/* Write the .docx (zip)                                               */
/* ------------------------------------------------------------------ */

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const [name, content] of files) {
    const nameBytes = new TextEncoder().encode(name);
    const data = typeof content === "string" ? new TextEncoder().encode(content) : content;
    const size = data.length;
    const crc = crc32(data);

    // Local file header
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint32(18, crc, true);
    lv.setUint32(22, size, true);
    lv.setUint32(26, size, true);
    lh.set(nameBytes, 30);
    localHeaders.push({ header: lh, data });

    // Central directory header
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(26, nameBytes.length, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    centralHeaders.push(ch);

    offset += lh.length + size;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const ch of centralHeaders) cdSize += ch.length;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centralHeaders.length, true);
  ev.setUint16(10, centralHeaders.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);

  const parts = [];
  for (const { header, data } of localHeaders) {
    parts.push(header);
    parts.push(data);
  }
  for (const ch of centralHeaders) parts.push(ch);
  parts.push(eocd);

  const totalSize = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

// Read the logo as binary if it exists
let logoData = null;
if (fs.existsSync(LOGO)) {
  logoData = fs.readFileSync(LOGO);
}

const files = [
  ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`],
  ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`],
  ["word/_rels/document.xml.rels", relsXml()],
  ["word/document.xml", documentXml()],
  ["word/styles.xml", stylesXml()],
  ["word/header.xml", headerXml()],
  ["word/footer.xml", footerXml()],
];

if (logoData) {
  files.push(["word/niter-logo-192.png", logoData]);
}

const zip = buildZip(files);
fs.writeFileSync(OUT, zip);
console.log(`Wrote ${OUT} (${(zip.length / 1024).toFixed(1)} KB, ${files.length} parts)`);
