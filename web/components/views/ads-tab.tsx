"use client";

import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Ad } from "@/lib/types";
import { mutate, useDb } from "@/lib/store";
import { adScheduleState, clubForms, clubAds, fmtCount, fmtDate, fmtDateTime } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { getCloudStorage } from "@/lib/firebase";
import { useToast } from "@/components/providers";
import { EmptyState } from "@/components/ui";

/**
 * Portal "📣 Ads" tab — lets a club's moderator publish image/video ads that
 * appear in the sponsored carousel on the homepage. Media is uploaded to
 * Firebase Storage when available (keeping Firestore docs small); offline
 * demo mode falls back to an inline data URL, exactly like the legacy site.
 */
export function AdsTab({ clubId }: { clubId: string }) {
  const [editing, setEditing] = useState<Ad | "new" | null>(null);

  if (editing !== null) {
    return (
      <AdForm clubId={clubId} initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
    );
  }

  return <AdList clubId={clubId} onEdit={setEditing} />;
}

function AdList({ clubId, onEdit }: { clubId: string; onEdit: (a: Ad | "new") => void }) {
  const db = useDb()!;
  const toast = useToast();
  const auth = useAuth();
  const list = clubAds(db, clubId);
  const actor = auth.user?.email || auth.user?.name || "";

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">📣 Ads</h2>
        <button className="btn btn-primary btn-sm" onClick={() => onEdit("new")}>
          + Publish ad
        </button>
      </div>
      <p className="mb-4 text-[13px] text-muted">
        Publish an <b>image or video</b> ad — it appears in the sponsored carousel on the homepage. You can
        schedule a campaign window, and every ad tracks <b>impressions &amp; clicks</b> automatically.
      </p>
      {list.length ? (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
              {a.mediaType === "video" ? (
                <video className="ad-thumb" src={a.media} muted preload="metadata" />
              ) : (
                <img className="ad-thumb" src={a.media} alt="" />
              )}
              <div className="min-w-0 flex-1">
                <b className="text-ink">{a.title}</b>
                <div className="text-[12.5px] text-muted">
                  {a.mediaType === "video" ? "🎬 Video" : "🖼 Image"} · {a.tagline || ""}
                </div>
                <div className="text-[12.5px] text-muted">{linkLabel(a)}</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-ink">
                  👁 <span title={`${a.views || 0} impressions`}>{fmtCount(a.views || 0)}</span> · 👆{" "}
                  <span title={`${a.clicks || 0} clicks`}>{fmtCount(a.clicks || 0)}</span> ·{" "}
                  <span title={`${a.views ? Math.round(((a.clicks || 0) / a.views) * 100) : 0}% click-through rate`}>
                    {ctrOf(a)}% CTR
                  </span>
                </div>
              </div>
              <AdStateChip a={a} />
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const toActive = a.status !== "active";
                    mutate((d) => {
                      const ad = (d.ads ?? []).find((x) => x.id === a.id);
                      if (ad) ad.status = toActive ? "active" : "paused";
                    });
                    logAudit("ad_status", `${toActive ? "Resumed" : "Paused"} ad: ${a.title}`, toActive ? "info" : "warn", "", actor);
                    toast.toast(
                      toActive ? "Ad is live on the homepage now." : "Ad paused — hidden from the homepage.",
                      "ok"
                    );
                  }}
                >
                  {a.status === "active" ? "Pause" : "Resume"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => onEdit(a)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (!confirm(`Delete the ad "${a.title}"?`)) return;
                    mutate((d) => {
                      d.ads = (d.ads ?? []).filter((x) => x.id !== a.id);
                    });
                    logAudit("ad_delete", `Deleted ad: ${a.title}`, "warn", "", actor);
                    toast.toast("Ad deleted.", "ok");
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="📣">
          No ads yet. Publish your first image or video ad — it goes straight onto the homepage carousel.
        </EmptyState>
      )}
    </div>
  );
}

function linkLabel(a: Ad): string {
  if (a.link?.type === "external") return `🔗 ${a.link.value}`;
  if (a.link?.type === "form") return "📝 Linked to a club form";
  return "🏛 Linked to the club page";
}

function ctrOf(a: Ad): number {
  return a.views ? Math.round(((a.clicks || 0) / a.views) * 100) : 0;
}

/** Schedule-aware status chip: Live / Scheduled / Expired / Paused. */
function AdStateChip({ a }: { a: Ad }) {
  const state = adScheduleState(a);
  const chip =
    state === "live"
      ? "bg-ok/10 text-ok"
      : state === "scheduled"
        ? "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300"
        : state === "expired"
          ? "bg-surface-2 text-muted"
          : "bg-warn/10 text-warn";
  const label =
    state === "live"
      ? "● Live"
      : state === "scheduled"
        ? `🕒 From ${fmtDate(a.startsAt)}`
        : state === "expired"
          ? `⌛ Ended ${a.endsAt ? fmtDate(a.endsAt) : ""}`
          : "⏸ Paused";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${chip}`} title={a.endsAt ? `Campaign window: ${fmtDate(a.startsAt)} → ${fmtDate(a.endsAt)}` : "Runs indefinitely"}>
      {label}
    </span>
  );
}

function AdForm({ clubId, initial, onDone }: { clubId: string; initial: Ad | null; onDone: () => void }) {
  const db = useDb()!;
  const toast = useToast();
  const auth = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [media, setMedia] = useState(initial?.media ?? "");
  const [linkType, setLinkType] = useState<Ad["link"]["type"]>(initial?.link?.type ?? "club");
  const [linkValue, setLinkValue] = useState(
    initial?.link?.value ?? (initial?.link?.type === "form" ? "" : clubId)
  );
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? toLocalInput(initial.startsAt) : "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? toLocalInput(initial.endsAt) : "");

  const forms = clubForms(db, clubId);
  const mediaType = mediaTypeOf(media);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const isVideo = /^video\//.test(file.type);
    if (!isVideo && !/^image\//.test(file.type)) {
      toast.toast("Please choose an image or video file.", "err");
      return;
    }
    if (file.size > (isVideo ? 15 : 8) * 1024 * 1024) {
      toast.toast(
        isVideo
          ? "That video is too large — keep it under 15 MB."
          : "That image is too large — pick one under 8 MB.",
        "err"
      );
      return;
    }
    setUploading(true);
    void (async () => {
      try {
        const value = isVideo ? await readAsDataUrl(file) : await downscaleImage(file, 1200, 0.78);
        if (!value) throw new Error("unreadable file");
        const stored = await storeMedia(value, isVideo ? file.type : "image/jpeg", clubId, file.name);
        setMedia(stored ?? value);
        toast.toast(isVideo ? "Video ready." : "Image ready.", "ok");
      } catch {
        toast.toast("Could not read that file — try another one.", "err");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    })();
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return void toast.toast("Give the ad a title.", "err");
    if (!media.trim())
      return void toast.toast("Add an image or video — upload a file or paste a URL.", "err");
    let value = linkValue;
    if (linkType === "form" && !value) {
      toast.toast("Pick a form to link to.", "err");
      return;
    }
    if (linkType === "external" && !(value || "").trim()) {
      toast.toast("Enter the external URL.", "err");
      return;
    }
    if (linkType === "club") value = clubId;

    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      toast.toast("The campaign end must be after its start.", "err");
      return;
    }

    mutate((d) => {
      const next: Ad = {
        id: initial?.id ?? `ad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        clubId,
        title: title.trim(),
        tagline: tagline.trim(),
        media: media.trim(),
        mediaType: mediaTypeOf(media.trim()),
        link: { type: linkType, value },
        status: initial?.status ?? "active",
        createdAt: initial?.createdAt ?? new Date().toISOString(),
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        views: initial?.views ?? 0,
        clicks: initial?.clicks ?? 0,
      };
      if (initial) {
        const i = d.ads.findIndex((x) => x.id === initial.id);
        if (i !== -1) d.ads[i] = next;
        else d.ads.push(next);
      } else {
        d.ads.push(next);
      }
    });
    logAudit(
      initial ? "ad_update" : "ad_publish",
      `${initial ? "Updated" : "Published"} ad: ${title.trim()}`,
      "info",
      startsAt || endsAt ? `window ${fmtDateTime(startsAt)} → ${fmtDateTime(endsAt)}` : "no schedule",
      auth.user?.email || auth.user?.name || ""
    );
    onDone();
    toast.toast(initial ? "Ad updated." : "Ad published! It's live on the homepage carousel now.", "ok");
  };

  const urlValue = media && !media.startsWith("data:") ? media : "";

  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[18px] font-bold text-ink">{initial ? "Edit ad" : "Publish an ad"}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>
          ← Cancel
        </button>
      </div>
      <form className="space-y-4" onSubmit={save}>
        <div>
          <label className="label" htmlFor="ad-title">
            Ad title <span className="text-danger">*</span>
          </label>
          <input
            id="ad-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CodeStorm 2026 — Registration Open"
          />
        </div>
        <div>
          <label className="label" htmlFor="ad-tagline">
            Tagline (optional)
          </label>
          <input
            id="ad-tagline"
            className="input"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="One line that sells the event…"
          />
        </div>
        <div>
          <label className="label">
            Media — image or video <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "⏳ Uploading…" : "📁 Upload image / video"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <span className="text-[13px] text-muted">or paste a URL</span>
            <input
              type="url"
              className="input max-w-xs"
              value={urlValue}
              onChange={(e) => setMedia(e.target.value)}
              placeholder="https://…"
            />
          </div>
          {media ? (
            <div className="mt-3">
              {mediaType === "video" ? (
                <video className="ad-thumb-lg" src={media} muted controls />
              ) : (
                <img className="ad-thumb-lg" src={media} alt="" />
              )}
            </div>
          ) : null}
          <p className="hint mt-1.5">
            Images are resized automatically. Videos must be under 15 MB and play muted on the carousel.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="ad-link-type">
            Where should it link?
          </label>
          <select
            id="ad-link-type"
            className="input"
            value={linkType}
            onChange={(e) => {
              const t = e.target.value as Ad["link"]["type"];
              setLinkType(t);
              if (t === "form") setLinkValue(forms[0]?.id ?? "");
              else if (t === "club") setLinkValue(clubId);
              else setLinkValue("");
            }}
          >
            <option value="club">Club page</option>
            <option value="form">A club form (apply)</option>
            <option value="external">External URL</option>
          </select>
        </div>
        {linkType === "form" && (
          <div>
            <label className="label" htmlFor="ad-link-form">
              Form to link
            </label>
            <select
              id="ad-link-form"
              className="input"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
            >
              {forms.length ? (
                forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))
              ) : (
                <option value="">— No forms yet —</option>
              )}
            </select>
          </div>
        )}
        {linkType === "external" && (
          <div>
            <label className="label" htmlFor="ad-link-ext">
              URL
            </label>
            <input
              id="ad-link-ext"
              type="url"
              className="input"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://…"
            />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ad-starts">
              Campaign starts (optional)
            </label>
            <input
              id="ad-starts"
              type="datetime-local"
              className="input"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <p className="hint mt-1">Leave empty to go live immediately.</p>
          </div>
          <div>
            <label className="label" htmlFor="ad-ends">
              Campaign ends (optional)
            </label>
            <input
              id="ad-ends"
              type="datetime-local"
              className="input"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
            <p className="hint mt-1">The ad auto-hides after this time.</p>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={uploading}>
          {initial ? "Save changes" : "Publish ad"}
        </button>
      </form>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

function mediaTypeOf(media: string): "image" | "video" {
  if (!media) return "image";
  return /^data:video\//.test(media) || /\/video\/|\.mp4$|\.webm$|\.ogv$/i.test(media) ? "video" : "image";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Downscale an image file to a JPEG data URL (max width, quality). */
async function downscaleImage(file: File, maxWidth: number, quality: number): Promise<string | null> {
  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

/**
 * Upload ad media to Firebase Storage when available and return the public
 * URL; returns null (keep the data URL) when offline. A timeout keeps a slow
 * or blocked network from hanging the form.
 */
async function storeMedia(
  dataUrl: string,
  contentType: string,
  clubId: string,
  fileName: string
): Promise<string | null> {
  const storage = getCloudStorage();
  if (!storage) return null;
  const ext = contentType === "image/jpeg" ? "jpg" : fileName.split(".").pop() || "bin";
  const path = `ad-media/${clubId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));
  try {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const upload = uploadBytes(ref(storage, path), blob, { contentType }).then(() =>
      getDownloadURL(ref(storage, path))
    );
    return await Promise.race([upload, timeout]);
  } catch {
    return null;
  }
}
