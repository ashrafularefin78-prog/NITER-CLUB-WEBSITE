/* ============================================================
   NITER Clubs Portal — domain model
   ============================================================ */

export type FieldType =
  "text" | "email" | "phone" | "textarea" | "select" | "radio" | "payment" | "photo" | "number" | "date";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Executive {
  role: string;
  name: string;
  photo?: string;
}

export interface Club {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  tagline: string;
  /** Personality tags used by the "Which club fits me?" quiz matcher. */
  tags?: string[];
  about: string;
  email: string;
  room: string;
  facebook?: string;
  panel: string;
  executives: Executive[];
  committeeHistory?: { by: string; at: string; summary: string }[];
  weekly: string;
}

export type Reactions = Record<string, number>;

<<<<<<< HEAD
export type NoticeCategory = "general" | "event" | "meeting" | "workshop" | "competition" | "announcement" | "urgent" | "other";

export type NoticePriority = "low" | "normal" | "high" | "urgent";

=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
export interface Notice {
  id: string;
  clubId: string;
  title: string;
  body: string;
  createdAt: string;
  date: string;
  reactions: Reactions;
  pinned?: boolean;
  formId?: string;
<<<<<<< HEAD
  /** Notice category for filtering and display. */
  category?: NoticeCategory;
  /** Priority level — urgent notices get a red badge. */
  priority?: NoticePriority;
  /** Event/meeting date and time (if the notice is about a specific event). */
  eventDate?: string;
  /** Event/meeting end date and time. */
  eventEndDate?: string;
  /** Venue or location for the event/meeting. */
  venue?: string;
  /** Contact person for questions about this notice. */
  contactPerson?: string;
  /** Contact email for questions about this notice. */
  contactEmail?: string;
  /** Contact phone for questions about this notice. */
  contactPhone?: string;
  /** External URL link (registration page, Facebook event, etc). */
  externalUrl?: string;
  /** External URL label (e.g., "Register Now", "Facebook Event"). */
  externalUrlLabel?: string;
  /** Number of views (tracked on page load). */
  viewCount?: number;
  /** Author name (executive who posted). */
  authorName?: string;
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
}

export interface Form {
  id: string;
  clubId: string;
  title: string;
  description: string;
  openAt: string;
  deadline: string;
  fields: FormField[];
}

export type ReviewStatus = "" | "approved" | "rejected";

export interface Submission {
  id: string;
  formId: string;
  clubId?: string;
  data: Record<string, string>;
  submittedAt: string;
  submitterEmail?: string;
  submitterName?: string;
  submitterStudentId?: string;
  userId?: string;
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type ComplaintStatus = "open" | "in-progress" | "resolved";

export interface Complaint {
  id: string;
  clubId: string;
  title: string;
  body: string;
  submittedBy: string;
  contact: string;
  status: ComplaintStatus;
  reply: string;
  createdAt: string;
  resolvedAt: string;
  category?: string;
}

/** A student who RSVP'd to an event (or was checked in as a walk-in). */
export interface EventPerson {
  userId: string;
  name: string;
  email: string;
  studentId?: string;
  at: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  capacity: number;
  createdBy: string;
  createdAt: string;
  /** 6-digit door code attendees quote (or scan) at the entrance. */
  code?: string;
  /** Students who RSVP'd ahead of time. */
  rsvps?: EventPerson[];
  /** Students actually checked in at the door (attendance). */
  checkIns?: EventPerson[];
  /** Students on the waitlist — auto-promoted when a spot opens up. */
  waitlist?: EventPerson[];
}

/** A verifiable participation certificate issued after a check-in. */
export interface Certificate {
  id: string;
  eventId: string;
  clubId: string;
  /** Identity key — usually the attendee's email (lowercase). */
  userId: string;
  name: string;
  email: string;
  studentId?: string;
  eventTitle: string;
  eventDate: string;
  clubName: string;
  issuedAt: string;
}

export type QuestionStatus = "open" | "answered" | "closed";

/** One answer on the student Q&A board. */
export interface QuestionAnswer {
  id: string;
  authorKey: string;
  authorName: string;
  at: string;
  body: string;
  upvotes: number;
  accepted: boolean;
  /** Hidden by a moderator (spam/abuse) — invisible to normal students. */
  hidden?: boolean;
  hiddenAt?: string;
  hiddenBy?: string;
}

/** A question on the NITER student Q&A board (semi-anonymous by choice). */
export interface Question {
  id: string;
  title: string;
  body: string;
  category: string;
  /** Identity key (email) — used only for ownership checks, never displayed. */
  authorKey: string;
  /** Display name — "Anonymous student" when `anonymous` is true. */
  authorName: string;
  anonymous: boolean;
  at: string;
  answers: QuestionAnswer[];
  status: QuestionStatus;
  /** Pinned by a moderator — helpful questions stay visible at the top. */
  pinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
}

/** A moderation warning issued to a Q&A participant (repeat offenders flagged). */
export interface Warning {
  id: string;
  /** Identity key of the warned person (email, lowercase). */
  targetKey: string;
  targetName: string;
  targetEmail: string;
  reason: string;
  note?: string;
  issuedBy: string;
  issuedByEmail?: string;
  at: string;
}

export type AuditSeverity = "info" | "warn" | "alert";

/** One row of the admin audit log — who did what, when. */
export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  label: string;
  severity: AuditSeverity;
  detail?: string;
}

export type AdStatus = "active" | "paused";

export interface AdLink {
  type: "club" | "form" | "external";
  value: string;
}

/** Moderator-published club ad — an image or video shown in the home carousel. */
export interface Ad {
  id: string;
  clubId: string;
  title: string;
  tagline?: string;
  media: string;
  mediaType: "image" | "video";
  link: AdLink;
  status: AdStatus;
  createdAt: string;
  /** Optional campaign window — the ad only runs while now is inside it. */
  startsAt?: string;
  endsAt?: string;
  /** Analytics: impressions (deduped per viewer session) and CTA clicks. */
  views?: number;
  clicks?: number;
}

export type MembershipStatus = "pending" | "approved" | "rejected";

export interface Membership {
  id: string;
  userId: string;
  clubId: string;
  status: MembershipStatus;
  requestedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  userName: string;
  userEmail: string;
  studentId: string;
}

/** Official student directory row — ID format: CS + batch + dept code + roll. */
export interface Student {
  sl: number;
  merit: number;
  id: string;
  name: string;
  department?: string;
  session?: string;
  section?: string;
}

export interface Config {
  institute: string;
  semesters: string[];
  /** Founding year shown in the home stats band. */
  established?: string;
  /** Home hero copy — admin-editable so the site identity stays live. */
  heroTitle?: string;
  heroAccent?: string;
  heroSub?: string;
  /** Optional site-wide announcement strip shown under the header. */
  announcement?: string;
}

<<<<<<< HEAD
export type ModeratorRequestStatus = "pending" | "approved" | "rejected";

/** A request from a student to become a club moderator — needs admin approval. */
export interface ModeratorRequest {
  id: string;
  userId: string;
  clubId: string;
  status: ModeratorRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  userName: string;
  userEmail: string;
  studentId: string;
}

=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
export interface Database {
  version: number;
  clubs: Club[];
  notices: Notice[];
  forms: Form[];
  submissions: Submission[];
  complaints: Complaint[];
  memberships: Membership[];
  events: ClubEvent[];
  ads: Ad[];
  students: Student[];
  certificates: Certificate[];
  auditLog: AuditEvent[];
  questions: Question[];
  warnings: Warning[];
<<<<<<< HEAD
  moderatorRequests: ModeratorRequest[];
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
  config: Config;
  __users?: PortalUser[];
}

<<<<<<< HEAD
export type Role = "admin" | "executive" | "moderator" | "it-staff" | "member";
=======
export type Role = "admin" | "executive" | "it-staff" | "member";
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5

export interface PortalUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  clubs: string[];
  studentId?: string;
<<<<<<< HEAD
  phone?: string;
  classId?: string;
  /** Pending moderator approval status — only set when role is "member" and a moderator request is active. */
  pendingModeratorClubId?: string;
  pendingModeratorRequestedAt?: string;
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
}

export type FormStatusKey = "soon" | "open" | "closed";

export interface FormStatus {
  key: FormStatusKey;
  start: Date | null;
  end: Date | null;
}

export interface Session {
  clubId: string;
}
