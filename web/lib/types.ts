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
}

export interface Database {
  version: number;
  clubs: Club[];
  notices: Notice[];
  forms: Form[];
  submissions: Submission[];
  complaints: Complaint[];
  memberships: Membership[];
  events: ClubEvent[];
  students: Student[];
  config: Config;
  __users?: PortalUser[];
}

export type Role = "admin" | "executive" | "it-staff" | "member";

export interface PortalUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  clubs: string[];
  studentId?: string;
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
