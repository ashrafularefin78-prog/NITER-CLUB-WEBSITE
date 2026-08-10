"use client";

import Link from "next/link";
import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Form, FormField, Submission } from "@/lib/types";
import { clubById, fmtDateTime, statusOf } from "@/lib/utils";
import { mutate, useDb } from "@/lib/store";
import { getCloudStorage } from "@/lib/firebase";
import { useToast } from "@/components/providers";
import { Countdown } from "@/components/countdown";
import { Skeleton } from "@/components/ui";
import { AnimatedCheck } from "@/components/animated-check";
import { uid } from "@/lib/utils";

export default function FormView({ formId }: { formId: string }) {
  const db = useDb();
  const form = db?.forms.find((f) => f.id === formId) ?? null;
  const [done, setDone] = useState<Submission | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [trx, setTrx] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  if (!db) return <FormSkeleton />;
  if (!form)
    return (
      <div className="container-x py-16 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Form not found</h1>
        <p className="text-muted">This form doesn’t exist or was removed.</p>
        <Link href="/" className="btn btn-primary mt-4 no-underline">
          Go home
        </Link>
      </div>
    );

  const club = clubById(db, form.clubId);
  const st = statusOf(form);
  const subsCount = db.submissions.filter((s) => s.formId === form.id).length;

  if (done) return <SuccessPanel form={form} clubName={club?.name ?? "club"} sub={done} />;

  return (
    <div className="container-x py-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="no-underline hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/club/${form.clubId}`} className="no-underline hover:underline">
          {club?.name ?? "Club"}
        </Link>{" "}
        / <span className="text-ink">Form</span>
      </nav>

      <div className="card mx-auto mt-8 max-w-2xl overflow-hidden">
        <div className="border-b border-line p-6">
          <h1 className="display-md m-0 text-ink">{form.title}</h1>
          {form.description && <p className="m-0 mt-2 text-[14px] text-muted">{form.description}</p>}
          <p className="m-0 mt-3 text-[13px] text-muted">
            {st.key === "soon" ? (
              <>Opens {fmtDateTime(form.openAt)}</>
            ) : st.key === "open" ? (
              <>
                ⏳ <Countdown end={form.deadline} /> · Posted by {club?.name}
              </>
            ) : (
              "Closed"
            )}
          </p>
          {st.key === "open" && (
            <p className="m-0 mt-1 text-[13px]">
              <b className="text-gold">{subsCount}</b>{" "}
              <span className="text-muted">
                student{subsCount === 1 ? "" : "s"} have already filled this form
              </span>
            </p>
          )}
        </div>

        {st.key === "closed" ? (
          <div className="p-10 text-center">
            <div className="text-5xl">⛔</div>
            <h2 className="mt-3 text-lg font-bold text-ink">This form is closed</h2>
            <p className="text-muted">The deadline for this form has passed.</p>
          </div>
        ) : st.key === "soon" ? (
          <div className="p-10 text-center">
            <div className="text-5xl">⏳</div>
            <h2 className="mt-3 text-lg font-bold text-ink">Registration opens soon</h2>
            <p className="text-muted">
              This form opens on <b>{fmtDateTime(form.openAt)}</b>.
            </p>
            <div className="mt-2 text-[22px]">
              <Countdown start={form.openAt} />
            </div>
            <p className="mt-3 text-[12.5px] text-muted">
              Refresh when it opens to apply — or keep this page open.
            </p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (submitting) return;
              const sub = buildSubmission(form, values, trx, photo, uploading, toast);
              if (!sub) return;
              // Brief delay so the submitting state + spinner are visible and
              // the success panel animates in cleanly.
              setSubmitting(true);
              window.setTimeout(() => {
                mutate((db) => {
                  db.submissions.push(sub);
                });
                setSubmitting(false);
                setDone(sub);
                toast.toast("Application submitted successfully!", "ok");
              }, 700);
            }}
          >
            <div className="space-y-5 p-6">
              {form.fields.map((field, i) => (
                <div
                  key={field.id}
                  className="anim-fade-up"
                  style={{ animationDelay: `${Math.min(i * 0.045, 0.5)}s` }}
                >
                  <Field
                    field={field}
                    value={values[field.id] ?? ""}
                    trxValue={trx[field.id] ?? ""}
                    photoValue={photo[field.id] ?? ""}
                    uploading={uploading > 0}
                    onChange={(v) => setValues((p) => ({ ...p, [field.id]: v }))}
                    onTrx={(v) => setTrx((p) => ({ ...p, [field.id]: v }))}
                    onPhoto={(v) => {
                      setPhoto((p) => ({ ...p, [field.id]: v }));
                      setUploading((u) => u + 1);
                    }}
                    onPhotoDone={() => setUploading((u) => Math.max(0, u - 1))}
                  />
                </div>
              ))}
            </div>
            <div className="border-t border-line bg-surface-2/50 p-6 text-center">
              <button type="submit" className="btn btn-primary w-full" disabled={uploading > 0 || submitting}>
                {submitting ? (
                  <>
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Submitting…
                  </>
                ) : uploading > 0 ? (
                  "Uploading picture…"
                ) : (
                  "Submit application"
                )}
              </button>
              <p className="m-0 mt-2 text-[12px] text-muted">
                Your information is saved securely and shared only with the club.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- field renderer ---------------- */
function Field({
  field,
  value,
  trxValue,
  photoValue,
  uploading,
  onChange,
  onTrx,
  onPhoto,
  onPhotoDone,
}: {
  field: FormField;
  value: string;
  trxValue: string;
  photoValue: string;
  uploading: boolean;
  onChange: (v: string) => void;
  onTrx: (v: string) => void;
  onPhoto: (v: string) => void;
  onPhotoDone: () => void;
}) {
  const req = field.required ? <span className="text-crimson"> *</span> : null;

  if (field.type === "select" || field.type === "payment") {
    const options = field.options && field.options.length ? field.options : PAYMENT_FALLBACK;
    return (
      <div>
        <label className="label" htmlFor={field.id}>
          {field.label}
          {req}
        </label>
        <select id={field.id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {field.type === "payment" && (
          <>
            <input
              id={`${field.id}-trx`}
              type="text"
              className="input mt-2"
              placeholder="Transaction Number (TrxID), e.g. 9HD4X2KQ5E"
              value={trxValue}
              onChange={(e) => onTrx(e.target.value)}
              autoComplete="off"
            />
            <p className="hint mt-1">
              Required for bKash / Nagad / Rocket / Bank transfer. Leave blank if paying cash at the venue.
            </p>
          </>
        )}
      </div>
    );
  }

  if (field.type === "photo") {
    return (
      <div>
        <label className="label">
          {field.label}
          {req}
        </label>
        {photoValue ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoValue} alt="Selected picture" className="h-14 w-14 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">Picture selected</div>
              <div className="text-[12px] text-muted">
                {uploading ? "Uploading…" : "Stored with your application"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onPhoto("");
                onPhotoDone();
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => document.getElementById(`photo-input-${field.id}`)?.click()}
            >
              📷 Choose picture
            </button>
            <span className="hint">
              {field.placeholder || "JPG or PNG — a small passport-style photo works best"}
            </span>
            <input
              id={`photo-input-${field.id}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const dataUrl = await downscaleImage(file);
                if (!dataUrl) return;
                onPhoto(dataUrl);
                uploadPhoto(dataUrl, onPhoto, onPhotoDone);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset className="border-0 p-0 m-0">
        <legend className="label">
          {field.label}
          {req}
        </legend>
        <div className="flex flex-wrap gap-4">
          {(field.options || []).map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
              <input
                type="radio"
                name={field.id}
                value={o}
                checked={value === o}
                onChange={() => onChange(o)}
                className="h-4 w-4 accent-crimson"
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="label" htmlFor={field.id}>
          {field.label}
          {req}
        </label>
        <textarea
          id={field.id}
          className="textarea"
          placeholder={field.placeholder || ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const inputType = field.type === "phone" ? "tel" : field.type;
  const safeType = ["text", "email", "tel", "number", "date", "url"].includes(inputType) ? inputType : "text";
  return (
    <div>
      <label className="label" htmlFor={field.id}>
        {field.label}
        {req}
      </label>
      <input
        id={field.id}
        type={safeType}
        className="input"
        placeholder={field.placeholder || ""}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.type === "phone" && <p className="hint mt-1">Bangladesh mobile number, e.g. 01712345678</p>}
    </div>
  );
}

/* ---------------- photo helpers ---------------- */
async function downscaleImage(file: File): Promise<string | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, 800 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

/**
 * Upload a submission photo to Firebase Storage. On any failure (including a
 * 15s timeout for slow/blocked networks) the downscaled data URL is kept with
 * the submission instead, so the upload state can never block the form.
 */
function uploadPhoto(dataUrl: string, apply: (v: string) => void, done: () => void) {
  const storage = getCloudStorage();
  if (!storage) {
    done();
    return; // offline mode — keep the data URL
  }
  const path = `submission-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("upload timeout")), 15000));
  const upload = fetch(dataUrl)
    .then((r) => r.blob())
    .then((blob) => uploadBytes(ref(storage, path), blob, { contentType: "image/jpeg" }))
    .then(() => getDownloadURL(ref(storage, path)))
    .then((url) => apply(url));
  Promise.race([upload, timeout])
    .catch(() => {
      /* upload failed or timed out — the data URL is kept with the submission */
    })
    .finally(done);
}

/* ---------------- validation + submit ---------------- */
function buildSubmission(
  form: Form,
  values: Record<string, string>,
  trx: Record<string, string>,
  photo: Record<string, string>,
  uploading: number,
  toast: { toast: (m: string, k?: "" | "ok" | "err") => void }
): Submission | null {
  if (uploading > 0) {
    toast.toast("Please wait — the picture is still uploading.", "err");
    return null;
  }
  const errors: string[] = [];
  const data: Record<string, string> = {};

  for (const field of form.fields) {
    let val = (values[field.id] ?? "").trim();
    if (field.type === "photo") val = photo[field.id] ?? "";
    if (field.required && !val) {
      errors.push(field.label + " is required.");
      continue;
    }
    if (val) {
      if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(val)) {
        errors.push(field.label + " is not a valid email.");
        continue;
      }
      if (field.type === "phone" && !/^01\d{9}$/.test(val)) {
        errors.push(field.label + " must be a valid 11-digit mobile number.");
        continue;
      }
      if (field.type === "number" && isNaN(Number(val))) {
        errors.push(field.label + " must be a number.");
        continue;
      }
    }
    data[field.id] = val;
  }

  for (const field of form.fields) {
    if (field.type !== "payment") continue;
    const payVal = (values[field.id] ?? "").trim();
    const trxVal = (trx[field.id] ?? "").trim();
    if (!payVal) continue;
    if (payVal !== "Cash (at venue)" && payVal !== "Other" && !trxVal) {
      errors.push("Transaction number (TrxID) is required for " + payVal + " payments.");
      continue;
    }
    if (trxVal && !/^[\w.\-]{4,50}$/.test(trxVal)) {
      errors.push("Transaction number (TrxID) looks invalid — please check it and try again.");
      continue;
    }
    if (trxVal) data["trx_" + field.id] = trxVal;
  }

  if (errors.length) {
    toast.toast(errors[0], "err");
    return null;
  }

  return {
    id: uid("s"),
    formId: form.id,
    clubId: form.clubId,
    data,
    submittedAt: new Date().toISOString(),
  };
}

/* ---------------- success panel ---------------- */
function SuccessPanel({ form, clubName, sub }: { form: Form; clubName: string; sub: Submission }) {
  const fname = form.title.replace(/[^\w\- ]+/g, "").trim();
  return (
    <div className="container-x py-14">
      <div className="card mx-auto max-w-xl p-8 text-center anim-pop-in">
        <AnimatedCheck />
        <h1
          className="anim-fade-up display-md mt-4 text-ink"
          style={{ animationDelay: "0.5s" }}
        >
          Submission received!
        </h1>
        <p className="anim-fade-up text-[14px] text-muted" style={{ animationDelay: "0.65s" }}>
          Thank you for filling out <b>{form.title}</b>. The {clubName} team will contact you soon.
        </p>

        <div
          className="anim-fade-up mt-5 rounded-xl border border-line bg-surface-2/50 p-4"
          style={{ animationDelay: "0.8s" }}
        >
          <p className="m-0 text-[13px] font-semibold text-ink">
            Keep a copy for yourself — export your submission:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => exportJson(sub, form, clubName, fname)}>
              ⬇ Save as JSON
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => exportCsv(sub, form, fname)}>
              ⬇ Save as CSV
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => exportPrint(sub, form, clubName)}>
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/club/${form.clubId}`} className="btn btn-outline no-underline">
            Back to {clubName}
          </Link>
          <Link href="/" className="btn btn-primary no-underline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

function exportJson(sub: Submission, form: Form, clubName: string, fname: string) {
  download(
    fname + "-submission.json",
    JSON.stringify(
      { form: form.title, club: clubName, submittedAt: sub.submittedAt, data: sub.data },
      null,
      2
    ),
    "application/json"
  );
}

function exportCsv(sub: Submission, form: Form, fname: string) {
  const headers = form.fields
    .map((fl) => [fl.label, ...(fl.type === "payment" ? ["Transaction No"] : [])])
    .flat();
  const vals = form.fields
    .map((fl) => {
      const v = sub.data[fl.id] || "";
      if (fl.type === "photo" && v) return ["[Photo attached]"];
      const out = [v];
      if (fl.type === "payment") out.push(sub.data["trx_" + fl.id] || "");
      return out;
    })
    .flat();
  const rows = [
    ["Form", "Submitted At", ...headers],
    [form.title, sub.submittedAt, ...vals],
  ];
  const csv = rows
    .map((r) =>
      r
        .map((v) => {
          v = String(v ?? "");
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        })
        .join(",")
    )
    .join("\r\n");
  download(fname + "-submission.csv", csv, "text/csv;charset=utf-8");
}

function exportPrint(sub: Submission, form: Form, clubName: string) {
  const rows = form.fields
    .map((fl) => {
      const v = sub.data[fl.id];
      let display: string;
      if (!v) display = "—";
      else if (fl.type === "photo") display = "[Photo attached — see the club's records for the image]";
      else if (fl.type === "payment" && sub.data["trx_" + fl.id])
        display = `${v} (TrxID: ${sub.data["trx_" + fl.id]})`;
      else display = v;
      return `<tr><td style="border:1px solid #ccc;padding:7px 10px;text-align:left;font-weight:600;background:#f7f7f7;width:34%">${escapeHtml(
        fl.label
      )}</td><td style="border:1px solid #ccc;padding:7px 10px;text-align:left">${escapeHtml(display)}</td></tr>`;
    })
    .join("");
  const html = `<div id="print-sheet"><h1 style="font-size:20px;margin:0 0 4px">${escapeHtml(
    form.title
  )}</h1><p style="margin:0 0 18px;color:#555;font-size:13px">${escapeHtml(clubName)} · Submitted ${escapeHtml(
    fmtDateTime(sub.submittedAt)
  )}</p><table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table><p style="margin-top:20px;font-size:12px;color:#888">Generated by NITER Clubs Portal</p></div>`;
  const existing = document.getElementById("print-sheet");
  existing?.parentNode?.removeChild(existing);
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div);
  setTimeout(() => window.print(), 60);
  setTimeout(() => div.parentNode?.removeChild(div), 2000);
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string;
  });
}

const PAYMENT_FALLBACK = ["bKash", "Nagad", "Rocket", "Bank transfer", "Cash (at venue)", "Other"];

function FormSkeleton() {
  return (
    <div className="container-x py-10">
      <div className="card mx-auto max-w-2xl p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <div className="mt-6 space-y-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
