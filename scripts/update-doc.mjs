import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, Header, Footer, PageNumber, NumberFormat } from 'docx';
import { writeFileSync } from 'fs';

const H1 = HeadingLevel.HEADING_1;
const H2 = HeadingLevel.HEADING_2;
const H3 = HeadingLevel.HEADING_3;
const H4 = HeadingLevel.HEADING_4;

const brand = { primary: '002147', accent: 'FFB606', white: 'FFFFFF', light: 'F5F7FA' };
const p = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 22, ...opts })], spacing: { after: 120 } });
const pb = (text) => p(text, { bold: true, size: 24 });
const bullet = (text) => new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 22 })], bullet: { level: 0 }, spacing: { after: 80 } });
const boldBullet = (label, desc) => new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Calibri', size: 22 }), new TextRun({ text: desc, font: 'Calibri', size: 22 })], bullet: { level: 0 }, spacing: { after: 80 } });
const heading = (text, level) => new Paragraph({ children: [new TextRun({ text, font: 'Calibri', bold: true })], heading: level, spacing: { before: 240, after: 120 } });
const spacer = () => new Paragraph({ spacing: { after: 60 } });

const headerCell = (text) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 20, bold: true, color: brand.white })] })],
  shading: { type: ShadingType.SOLID, color: brand.primary },
  width: { size: 25, type: WidthType.PERCENTAGE }
});
const cell = (text, opts = {}) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 20, ...opts })] })],
  width: { size: opts.width || 25, type: WidthType.PERCENTAGE }
});
const row = (...cells) => new TableRow({ children: cells });

const makeTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: headers.map(h => headerCell(h)) }),
    ...rows.map(r => row(...r.map(c => cell(c))))
  ]
});

const children = [];

// === TITLE PAGE ===
children.push(new Paragraph({ spacing: { before: 4000 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'NITER Clubs Portal', font: 'Calibri', size: 60, bold: true, color: brand.primary })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'Project Documentation & User Guide', font: 'Calibri', size: 32, color: brand.accent })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'One portal for every club at NITER', font: 'Calibri', size: 24, italics: true, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'Version: 5.0', font: 'Calibri', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'Date: August 19, 2026', font: 'Calibri', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'Status: Released', font: 'Calibri', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
children.push(new Paragraph({ children: [new TextRun({ text: 'Repository: github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE', font: 'Calibri', size: 22 })], alignment: AlignmentType.CENTER }));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === DOCUMENT CONTROL ===
children.push(heading('Document Control', H1));
children.push(p('This document is the single reference for the NITER Clubs Portal — its purpose, architecture, features, data model, setup, deployment and security model.'));

children.push(makeTable(
  ['Version', 'Date', 'Author', 'Description'],
  [
    ['1.0', '10 Aug 2026', 'NITER Clubs Portal team', 'Initial release — full project documentation.'],
    ['2.0', '15 Aug 2026', 'NITER Clubs Portal team', 'Added club ads, events, memberships, committee editor, student directory and Appwrite mirroring.'],
    ['3.0', '18 Aug 2026', 'NITER Clubs Portal team', 'Added club admin/moderator system, membership auto-creation from forms, email notifications, user profile enhancements.'],
    ['4.0', '18 Aug 2026', 'NITER Clubs Portal team', 'Bug fixes: duplicate admin validation, signup form fields, TypeScript errors. Added MIT license. Updated documentation.'],
    ['5.0', '19 Aug 2026', 'NITER Clubs Portal team', 'Major update: NITER AI (258+ KB entries), Bangla language support, Grok-style conversation engine, Hermes AI Agent, emotional intelligence, personality system, exam system details, healthcare info, anti-ragging policy, proctorial body info, campus details.']
  ]
));

children.push(spacer());

// === REVISION HISTORY ===
children.push(heading('Revision History', H1));
children.push(makeTable(
  ['Version', 'Date', 'Change'],
  [
    ['1.0', '10 Aug 2026', 'Initial release.'],
    ['2.0', '15 Aug 2026', 'Documented the moderator-published ads feature, club events, membership approvals, the committee editor with email notifications, the admin-only student directory and the Appwrite mirroring routes.'],
    ['3.0', '18 Aug 2026', 'Added club admin/moderator system: moderator approval workflow, auto-membership from forms, club admin panel, email notifications, user profile enhancements (phone, classId, role badges).'],
    ['4.0', '18 Aug 2026', 'Bug fixes: duplicate admin validation error handling, signup form missing email/password for admin, TypeScript strict mode errors. Added MIT license. Regenerated documentation.'],
    ['5.0', '19 Aug 2026', 'NITER AI knowledge engine (258+ entries across 30+ topics), Grok AI-style conversational engine v4.0 with emotional intelligence and personality, Bangla language support (100+ translations), Hermes AI Agent, exam system details, healthcare information, anti-ragging policy, proctorial body details, campus facilities, international partnerships, scholarship info, general knowledge capabilities, Islamic greeting support, context memory system.']
  ]
));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 1. INTRODUCTION ===
children.push(heading('1. Introduction', H1));

children.push(heading('1.1 Purpose', H2));
children.push(p('This document describes the NITER Clubs Portal, the official web platform for the student clubs and societies of the National Institute of Textile Engineering and Research (NITER), Dhaka, Bangladesh. It covers the product goals, system architecture, feature set, technology stack, data model, installation and deployment instructions, security model and maintenance practices.'));

children.push(heading('1.2 Scope', H2));
children.push(p('The portal ships as two interchangeable frontends sharing one backend model:'));
children.push(bullet('The legacy static application — a single self-contained index.html that talks directly to Firebase'));
children.push(bullet('The modern Next.js rewrite in web/ — an industry-standard React 19 + TypeScript implementation'));
children.push(p('Both are backed by Firebase (Firestore, Authentication, Storage); an Appwrite provisioning kit is included as an alternative backend option.'));

children.push(heading('1.3 NITER AI Assistant', H2));
children.push(p('A standout feature of the portal is NITER AI — an intelligent conversational assistant powered by 258+ knowledge base entries covering academics, campus life, career guidance, examination system, healthcare, anti-ragging policies, and general knowledge. It supports both English and Bangla (বাংলা) languages with emotional intelligence, personality, and Grok AI-style conversational abilities.'));

children.push(heading('1.4 Intended Audience', H2));
children.push(bullet('Developers and maintainers of the portal'));
children.push(bullet('Club executives and administrators who manage content'));
children.push(bullet('University administration and prospective contributors'));
children.push(bullet('Students who use NITER AI for campus information'));

children.push(heading('1.5 Conventions', H2));
children.push(p('Code, commands and identifiers are shown in monospace. Navigation paths such as Portal → Settings → Members & roles describe menu selections in the web interface.'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 2. PROJECT OVERVIEW ===
children.push(heading('2. Project Overview', H1));

children.push(heading('2.1 Background', H2));
children.push(p('NITER hosts more than ten active student clubs and societies — including the Computer Club, Science Society, Career Club, Language Club, Cultural Club, Games & Sports Club, Islamic Society, Robotics Club, Film and Photography Club, Journalism Society and Social Welfare Club. Historically, club activity was scattered across Facebook pages, WhatsApp and Messenger groups and word of mouth.'));

children.push(heading('2.2 The Product', H2));
children.push(p('The NITER Clubs Portal gives every club a single, professional, always-available home online. Students can browse all clubs, read live notices, fill membership and event forms, chat with NITER AI, and file complaints. Club executives and admins get a member portal where they publish notices, build forms, review submissions, manage complaints and administer roles.'));

children.push(heading('2.3 Goals', H2));
children.push(bullet('Establish a credible, permanent web presence for every club, independent of any single social platform'));
children.push(bullet('Reduce the manual overhead of membership drives, event registrations and announcements'));
children.push(bullet('Increase event attendance and membership sign-ups through better visibility and live feedback'));
children.push(bullet('Let club executives publish an event, notice or sponsored ad in under five minutes without touching code'));
children.push(bullet('Protect student data — personal information is visible only to club staff, never to the public'));
children.push(bullet('Provide intelligent AI assistance for all NITER-related queries in English and Bangla'));
children.push(bullet('Support natural language conversations with emotional intelligence and personality'));

children.push(heading('2.4 Implementations', H2));
children.push(makeTable(
  ['Implementation', 'Location', 'Description'],
  [
    ['Legacy static app', 'index.html (repo root)', 'Single-file HTML/CSS/JavaScript SPA with NITER AI. Zero build step — opens directly in a browser, talks to Firebase in-browser.'],
    ['Next.js rewrite', 'web/', 'Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4. The recommended codebase for new feature work.']
  ]
));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 3. SYSTEM ARCHITECTURE ===
children.push(heading('3. System Architecture', H1));

children.push(heading('3.1 High-Level Overview', H2));
children.push(p('The portal follows a serverless architecture: the frontend is a static web application that communicates directly with Firebase Backend-as-a-Service (BaaS). There is no application server to operate; authentication, database, file storage and security rules are all provided by Firebase.'));

children.push(heading('3.2 NITER AI Architecture', H2));
children.push(p('NITER AI is a client-side intelligent assistant built into the legacy static app. It uses a multi-layered architecture:'));

children.push(makeTable(
  ['Layer', 'Component', 'Description'],
  [
    ['Input', 'Spell Corrector', 'Corrects typos using domain vocabulary (NAI_VOCAB) with Levenshtein distance'],
    ['Input', 'Bangla Translator', 'Translates Bangla (বাংলা) to English using 100+ word/phrase mappings sorted by length'],
    ['Input', 'Slang Expander', 'Expands internet slang (brb → be right back, lol → laughing out loud, etc.)'],
    ['Intent', 'Intent Classifier', 'Classifies user intent into categories (greeting, emotion, math, general knowledge, KB query)'],
    ['Intent', 'Emotion Detector', 'Detects 10 emotions: happy, sad, angry, anxious, excited, confused, bored, urgent, curious, grateful'],
    ['Intent', 'Context Tracker', 'Tracks conversation history (30 messages), topics discussed, user profile, rapport score'],
    ['Engine', 'Knowledge Base', '258+ entries covering 30+ topics with keyword matching and confidence scoring'],
    ['Engine', 'General Knowledge', 'Responses for philosophy, weather, time, love, advice, exam tips, and more'],
    ['Engine', 'Math Engine', 'Solves mathematical expressions with step-by-step solutions'],
    ['Engine', 'Personality System', 'Witty catchphrases, rapport building, random humor, campus-themed jokes'],
    ['Output', 'Response Generator', 'Builds contextual responses with reasoning, confidence scores, and topic suggestions'],
    ['Output', 'Hermes AI Agent', 'Advanced AI agent with task automation, data analysis, and multi-step reasoning']
  ]
));

children.push(heading('3.3 Frontend Layer', H2));
children.push(bullet('Routing — hash-based routes (#/clubs, #/club/:id, #/form/:id, #/portal, …) render server-side-style views'));
children.push(bullet('Views — every page (home, notices, clubs, club detail, form, complaints, IT helpdesk, portal, niter-ai) is a render function over a single in-memory database object'));
children.push(bullet('Live UI — a live clock, per-form countdowns, relative timestamps, live stat chips and a realtime activity feed update automatically'));
children.push(bullet('Theming — light/dark themes persisted in localStorage (niter-theme), fully responsive layouts'));

children.push(heading('3.4 Data & Sync Layer', H2));
children.push(p('All content lives in one Database object (clubs, notices, forms, submissions, complaints, config):'));
children.push(bullet('Load — read localStorage (key niter-clubs-db-v8) or seed demo data with dates rebased to today'));
children.push(bullet('React — useDb() subscribes to the store via useSyncExternalStore (Next.js)'));
children.push(bullet('Mutate — mutate(fn) applies a change, persists locally, schedules a push'));
children.push(bullet('Sync — hydrate from Firestore respecting the signed-in user\'s read scope; a 30s poll plus storage events keep multiple tabs/devices in sync'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 4. FEATURE OVERVIEW ===
children.push(heading('4. Feature Overview', H1));

children.push(heading('4.1 Public Website', H2));
children.push(makeTable(
  ['Page', 'Route', 'Highlights'],
  [
    ['Home', '#/', 'Hero with live clock and next deadline, live stat chips, sponsored ads carousel, clubs grid, forms open now with countdowns, realtime activity feed, latest notices, student tools.'],
    ['Notices', '#/notices', 'Live feed of all club notices, pinned-first ordering, full-text search, club filter, emoji reactions.'],
    ['Clubs', '#/clubs', 'Directory of all 11 clubs and societies with search.'],
    ['Club detail', '#/club/:id', 'About, notices, forms, executives panel, contact info, complaint box, live forms-status panel.'],
    ['Form filling', '#/form/:id', 'Guided application forms with live countdown, validation, photo upload, payment TrxID capture, submission receipt with export.'],
    ['Complaints', '#/complaint/:clubId', 'Confidential complaint box per club with category, subject, details and optional contact.'],
    ['IT support', '#/it-support', 'Campus IT complaint box (WiFi, computer labs, portal, hardware, software).'],
    ['IT helpdesk', '#/it-desk', 'Staff view of student-reported IT issues with status management.'],
    ['Student directory', '#/students', 'Official student roster — admin-only.'],
    ['Student profile', '#/student/:key', 'Public per-student profile page with initials avatar.'],
    ['NITER AI', '#/niter-ai', 'Intelligent conversational assistant with 258+ KB entries, Bangla support, emotional intelligence, and general knowledge.']
  ]
));

children.push(heading('4.2 NITER AI — Intelligent Assistant', H2));
children.push(p('NITER AI is the flagship feature of the portal — a client-side intelligent assistant that can answer 258+ topics about NITER campus life, academics, career guidance, and more. It supports both English and Bangla (বাংলা) languages.'));

children.push(heading('4.2.1 Knowledge Base Coverage', H3));
children.push(makeTable(
  ['Category', 'Entries', 'Topics Covered'],
  [
    ['Academics', '45+', 'Admission, fees, departments, grading, exam system, syllabus, credit system, academic calendar'],
    ['Campus Life', '35+', 'Hostels, canteen, WiFi, transport, labs, library, medical center, campus location'],
    ['Departments', '25+', 'TE, CSE, EEE, IPE, FDAE — courses, labs, career paths, faculty contacts'],
    ['Career & Industry', '30+', 'RMG industry, internships, job placement, skills, companies, salary ranges'],
    ['Clubs & Activities', '20+', 'All 11 clubs, activities, events, membership, committees'],
    ['Administration', '15+', 'Director, governing body, proctorial body, exam controller, committees'],
    ['Health & Safety', '15+', 'Healthcare, ragging, anti-ragging policy, emergency contacts, counseling'],
    ['Exam System', '10+', 'Exam controller, exam committee, mark distribution, question quality, grading'],
    ['General Knowledge', '20+', 'Philosophy, weather, time, love, advice, exam tips, campus culture'],
    ['International', '10+', 'Wuhan Textile University, Bolton University, Germany collaborations, CSC scholarships'],
    ['Financial', '8+', 'Scholarships, tuition fees, installment plans, freedom fighter quota']
  ]
));

children.push(heading('4.2.2 Language Support', H3));
children.push(p('NITER AI supports two languages:'));

children.push(pb('English (Primary)'));
children.push(bullet('Full knowledge base coverage with 258+ entries'));
children.push(bullet('Natural language understanding with spell correction'));
children.push(bullet('Internet slang expansion (brb, lol, tbh, ngl, fr, istg)'));
children.push(bullet('Domain vocabulary of 200+ words'));

children.push(pb('Bangla / বাংলা (বাংলা)'));
children.push(bullet('100+ Bangla-English translations covering greetings, NITER terms, campus facilities'));
children.push(bullet('Automatic detection via Unicode range (U+0980-U+09FF)'));
children.push(bullet('Bangla topics added to 23+ KB entries'));
children.push(bullet('Sorted replacement (longest first) to prevent partial word matches'));

children.push(pb('Bangla Examples:'));
children.push(bullet('"ভর্তি কিভাবে" → "How to get admitted" → Admission information'));
children.push(bullet('"নমস্কার" → "Namaskar" → Greeting response'));
children.push(bullet('"হোস্টেল" → "Hostel" → Hostel information'));
children.push(bullet('"পরীক্ষা" → "Exam" → Exam system details'));
children.push(bullet('"ক্লাব" → "Club" → Club directory'));

children.push(heading('4.2.3 Conversational Engine v4.0', H3));
children.push(p('Inspired by Grok AI, the conversational engine provides natural, engaging interactions:'));

children.push(makeTable(
  ['Feature', 'Description'],
  [
    ['Context Memory', 'Tracks last 30 messages, remembers topics discussed across sessions via localStorage'],
    ['Emotional Intelligence', 'Detects 10 emotions (happy, sad, angry, anxious, excited, confused, bored, urgent, curious, grateful) with emoji prefixes'],
    ['Personality System', 'Witty catchphrases every 5 turns, rapport building (0-100 score), random campus-themed humor'],
    ['Humor System', 'Textile-themed puns, campus jokes, general humor with topic variety'],
    ['Topic Transitions', 'Suggests related topics after answering (e.g., "admission" → "fees, departments, hostels")'],
    ['Follow-up Detection', 'Understands "more", "also", "what about" as continuation requests'],
    ['User Learning', 'Detects your name, department, year, and interests from conversation'],
    ['Slang Expansion', 'Expands internet slang: brb, lol, tbh, ngl, fr, istg, imo, smh, fwiw, etc.'],
    ['General Knowledge', 'Answers for philosophy, weather, time, love, advice — not just NITER topics'],
    ['Analytics', 'Tracks conversation stats (turns, topics, rapport, mood)']
  ]
));

children.push(heading('4.2.4 Islamic Greeting Support', H3));
children.push(p('When someone says "Assalamualaikum" (or variations), the AI responds with "Wa Alaikumus Salam":'));
children.push(makeTable(
  ['Input', 'Response'],
  [
    ['Assalamualaikum', '"Wa Alaikumus Salam! 🙏 May your day be blessed..."'],
    ['assalamu alaikum', '"Alaikumus Salam! 🙏 Welcome! I\'m NITER AI..."'],
    ['salam', '"Wa Alaikumus Salam! 🙏 ✨ Peace be upon you too..."'],
    ['aoa', '"Wa Alaikumus Salam! 🙏 May your day be blessed..."']
  ]
));

children.push(heading('4.2.5 Hermes AI Agent', H3));
children.push(p('Hermes AI is an advanced AI agent integrated into NITER AI for self-learning and task automation:'));
children.push(bullet('Multi-step reasoning for complex queries'));
children.push(bullet('Task automation and data analysis capabilities'));
children.push(bullet('Context-aware responses with conversation memory'));
children.push(bullet('Proactive suggestions based on user interests'));

children.push(heading('4.2.6 Spell Correction & Intent Classification', H3));
children.push(p('The AI engine includes a robust spell correction system:'));
children.push(bullet('Domain vocabulary of 200+ NITER-specific words'));
children.push(bullet('Levenshtein distance algorithm for fuzzy matching'));
children.push(bullet('Special regex patterns for admission, quiz, and other intents'));
children.push(bullet('Intent classification: greeting, emotion, math, general knowledge, KB query'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

children.push(heading('4.3 Member Portal', H2));
children.push(p('Signed-in executives and admins manage their club from the portal dashboard:'));
children.push(makeTable(
  ['Tab', 'Capabilities'],
  [
    ['Notices', 'Post, edit, pin and delete notices; optionally link a notice to a form.'],
    ['Forms', 'Build forms with a visual field builder, edit scheduling, view per-form analytics.'],
    ['Submissions', 'Review, search and export submissions; view per-form analysis.'],
    ['Memberships', 'Review club join requests and approve or decline them.'],
    ['Events', 'Post club events with date, venue and capacity.'],
    ['Ads', 'Publish image/video ads for events.'],
    ['Complaints', 'Review complaints, reply and update status.'],
    ['Settings', 'Edit committee & photos, manage members & roles, export/import backups.']
  ]
));

children.push(heading('4.4 Authentication & Roles', H2));
children.push(p('Authentication is email/password via Firebase Auth. During signup, users choose an account type:'));
children.push(makeTable(
  ['Role', 'Access', 'Approval'],
  [
    ['Visitor', 'Browse all public content; fill forms; file complaints.', '—'],
    ['Member', 'Public access plus the ability to track their own submissions.', 'Instant'],
    ['Moderator', 'Helps manage a club (after admin approval).', 'Requires admin approval'],
    ['Executive', 'Manage the clubs they are assigned to.', 'Admin promotes'],
    ['IT Staff', 'Admin-granted role that unlocks the campus IT helpdesk.', 'Admin promotes'],
    ['Club Admin', 'Manages a single club — approves moderators, reviews memberships.', 'Instant (one per club)'],
    ['Global Admin', 'Everything, plus role management.', 'First account']
  ]
));

children.push(heading('4.5 Form Engine', H2));
children.push(p('Executives build forms from typed fields. Supported field types:'));
children.push(makeTable(
  ['Field type', 'Behaviour'],
  [
    ['Text / Email / Phone / Number / Date / URL', 'Validated input; phone validates Bangladeshi 11-digit format.'],
    ['Textarea', 'Multi-line answer.'],
    ['Select', 'Dropdown with predefined options.'],
    ['Radio', 'Single choice from options.'],
    ['Photo', 'Camera/gallery picker; images compressed client-side (max 480px, JPEG).'],
    ['Payment', 'Payment-method dropdown (bKash, Nagad, Rocket, Bank transfer) with TrxID validation.']
  ]
));

children.push(heading('4.6 Realtime & Live Feedback', H2));
children.push(bullet('Live clock and per-form countdowns on the home page and club pages'));
children.push(bullet('Live stat chips — clubs, forms open now, notices this week, total submissions'));
children.push(bullet('Realtime activity feed of recent submissions across all clubs'));
children.push(bullet('Emoji reactions on notices (👍 ❤️ 🎉 …), persisted and synchronised'));

children.push(heading('4.7 Club Ads (moderator-published)', H2));
children.push(p('Every club moderator can publish image or video ads for events. A published ad appears in the sponsored carousel on the homepage, rotating every six seconds with dots and prev/next controls.'));

children.push(heading('4.8 Club Events', H2));
children.push(p('Clubs post events (title, description, start/end time, venue, capacity) from the portal. Events appear on the club page, the homepage and each member\'s dashboard.'));

children.push(heading('4.9 Memberships & Committee Management', H2));
children.push(bullet('Membership forms — when a student submits a form whose title contains "membership", the system automatically creates a membership request'));
children.push(bullet('Approval workflow — both the club admin and club moderators can approve or reject membership requests'));
children.push(bullet('Notifications — every membership form submission triggers an email to all club admins and moderators'));
children.push(bullet('Club admin panel — global admins can reassign or remove a club\'s admin'));
children.push(bullet('Committee editor — the Settings tab lets a club\'s moderator edit the executive committee'));
children.push(bullet('Student dashboard — signed-in students get a personal dashboard tracking their memberships'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 5. NITER CAMPUS INFORMATION ===
children.push(heading('5. NITER Campus Information (In NITER AI)', H1));

children.push(heading('5.1 About NITER', H2));
children.push(p('The National Institute of Textile Engineering and Research (NITER) is a public university-level institute in Dhaka, Bangladesh. Established in 2015, it offers B.Sc. in Textile Engineering and MBA programs under the University of Dhaka. Located in Savar, Dhaka, the campus is affiliated with the Bangladesh Textile Mills Association (BTMA).'));

children.push(heading('5.2 Departments', H2));
children.push(makeTable(
  ['Department', 'Full Name', 'Seats', 'Focus'],
  [
    ['TE', 'Textile Engineering', '60', 'Core textile manufacturing, spinning, weaving, wet processing'],
    ['CSE', 'Computer Science and Engineering', '30', 'Software development, AI, data science, networking'],
    ['EEE', 'Electrical and Electronic Engineering', '30', 'Power systems, electronics, automation, embedded systems'],
    ['IPE', 'Industrial and Production Engineering', '30', 'Industrial management, quality control, supply chain'],
    ['FDAE', 'Fashion Design and Apparel Engineering', '30', 'Fashion design, apparel manufacturing, merchandising']
  ]
));

children.push(heading('5.3 Admission & Fees', H2));
children.push(bullet('SSC + HSC GPA requirement: 3.50 minimum'));
children.push(bullet('Admission test: 200-mark MCQ exam through DU Technology Unit'));
children.push(bullet('Total tuition: ৳464,000 across 16 installments of ৳29,000 each'));
children.push(bullet('Freedom fighter quota available'));
children.push(bullet('Merit-based scholarships up to 100% tuition waiver'));

children.push(heading('5.4 Examination System', H2));
children.push(p('NITER follows the Level-Term system with four types of assessments:'));
children.push(makeTable(
  ['Assessment', 'Weight', 'Description'],
  [
    ['Class Test (CT)', '10%', '2-3 tests per semester, 20-30 marks each'],
    ['Sessional/Assignment', '30%', 'Lab reports, presentations, group projects, class performance'],
    ['Final Exam', '50%', 'End-of-semester written exam, 3 hours, 100 marks'],
    ['Viva/Oral', '10%', 'Practical demonstrations, oral examinations']
  ]
));
children.push(p('Pass mark: 40% minimum in each component. CGPA 2.00 required to graduate. 75% attendance mandatory.'));

children.push(heading('5.5 Leadership', H2));
children.push(bullet('Director: Dr. Md. Abul Kalam (since October 2024)'));
children.push(bullet('Affiliated with: University of Dhaka'));
children.push(bullet('Partnership: Bangladesh Textile Mills Association (BTMA)'));

children.push(heading('5.6 Proctorial Body', H2));
children.push(p('The Proctorial Body at NITER is responsible for maintaining discipline, student welfare, and campus safety. Key functions include:'));
children.push(bullet('Enforcing the institute\'s code of conduct and disciplinary rules'));
children.push(bullet('Handling student complaints and grievances'));
children.push(bullet('Managing anti-ragging initiatives and enforcement'));
children.push(bullet('Overseeing hostel discipline and student accommodation'));
children.push(bullet('Coordinating with law enforcement for campus security'));
children.push(bullet('Organizing student orientation and welfare programs'));

children.push(heading('5.7 Anti-Ragging Policy', H2));
children.push(p('NITER has a zero-tolerance policy against ragging, aligned with the Bangladesh Anti-Bullying and Anti-Ragging Policy 2023 (declared law by the High Court in 2025).'));

children.push(pb('Types of Ragging:'));
children.push(bullet('Physical — hitting, forced activities, intimidation'));
children.push(bullet('Verbal — insults, abusive language, threatening'));
children.push(bullet('Psychological — mental harassment, isolation, fear'));
children.push(bullet('Cyber — online harassment, rumors, threats'));
children.push(bullet('Sexual — harassment, molestation, gender-based abuse'));

children.push(pb('Punishments:'));
children.push(bullet('Minor: Warning, counseling, fine up to BDT 5,000'));
children.push(bullet('Moderate: Suspension 1-3 months, fine up to BDT 10,000'));
children.push(bullet('Serious: Suspension 6-12 months, hostel expulsion'));
children.push(bullet('Severe: Permanent expulsion, criminal charges'));

children.push(pb('Reporting Channels:'));
children.push(bullet("Proctor's office: proctor@niter.edu.bd"));
children.push(bullet('Anti-Ragging Hotline: 333'));
children.push(bullet("Women's Helpline: 01779-554391"));
children.push(bullet('Emergency: 999'));

children.push(heading('5.8 Healthcare Facilities', H2));
children.push(p('NITER provides healthcare services through the Medical Center:'));
children.push(bullet('Medical Center with resident doctor and nursing staff'));
children.push(bullet('First-aid services available during campus hours'));
children.push(bullet('Emergency ambulance service (call 999)'));
children.push(bullet('Free basic health checkups for students'));
children.push(bullet('Referral system to nearby hospitals (ABM Hospital, Savar)'));
children.push(bullet('Mental health counseling services'));
children.push(bullet('Health awareness campaigns and workshops'));

children.push(heading('5.9 Campus Facilities', H2));
children.push(makeTable(
  ['Facility', 'Details'],
  [
    ['Location', 'Savar, Dhaka — near Nayarhat, Kohinoor Gate'],
    ['WiFi', 'Campus-wide internet access for students and faculty'],
    ['Canteen', 'Campus canteen, hostel dining, nearby food options'],
    ['Transport', 'Bus service, public transport, ride-sharing (Pathao, Uber)'],
    ['Labs', 'CSE: 38 computers; Textile: spinning, weaving machinery; EEE: electronics equipment'],
    ['Library', 'Academic library with digital resources'],
    ['Sports', 'Football field, cricket ground, badminton court']
  ]
));

children.push(heading('5.10 International Collaborations', H2));
children.push(makeTable(
  ['University', 'Country', 'Programs'],
  [
    ['Wuhan Textile University', 'China', 'Student exchange, research collaboration'],
    ['University of Bolton', 'UK', 'Joint programs, faculty exchange'],
    ['German universities', 'Germany', 'CSC scholarships, research partnerships']
  ]
));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 6. TECHNOLOGY STACK ===
children.push(heading('6. Technology Stack', H1));

children.push(heading('6.1 Shared Backend', H2));
children.push(makeTable(
  ['Service', 'Technology', 'Purpose'],
  [
    ['Database', 'Firebase Firestore', 'Structured, realtime-synchronised data.'],
    ['Authentication', 'Firebase Auth (email/password)', 'Accounts and role-based sign-in.'],
    ['File storage', 'Firebase Storage', 'Submission photos and ad media.'],
    ['Security', 'Firestore & Storage security rules', 'Role-based read/write enforcement.'],
    ['Alternative backend', 'Appwrite (kit in appwrite/)', 'Provisioning + seed scripts.']
  ]
));

children.push(heading('6.2 Legacy Static App (index.html)', H2));
children.push(makeTable(
  ['Layer', 'Technology'],
  [
    ['Markup / UI', 'HTML5 + CSS3, single index.html, Poppins font'],
    ['Logic', 'Vanilla JavaScript (no framework), hash-based SPA routing'],
    ['AI Engine', 'NITER AI v4.0 — 258+ KB entries, Grok-style conversation, Bangla support'],
    ['Persistence', 'localStorage + Firestore sync'],
    ['Build', 'None — the file runs as-is']
  ]
));

children.push(heading('6.3 NITER AI Technology', H2));
children.push(makeTable(
  ['Component', 'Technology', 'Description'],
  [
    ['Knowledge Base', '258+ JSON entries', '30+ topic categories with keyword matching'],
    ['Spell Correction', 'Levenshtein distance', 'Domain vocabulary of 200+ words'],
    ['Bangla Support', 'Unicode detection + mapping', '100+ Bangla-English translations'],
    ['Intent Classification', 'Regex + keyword scoring', 'Classifies greeting, emotion, math, KB query'],
    ['Emotion Detection', 'Pattern matching', '10 emotions with emoji prefixes'],
    ['Context Memory', 'localStorage', '30-message history, topic tracking'],
    ['Personality', 'Random selection', 'Catchphrases, rapport building, humor'],
    ['Response Engine', 'Multi-layer pipeline', 'Spelling → Intent → KB match → Response']
  ]
));

children.push(heading('6.4 Next.js Frontend (web/)', H2));
children.push(makeTable(
  ['Layer', 'Technology'],
  [
    ['Framework', 'Next.js 15 (App Router), React 19'],
    ['Language', 'TypeScript 5 (strict mode)'],
    ['Styling', 'Tailwind CSS v4 with NITER brand tokens'],
    ['Firebase', 'Modular Firebase SDK v12'],
    ['State', 'Custom client store with useSyncExternalStore'],
    ['API routes', '/api/students, /api/submissions, /api/users, notification endpoints'],
    ['Tooling', 'ESLint 9, Prettier 3, tsc --noEmit typecheck']
  ]
));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 7. DATA MODEL ===
children.push(heading('7. Data Model', H1));

children.push(heading('7.1 Firestore Collections', H2));
children.push(makeTable(
  ['Collection', 'Document', 'Who reads', 'Who writes'],
  [
    ['clubs', 'One doc per club', 'Everyone', 'Admins; executives'],
    ['notices', 'One doc per notice', 'Everyone', 'Admins / executives'],
    ['forms', 'One doc per form', 'Everyone', 'Admins / executives'],
    ['submissions', 'One doc per application', 'Club staff', 'Anyone'],
    ['complaints', 'One doc per complaint', 'Club staff', 'Anyone'],
    ['memberships', 'One doc per join request', 'Self / club staff', 'Anyone'],
    ['events', 'One doc per club event', 'Everyone', 'Admins / executives'],
    ['ads', 'One doc per ad', 'Everyone', 'Admins / executives'],
    ['users/{uid}', 'Profile + role + clubs[]', 'Self / staff', 'Self, admins'],
    ['moderatorRequests', 'One doc per request', 'Club admins', 'System'],
    ['config/site', 'Institute name + semester', 'Everyone', 'Admins'],
    ['meta/bootstrap', 'First-admin marker', 'Everyone', 'Created once']
  ]
));

children.push(heading('7.2 NITER AI Data (localStorage)', H2));
children.push(makeTable(
  ['Key', 'Content', 'Size'],
  [
    ['niter-ai-chat-history', 'Conversation messages (max 30)', '~10KB'],
    ['niter-ai-user-profile', 'Detected name, department, year, interests', '~1KB'],
    ['niter-ai-conversation-stats', 'Turns, topics, rapport, mood', '~500B'],
    ['niter-theme', 'Light/dark theme preference', '~50B']
  ]
));

children.push(heading('7.3 Key Entities & Statuses', H2));
children.push(bullet('Roles — admin, executive, moderator, it-staff, member'));
children.push(bullet('ModeratorRequest — pending/approved/rejected'));
children.push(bullet('Form status — soon, open, closed'));
children.push(bullet('Complaint status — open, in-progress, resolved'));
children.push(bullet('Membership status — pending, approved, rejected'));
children.push(bullet('Ad status — active / paused'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 8. SETUP & INSTALLATION ===
children.push(heading('8. Setup & Installation', H1));

children.push(heading('8.1 Prerequisites', H2));
children.push(bullet('Node.js 18+ (LTS 20+ recommended) for the Next.js app and provisioning scripts'));
children.push(bullet('A Firebase project (or an Appwrite instance) for the cloud backend'));
children.push(bullet('A modern browser — no build step needed for the legacy app'));

children.push(heading('8.2 Running the Legacy Static App', H2));
children.push(p('Open index.html directly in a browser, or serve the project root with any static file server. Without Firebase configuration the site runs in offline demo mode with full NITER AI functionality.'));

children.push(heading('8.3 Running the Next.js App', H2));
children.push(p('cd web && npm install && npm run dev  # http://localhost:3000'));

children.push(heading('8.4 Firebase Configuration', H2));
children.push(bullet('Console → create/enable the niter-club-website project'));
children.push(bullet('Register a web app and paste the config snippet into the FB_CONFIG block in index.html'));
children.push(bullet('Deploy the security rules: cd firebase && firebase deploy --only firestore:rules,storage'));

children.push(heading('8.5 Demo Mode', H2));
children.push(p('With no Firebase config, the member portal uses the demo member code niter2025 and stores everything locally — ideal for evaluation and development. NITER AI works fully offline.'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 9. DEPLOYMENT ===
children.push(heading('9. Deployment', H1));

children.push(heading('9.1 Firebase Hosting', H2));
children.push(p('cd firebase && firebase deploy --only hosting'));

children.push(heading('9.2 Next.js App', H2));
children.push(p('cd web && npm run build && npm start'));

children.push(heading('9.3 Continuous Integration', H2));
children.push(p('GitHub Actions (.github/workflows/ci.yml) runs typecheck, lint, format check and a production build on every push.'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 10. SECURITY MODEL ===
children.push(heading('10. Security Model', H1));

children.push(heading('10.1 Firestore Rules', H2));
children.push(bullet('Public collections readable by anyone but writable only by club admins/executives'));
children.push(bullet('Restricted collections readable only by club staff and scoped by club'));
children.push(bullet('The meta/bootstrap marker ensures the first admin account is created exactly once'));

children.push(heading('10.2 NITER AI Security', H2));
children.push(bullet('All AI processing is client-side — no data sent to external servers'));
children.push(bullet('Knowledge base is embedded in the HTML file'));
children.push(bullet('Conversation history stored in localStorage only'));
children.push(bullet('No personal data collection by the AI engine'));

children.push(heading('10.3 Data Privacy', H2));
children.push(p('Student personal data is never exposed publicly. Only the club\'s staff can read submissions and complaints for their club. NITER AI stores no personal data beyond what the user explicitly shares in conversation.'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 11. PROJECT STRUCTURE ===
children.push(heading('11. Project Structure', H1));
children.push(p('NITER-CLUB-WEBSITE/'));
children.push(bullet('index.html — Legacy static SPA with NITER AI (23,227 lines)'));
children.push(bullet('css/styles.css — Legacy stylesheet'));
children.push(bullet('campus/ — Campus photography'));
children.push(bullet('committee/ — Committee portrait photos'));
children.push(bullet('document/ — PRD, TRD, user flow, application flow, design system'));
children.push(bullet('plan/ — Implementation plan & working notes'));
children.push(bullet('firebase/ — Firestore rules, storage rules, hosting config'));
children.push(bullet('appwrite/ — Alternative backend: setup + seed scripts + MCP configs'));
children.push(bullet('web/ — Next.js 15 rewrite (recommended for new work)'));
children.push(bullet('.github/workflows/ci.yml — CI pipeline'));
children.push(bullet('scripts/ — Build and utility scripts'));
children.push(bullet('documentation.docx — This document'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 12. QUALITY & MAINTENANCE ===
children.push(heading('12. Quality & Maintenance', H1));

children.push(heading('12.1 Quality Gates', H2));
children.push(makeTable(
  ['Check', 'Command', 'Purpose'],
  [
    ['Typecheck', 'npm run typecheck', 'TypeScript strict-mode validation'],
    ['Lint', 'npm run lint', 'ESLint 9 static analysis'],
    ['Format', 'npm run format:check', 'Prettier style consistency'],
    ['Build', 'npm run build', 'Production build verification']
  ]
));

children.push(heading('12.2 Maintenance Practices', H2));
children.push(bullet('The codebase is deliberately small and self-documenting'));
children.push(bullet('Seed data dates are rebased to today at runtime'));
children.push(bullet('NITER AI knowledge base can be expanded by adding entries to the NAI_KB array'));
children.push(bullet('Data can be backed up from the portal (Settings → Data → Export backup)'));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === 13. ROADMAP ===
children.push(heading('13. Roadmap & Future Work', H1));
children.push(makeTable(
  ['Area', 'Planned improvement'],
  [
    ['NITER AI', 'Voice input/output, image recognition, AR campus guide'],
    ['Bangla', 'Full Bangla UI, Bangla response generation, voice in Bangla'],
    ['Conversations', 'Multi-user chat rooms, AI group discussions'],
    ['Payments', 'Direct bKash / Nagad / SSLCommerz integration'],
    ['Certificates', 'Automated certificate generation for events'],
    ['Community', 'Per-club discussion/chat and richer member profiles'],
    ['Analytics', 'Deeper analytics — per-form conversion, club engagement'],
    ['Mobile', 'PWA installability polish and push notifications'],
    ['Accessibility', 'WCAG AA audit and keyboard-navigation pass']
  ]
));

children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], pageBreakBefore: true }));

// === APPENDIX A ===
children.push(heading('Appendix A — Reference', H1));
children.push(makeTable(
  ['Item', 'Value'],
  [
    ['Repository', 'https://github.com/ashrafularefin78-prog/NITER-CLUB-WEBSITE'],
    ['Firebase project', 'niter-club-website'],
    ['Demo member code', 'niter2025 (offline demo mode)'],
    ['Local storage key', 'niter-clubs-db-v8'],
    ['NITER AI KB size', '258+ entries across 30+ topics'],
    ['Bangla translations', '100+ word/phrase mappings'],
    ['Emotion detection', '10 emotions supported'],
    ['Conversation memory', '30-message history in localStorage'],
    ['Live demo', 'https://ashrafularefin78-prog.github.io/NITER-CLUB-WEBSITE/']
  ]
));

// === APPENDIX B ===
children.push(heading('Appendix B — Glossary', H1));
children.push(makeTable(
  ['Term', 'Definition'],
  [
    ['BaaS', 'Backend-as-a-Service — prebuilt cloud services instead of a self-managed server'],
    ['Firestore', "Firebase's realtime NoSQL document database"],
    ['onSnapshot', 'Firestore subscription API that pushes document changes in real time'],
    ['SPA', 'Single-Page Application — one HTML page that swaps views in the browser'],
    ['PWA', 'Progressive Web App — an installable web application'],
    ['TrxID', 'Transaction ID — the reference number of a mobile-banking or bank transfer'],
    ['MCP', 'Model Context Protocol — a standard for AI assistants to operate tools'],
    ['NITER AI', 'The intelligent conversational assistant built into the portal'],
    ['NAI_KB', 'NITER AI Knowledge Base — 258+ JSON entries powering AI responses'],
    ['CGPA', 'Cumulative Grade Point Average — the standard academic performance metric'],
    ['RMG', 'Ready-Made Garment — Bangladesh\'s largest export industry'],
    ['CT', 'Class Test — a short in-semester assessment'],
    ['Level-Term', "NITER's academic system (e.g., Level-4, Term-1)"]
  ]
));

// Build document
const doc = new Document({
  title: 'NITER Clubs Portal — Project Documentation v5.0',
  description: 'Complete project documentation covering architecture, features, NITER AI, data model, setup and deployment.',
  author: 'NITER Clubs Portal team',
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: 'NITER Clubs Portal — Documentation v5.0', font: 'Calibri', size: 18, color: '999999', italics: true })],
          alignment: AlignmentType.RIGHT
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Page ', font: 'Calibri', size: 18 }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 18 }), new TextRun({ text: ' of ', font: 'Calibri', size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 18 })],
          alignment: AlignmentType.CENTER
        })]
      })
    },
    children
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('documentation.docx', buffer);
console.log('documentation.docx generated successfully! (' + buffer.length + ' bytes)');
