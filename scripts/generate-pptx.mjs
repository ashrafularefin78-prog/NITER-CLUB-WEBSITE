import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

// Theme colors
const NAVY = "0F172A";
const NAVY_MID = "1E293B";
const GOLD = "F59E0B";
const WHITE = "FFFFFF";
const GRAY = "94A3B8";
const LIGHT_GRAY = "F1F5F9";
const GREEN = "10B981";
const BLUE = "3B82F6";
const RED = "EF4444";

// Presentation settings
pptx.author = "NITER Clubs Portal Team";
pptx.company = "NITER";
pptx.subject = "NITER Clubs Portal";
pptx.title = "NITER Clubs Portal — Executive Presentation";
pptx.layout = "LAYOUT_WIDE";

// ============================================================
// SLIDE 1: COVER
// ============================================================
let slide = pptx.addSlide();
slide.background = { color: NAVY };

// Top accent line
slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 4, fill: { color: GOLD } });

// Overline
slide.addText("EXECUTIVE SUMMARY", {
  x: 0.8, y: 1.5, w: 8, h: 0.4,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 4
});

// Title
slide.addText("NITER Clubs\nPortal", {
  x: 0.8, y: 2.0, w: 8, h: 2.0,
  fontSize: 48, fontFace: "Arial", bold: true,
  color: WHITE, lineSpacingMultiple: 0.9
});

// Accent line under title
slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 4.1, w: 0.8, h: 4, fill: { color: GOLD } });

// Subtitle
slide.addText("A unified digital platform transforming how 11+ student clubs operate, communicate, and engage with 2,000+ students at the National Institute of Textile Engineering and Research.", {
  x: 0.8, y: 4.5, w: 8, h: 1.5,
  fontSize: 16, fontFace: "Arial",
  color: GRAY, lineSpacingMultiple: 1.5
});

// Tech stack tags
const tags = ["Next.js 15", "React 19", "TypeScript", "Firebase", "Tailwind CSS"];
tags.forEach((tag, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8 + (i * 1.8), y: 6.2, w: 1.6, h: 0.4,
    fill: { color: NAVY_MID }, rectRadius: 0.1,
    line: { color: "334155", width: 1 }
  });
  slide.addText(tag, {
    x: 0.8 + (i * 1.8), y: 6.2, w: 1.6, h: 0.4,
    fontSize: 9, fontFace: "Arial", bold: true,
    color: WHITE, align: "center", valign: "middle"
  });
});

// Date
slide.addText("August 2026 · v1.0", {
  x: 0.8, y: 7.0, w: 4, h: 0.3,
  fontSize: 10, fontFace: "Arial", color: "475569"
});

// ============================================================
// SLIDE 2: PROBLEM STATEMENT
// ============================================================
slide = pptx.addSlide();
slide.background = { color: WHITE };

// Section label
slide.addText("THE CHALLENGE", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

// Title
slide.addText("Problem Statement", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

// Lead text
slide.addText("NITER's student clubs face critical operational challenges that reduce engagement and increase administrative burden.", {
  x: 0.8, y: 1.6, w: 10, h: 0.6,
  fontSize: 14, fontFace: "Arial", color: GRAY, lineSpacingMultiple: 1.5
});

// Problem cards
const problems = [
  { icon: "📱", title: "Fragmented\nCommunication", desc: "Club activities scattered across Facebook, WhatsApp, and word-of-mouth." },
  { icon: "📝", title: "Manual\nProcesses", desc: "Paper forms, Google Forms, no approval workflow." },
  { icon: "📅", title: "Event\nManagement", desc: "No RSVP tracking, no capacity management." },
  { icon: "🌐", title: "No Digital\nIdentity", desc: "Clubs depend on Facebook pages." },
  { icon: "⏰", title: "Administrative\nOverhead", desc: "Hours spent manually collecting forms." },
  { icon: "🔍", title: "Discovery\nGap", desc: "No easy way to learn about clubs." },
];

problems.forEach((p, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.8 + (col * 3.8);
  const y = 2.5 + (row * 2.4);

  // Card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 3.5, h: 2.1,
    fill: { color: WHITE },
    line: { color: "E2E8F0", width: 1 },
    rectRadius: 0.1,
    shadow: { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.08 }
  });

  // Red left border
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.05, h: 2.1,
    fill: { color: RED }
  });

  // Icon
  slide.addText(p.icon, { x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.5, fontSize: 24 });

  // Title
  slide.addText(p.title, {
    x: x + 0.2, y: y + 0.65, w: 3.1, h: 0.6,
    fontSize: 13, fontFace: "Arial", bold: true, color: NAVY,
    lineSpacingMultiple: 1.1
  });

  // Description
  slide.addText(p.desc, {
    x: x + 0.2, y: y + 1.3, w: 3.1, h: 0.6,
    fontSize: 10, fontFace: "Arial", color: GRAY,
    lineSpacingMultiple: 1.3
  });
});

// ============================================================
// SLIDE 3: SOLUTION
// ============================================================
slide = pptx.addSlide();
slide.background = { color: NAVY };

slide.addText("OUR APPROACH", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("The Solution", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: WHITE
});

slide.addText("A comprehensive web platform that centralizes and automates all club operations.", {
  x: 0.8, y: 1.5, w: 10, h: 0.5,
  fontSize: 14, fontFace: "Arial", color: GRAY
});

const solutions = [
  { emoji: "🎓", title: "For Students", items: ["Discover & search all 11+ clubs", "Apply via digital forms with tracking", "Join clubs with real-time status", "RSVP to events & earn certificates", "Personal dashboard with XP & badges"] },
  { emoji: "🛡️", title: "For Club Executives", items: ["Publish notices with reactions", "Build custom forms (visual builder)", "Approve/reject with one click", "Manage events, RSVPs & waitlists", "Publish ads for events"] },
  { emoji: "👑", title: "For Administrators", items: ["Role management & club assignments", "One admin per club system", "Moderator approval workflow", "Audit log for all actions", "Site-wide settings control"] },
];

solutions.forEach((sol, i) => {
  const x = 0.8 + (i * 3.9);

  // Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 2.2, w: 3.6, h: 4.8,
    fill: { color: "1E293B" },
    line: { color: "334155", width: 1 },
    rectRadius: 0.1
  });

  // Emoji
  slide.addText(sol.emoji, { x: x + 0.3, y: 2.4, w: 0.6, h: 0.6, fontSize: 28 });

  // Title
  slide.addText(sol.title, {
    x: x + 0.3, y: 3.0, w: 3.0, h: 0.4,
    fontSize: 16, fontFace: "Arial", bold: true, color: WHITE
  });

  // Items
  sol.items.forEach((item, j) => {
    slide.addText(`✓  ${item}`, {
      x: x + 0.3, y: 3.5 + (j * 0.55), w: 3.0, h: 0.5,
      fontSize: 10, fontFace: "Arial", color: "CBD5E1",
      lineSpacingMultiple: 1.2
    });
  });
});

// ============================================================
// SLIDE 4: KEY METRICS
// ============================================================
slide = pptx.addSlide();
slide.background = { color: WHITE };

slide.addText("BY THE NUMBERS", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Key Metrics", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

// Stat cards
const stats = [
  { value: "11+", label: "Clubs Supported", color: GOLD },
  { value: "2,000+", label: "Potential Students", color: BLUE },
  { value: "6", label: "Role Types", color: GREEN },
  { value: "7", label: "API Endpoints", color: "8B5CF6" },
];

stats.forEach((s, i) => {
  const x = 0.8 + (i * 2.9);

  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 2.0, w: 2.6, h: 1.8,
    fill: { color: WHITE },
    line: { color: "E2E8F0", width: 1 },
    rectRadius: 0.1,
    shadow: { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.08 }
  });

  slide.addText(s.value, {
    x, y: 2.15, w: 2.6, h: 1.0,
    fontSize: 40, fontFace: "Arial", bold: true,
    color: s.color, align: "center"
  });

  slide.addText(s.label, {
    x, y: 3.1, w: 2.6, h: 0.5,
    fontSize: 11, fontFace: "Arial", color: GRAY, align: "center"
  });
});

// Roles table
slide.addText("Roles & Access", {
  x: 0.8, y: 4.2, w: 5, h: 0.4,
  fontSize: 14, fontFace: "Arial", bold: true, color: NAVY
});

const roleRows = [
  [{ text: "Role", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Approval", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Scope", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
  [{ text: "Visitor" }, { text: "—" }, { text: "Public" }],
  [{ text: "Member" }, { text: "Instant" }, { text: "Dashboard" }],
  [{ text: "Moderator" }, { text: "Admin" }, { text: "Club" }],
  [{ text: "Executive" }, { text: "Admin" }, { text: "Club" }],
  [{ text: "Club Admin" }, { text: "Instant" }, { text: "Single Club" }],
  [{ text: "Global Admin" }, { text: "First Account" }, { text: "All Clubs" }],
];

slide.addTable(roleRows, {
  x: 0.8, y: 4.6, w: 10, h: 2.5,
  fontSize: 10, fontFace: "Arial",
  border: { type: "solid", pt: 0.5, color: "E2E8F0" },
  colW: [2.5, 3, 4.5],
  autoPage: false
});

// ============================================================
// SLIDE 5: TECH STACK
// ============================================================
slide = pptx.addSlide();
slide.background = { color: LIGHT_GRAY };

slide.addText("TECHNOLOGY", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Tech Stack", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

// Frontend card
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 2.0, w: 5.3, h: 2.2,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
});

slide.addText("FRONTEND", {
  x: 1.1, y: 2.1, w: 4, h: 0.3,
  fontSize: 10, fontFace: "Arial", bold: true, color: GRAY, charSpacing: 2
});

const fe = ["Next.js 15 (App Router)", "React 19", "TypeScript 5 (strict)", "Tailwind CSS v4", "Firebase SDK v12"];
fe.forEach((t, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1 + (i % 3 * 1.7), y: 2.5 + (Math.floor(i / 3) * 0.7), w: 1.6, h: 0.5,
    fill: { color: NAVY }, rectRadius: 0.05
  });
  slide.addText(t, {
    x: 1.1 + (i % 3 * 1.7), y: 2.5 + (Math.floor(i / 3) * 0.7), w: 1.6, h: 0.5,
    fontSize: 8, fontFace: "Arial", bold: true, color: WHITE, align: "center", valign: "middle"
  });
});

// Backend card
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.5, y: 2.0, w: 5.3, h: 2.2,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
});

slide.addText("BACKEND", {
  x: 6.8, y: 2.1, w: 4, h: 0.3,
  fontSize: 10, fontFace: "Arial", bold: true, color: GRAY, charSpacing: 2
});

const be = ["Firebase Firestore", "Firebase Auth", "Firebase Storage", "Firestore Rules", "Appwrite (Alt)"];
be.forEach((t, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8 + (i % 3 * 1.7), y: 2.5 + (Math.floor(i / 3) * 0.7), w: 1.6, h: 0.5,
    fill: { color: BLUE }, rectRadius: 0.05
  });
  slide.addText(t, {
    x: 6.8 + (i % 3 * 1.7), y: 2.5 + (Math.floor(i / 3) * 0.7), w: 1.6, h: 0.5,
    fontSize: 8, fontFace: "Arial", bold: true, color: WHITE, align: "center", valign: "middle"
  });
});

// API Routes card
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 4.5, w: 11, h: 2.2,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
});

slide.addText("API ROUTES", {
  x: 1.1, y: 4.6, w: 4, h: 0.3,
  fontSize: 10, fontFace: "Arial", bold: true, color: GRAY, charSpacing: 2
});

const apis = ["/api/students", "/api/submissions", "/api/users", "/api/committee-notify", "/api/moderator-notify", "/api/membership-notify", "/api/membership-decision-notify"];
apis.forEach((t, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1 + (i % 4 * 2.7), y: 5.0 + (Math.floor(i / 4) * 0.7), w: 2.5, h: 0.5,
    fill: { color: "FEF3C7" }, rectRadius: 0.05
  });
  slide.addText(t, {
    x: 1.1 + (i % 4 * 2.7), y: 5.0 + (Math.floor(i / 4) * 0.7), w: 2.5, h: 0.5,
    fontSize: 8, fontFace: "Arial", bold: true, color: "92400E", align: "center", valign: "middle"
  });
});

// ============================================================
// SLIDE 6: ARCHITECTURE
// ============================================================
slide = pptx.addSlide();
slide.background = { color: NAVY };

slide.addText("SYSTEM DESIGN", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Architecture", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: WHITE
});

slide.addText("Serverless architecture — no application server to operate.", {
  x: 0.8, y: 1.5, w: 10, h: 0.5,
  fontSize: 14, fontFace: "Arial", color: GRAY
});

// Frontend box
slide.addShape(pptx.ShapeType.roundRect, {
  x: 2.0, y: 2.5, w: 2.5, h: 2.0,
  fill: { color: "1E293B" },
  line: { color: "334155", width: 1 },
  rectRadius: 0.1
});

slide.addText("🌐", { x: 2.0, y: 2.6, w: 2.5, h: 0.6, fontSize: 32, align: "center" });
slide.addText("Frontend", { x: 2.0, y: 3.2, w: 2.5, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: WHITE, align: "center" });
slide.addText("Next.js 15\nReact 19", { x: 2.0, y: 3.6, w: 2.5, h: 0.6, fontSize: 10, fontFace: "Arial", color: GRAY, align: "center" });

// Arrow
slide.addText("⟷", { x: 4.8, y: 3.0, w: 1.0, h: 1.0, fontSize: 32, color: GOLD, align: "center", valign: "middle" });

// Firebase box
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.0, y: 2.5, w: 2.5, h: 2.0,
  fill: { color: GOLD },
  rectRadius: 0.1
});

slide.addText("🔥", { x: 6.0, y: 2.6, w: 2.5, h: 0.6, fontSize: 32, align: "center" });
slide.addText("Firebase BaaS", { x: 6.0, y: 3.2, w: 2.5, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: NAVY, align: "center" });
slide.addText("Serverless Backend", { x: 6.0, y: 3.6, w: 2.5, h: 0.6, fontSize: 10, fontFace: "Arial", color: "92400E", align: "center" });

// Arrow
slide.addText("⟷", { x: 8.8, y: 3.0, w: 1.0, h: 1.0, fontSize: 32, color: GOLD, align: "center", valign: "middle" });

// Services box
slide.addShape(pptx.ShapeType.roundRect, {
  x: 10.0, y: 2.5, w: 2.5, h: 2.0,
  fill: { color: "1E293B" },
  line: { color: "334155", width: 1 },
  rectRadius: 0.1
});

slide.addText("📦", { x: 10.0, y: 2.6, w: 2.5, h: 0.6, fontSize: 32, align: "center" });
slide.addText("Services", { x: 10.0, y: 3.2, w: 2.5, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: WHITE, align: "center" });
slide.addText("Firestore · Auth\nStorage · Rules", { x: 10.0, y: 3.6, w: 2.5, h: 0.6, fontSize: 10, fontFace: "Arial", color: GRAY, align: "center" });

// Feature cards at bottom
const archFeatures = [
  { title: "Real-time Sync", desc: "Edits appear instantly via Firestore onSnapshot subscriptions." },
  { title: "Security Rules", desc: "Role-based read/write enforcement per collection." },
  { title: "Cross-platform", desc: "Responsive design with dark/light themes." },
];

archFeatures.forEach((f, i) => {
  const x = 0.8 + (i * 4.0);

  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 5.2, w: 3.7, h: 1.5,
    fill: { color: "1E293B" },
    line: { color: "334155", width: 1 },
    rectRadius: 0.1
  });

  slide.addText(f.title, {
    x: x + 0.2, y: 5.35, w: 3.3, h: 0.4,
    fontSize: 13, fontFace: "Arial", bold: true, color: GOLD
  });

  slide.addText(f.desc, {
    x: x + 0.2, y: 5.8, w: 3.3, h: 0.7,
    fontSize: 10, fontFace: "Arial", color: "CBD5E1",
    lineSpacingMultiple: 1.3
  });
});

// ============================================================
// SLIDE 7: DATA MODEL
// ============================================================
slide = pptx.addSlide();
slide.background = { color: WHITE };

slide.addText("DATA LAYER", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Data Model", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

const dataRows = [
  [{ text: "Collection", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Document", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Readers", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Writers", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
  [{ text: "clubs" }, { text: "One per club" }, { text: "Everyone" }, { text: "Admins / Executives" }],
  [{ text: "notices" }, { text: "One per notice" }, { text: "Everyone" }, { text: "Admins / Executives" }],
  [{ text: "forms" }, { text: "One per form" }, { text: "Everyone" }, { text: "Admins / Executives" }],
  [{ text: "submissions" }, { text: "One per application" }, { text: "Club Staff" }, { text: "Public" }],
  [{ text: "memberships" }, { text: "One per request" }, { text: "Self / Staff" }, { text: "Anyone / Staff" }],
  [{ text: "events" }, { text: "One per event" }, { text: "Everyone" }, { text: "Admins / Executives" }],
  [{ text: "users" }, { text: "Profile + Role" }, { text: "Self / Staff" }, { text: "Self / Admins" }],
  [{ text: "moderatorRequests" }, { text: "One per request" }, { text: "Club Admins" }, { text: "System / Admins" }],
];

slide.addTable(dataRows, {
  x: 0.8, y: 1.8, w: 11, h: 5.0,
  fontSize: 10, fontFace: "Arial",
  border: { type: "solid", pt: 0.5, color: "E2E8F0" },
  colW: [2.5, 3, 2.5, 3],
  autoPage: false
});

// ============================================================
// SLIDE 8: USER FLOWS
// ============================================================
slide = pptx.addSlide();
slide.background = { color: LIGHT_GRAY };

slide.addText("WORKFLOWS", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("User Flows", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

// Membership flow
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 2.0, w: 5.5, h: 5.0,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
});

slide.addText("🎓 Student Membership Flow", {
  x: 1.1, y: 2.1, w: 5, h: 0.4,
  fontSize: 14, fontFace: "Arial", bold: true, color: NAVY
});

const membershipSteps = [
  { num: "1", title: "Browse Clubs", desc: "Student discovers clubs on the portal" },
  { num: "2", title: "Submit Form", desc: "Fills membership form with required fields" },
  { num: "3", title: "Auto-Create Request", desc: "System creates membership request (pending)" },
  { num: "4", title: "Email Notification", desc: "Club admin & moderators notified" },
  { num: "5", title: "Review & Decide", desc: "Admin approves or rejects the request" },
  { num: "6", title: "Student Notified", desc: "Email sent with decision" },
];

membershipSteps.forEach((s, i) => {
  const y = 2.6 + (i * 0.7);

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 1.2, y: y, w: 0.35, h: 0.35,
    fill: { color: i < 3 ? NAVY : i < 5 ? GOLD : GREEN }
  });

  slide.addText(s.num, {
    x: 1.2, y: y, w: 0.35, h: 0.35,
    fontSize: 9, fontFace: "Arial", bold: true, color: WHITE, align: "center", valign: "middle"
  });

  slide.addText(s.title, {
    x: 1.7, y: y - 0.05, w: 4.0, h: 0.25,
    fontSize: 11, fontFace: "Arial", bold: true, color: NAVY
  });

  slide.addText(s.desc, {
    x: 1.7, y: y + 0.2, w: 4.0, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: GRAY
  });
});

// Moderator flow
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 2.0, w: 5.5, h: 5.0,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
});

slide.addText("🛡️ Moderator Approval Flow", {
  x: 7.1, y: 2.1, w: 5, h: 0.4,
  fontSize: 14, fontFace: "Arial", bold: true, color: NAVY
});

const modSteps = [
  { num: "1", title: "Student Signs Up", desc: "Selects 'Club Moderator' + chooses club" },
  { num: "2", title: "Pending Request", desc: "ModeratorRequest document created" },
  { num: "3", title: "Email to Admin", desc: "Admin notified via /api/moderator-notify" },
  { num: "4", title: "Admin Reviews", desc: "Portal → Settings → Moderator requests" },
  { num: "5", title: "Approve/Reject", desc: "User role updated to 'executive'" },
  { num: "6", title: "Portal Access", desc: "Moderator can now manage the club" },
];

modSteps.forEach((s, i) => {
  const y = 2.6 + (i * 0.7);

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.2, y: y, w: 0.35, h: 0.35,
    fill: { color: i < 3 ? NAVY : i < 5 ? GOLD : GREEN }
  });

  slide.addText(s.num, {
    x: 7.2, y: y, w: 0.35, h: 0.35,
    fontSize: 9, fontFace: "Arial", bold: true, color: WHITE, align: "center", valign: "middle"
  });

  slide.addText(s.title, {
    x: 7.7, y: y - 0.05, w: 4.0, h: 0.25,
    fontSize: 11, fontFace: "Arial", bold: true, color: NAVY
  });

  slide.addText(s.desc, {
    x: 7.7, y: y + 0.2, w: 4.0, h: 0.25,
    fontSize: 9, fontFace: "Arial", color: GRAY
  });
});

// ============================================================
// SLIDE 9: FEATURES
// ============================================================
slide = pptx.addSlide();
slide.background = { color: WHITE };

slide.addText("CAPABILITIES", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Features Deep Dive", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

const features = [
  { emoji: "📝", title: "Form Engine", desc: "Visual field builder with 10 field types: Text, Email, Phone, Number, Date, Textarea, Select, Radio, Photo, Payment", color: GOLD },
  { emoji: "🏆", title: "Gamification", desc: "XP for check-ins, RSVPs, certificates. Achievement badges. Club Passport stamps. Leaderboard rankings.", color: GREEN },
  { emoji: "📅", title: "Events System", desc: "RSVP with capacity limits. Auto-waitlist when full. Door code verification. Participation certificates.", color: BLUE },
  { emoji: "📣", title: "Club Ads", desc: "Moderator-published image/video ads in the homepage carousel. Scheduling, analytics, link targets.", color: "8B5CF6" },
];

features.forEach((f, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + (col * 5.8);
  const y = 2.0 + (row * 2.6);

  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.5, h: 2.3,
    fill: { color: WHITE },
    line: { color: "E2E8F0", width: 1 },
    rectRadius: 0.1,
    shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 }
  });

  // Top accent
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.5, h: 0.06,
    fill: { color: f.color }
  });

  slide.addText(f.emoji, { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fontSize: 24 });

  slide.addText(f.title, {
    x: x + 0.8, y: y + 0.2, w: 4.5, h: 0.4,
    fontSize: 16, fontFace: "Arial", bold: true, color: NAVY
  });

  slide.addText(f.desc, {
    x: x + 0.2, y: y + 0.8, w: 5.1, h: 1.2,
    fontSize: 11, fontFace: "Arial", color: GRAY,
    lineSpacingMultiple: 1.4
  });
});

// ============================================================
// SLIDE 10: SECURITY
// ============================================================
slide = pptx.addSlide();
slide.background = { color: NAVY };

slide.addText("PROTECTION", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Security Model", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: WHITE
});

// Firestore Rules
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 2.0, w: 5.5, h: 4.5,
  fill: { color: "1E293B" },
  line: { color: "334155", width: 1 },
  rectRadius: 0.1
});

slide.addText("Firestore Rules", {
  x: 1.1, y: 2.1, w: 5, h: 0.4,
  fontSize: 16, fontFace: "Arial", bold: true, color: GOLD
});

const firestoreRules = [
  "Public collections readable by anyone",
  "Restricted collections scoped by club",
  "Users can only update their own name",
  "Admins can update roles and clubs",
  "First-admin bootstrap marker",
  "Role checks on every restricted read",
];

firestoreRules.forEach((r, i) => {
  slide.addText(`✓  ${r}`, {
    x: 1.3, y: 2.6 + (i * 0.55), w: 4.8, h: 0.5,
    fontSize: 11, fontFace: "Arial", color: "CBD5E1"
  });
});

// Storage & Privacy
slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 2.0, w: 5.5, h: 4.5,
  fill: { color: "1E293B" },
  line: { color: "334155", width: 1 },
  rectRadius: 0.1
});

slide.addText("Storage & Privacy", {
  x: 7.1, y: 2.1, w: 5, h: 0.4,
  fontSize: 16, fontFace: "Arial", bold: true, color: GOLD
});

const storageRules = [
  "Submission photos under user uid folder",
  "Guest submissions under guest/ folder",
  "Image type validation (client-side)",
  "File size limits (8 MB photos)",
  "Student data never exposed publicly",
  "Passwords handled by Firebase Auth",
];

storageRules.forEach((r, i) => {
  slide.addText(`✓  ${r}`, {
    x: 7.3, y: 2.6 + (i * 0.55), w: 4.8, h: 0.5,
    fontSize: 11, fontFace: "Arial", color: "CBD5E1"
  });
});

// ============================================================
// SLIDE 11: IMPACT
// ============================================================
slide = pptx.addSlide();
slide.background = { color: WHITE };

slide.addText("OUTCOMES", {
  x: 0.8, y: 0.5, w: 4, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: GOLD, charSpacing: 3
});

slide.addText("Impact & Scalability", {
  x: 0.8, y: 0.8, w: 10, h: 0.8,
  fontSize: 36, fontFace: "Arial", bold: true, color: NAVY
});

const comparisons = [
  { before: "Club Discovery\nWord-of-mouth only", after: "Centralized Directory\nSearch, filter, discover" },
  { before: "Membership\nPaper forms, no tracking", after: "Digital Workflow\nAuto-create, approve, notify" },
  { before: "Event Management\nUntracked, low turnout", after: "Full Lifecycle\nRSVP, waitlist, certificates" },
  { before: "Communication\nScattered across platforms", after: "Unified Platform\nNotices, forms, ads" },
  { before: "Admin Time\nHours per week", after: "Automated\nMinutes with notifications" },
];

comparisons.forEach((c, i) => {
  const y = 1.8 + (i * 1.1);

  // Before
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y, w: 4.5, h: 0.9,
    fill: { color: "FEE2E2" },
    rectRadius: 0.08
  });
  slide.addText(c.before, {
    x: 1.0, y, w: 4.2, h: 0.9,
    fontSize: 10, fontFace: "Arial", bold: true, color: "991B1B",
    lineSpacingMultiple: 1.2, valign: "middle"
  });

  // Arrow
  slide.addText("→", {
    x: 5.5, y, w: 0.8, h: 0.9,
    fontSize: 20, fontFace: "Arial", bold: true, color: GOLD, align: "center", valign: "middle"
  });

  // After
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.5, y, w: 5.5, h: 0.9,
    fill: { color: "D1FAE5" },
    rectRadius: 0.08
  });
  slide.addText(c.after, {
    x: 6.7, y, w: 5.2, h: 0.9,
    fontSize: 10, fontFace: "Arial", bold: true, color: "065F46",
    lineSpacingMultiple: 1.2, valign: "middle"
  });
});

// ============================================================
// SLIDE 12: THANK YOU
// ============================================================
slide = pptx.addSlide();
slide.background = { color: GOLD };

slide.addText("12 / 12", {
  x: 10.5, y: 0.5, w: 2, h: 0.3,
  fontSize: 11, fontFace: "Arial", bold: true,
  color: "92400E", align: "right"
});

slide.addText("🏛️", { x: 5.5, y: 1.5, w: 2, h: 1.0, fontSize: 48, align: "center" });

slide.addText("Thank You", {
  x: 2, y: 2.5, w: 9, h: 1.2,
  fontSize: 54, fontFace: "Arial", bold: true,
  color: NAVY, align: "center"
});

slide.addText("NITER Clubs Portal\nOne Portal for Every Club", {
  x: 2, y: 3.7, w: 9, h: 1.0,
  fontSize: 18, fontFace: "Arial",
  color: "92400E", align: "center", lineSpacingMultiple: 1.4
});

// Contact card
slide.addShape(pptx.ShapeType.roundRect, {
  x: 3.0, y: 5.0, w: 7, h: 1.5,
  fill: { color: WHITE },
  rectRadius: 0.1,
  shadow: { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.1 }
});

slide.addText("Repository: github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE\nDemo: localhost:3000 or open index.html\nContact: developer@niter.edu.bd", {
  x: 3.3, y: 5.1, w: 6.4, h: 1.3,
  fontSize: 11, fontFace: "Arial",
  color: NAVY, lineSpacingMultiple: 1.6
});

slide.addText("Built with ❤️ for the NITER community", {
  x: 2, y: 6.8, w: 9, h: 0.4,
  fontSize: 10, fontFace: "Arial",
  color: "92400E", align: "center"
});

// ============================================================
// SAVE
// ============================================================
const outputPath = "C:\\Users\\user\\Downloads\\Clubs\\NITER-Clubs-Portal-Presentation.pptx";
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log(`Wrote ${outputPath}`))
  .catch(err => console.error("Error:", err));
