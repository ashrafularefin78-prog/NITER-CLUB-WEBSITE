/**
 * CORS helper for public write routes.
 *
 * These routes are intentionally open (any origin): the static main site
 * (index.html) mirrors form submissions and student accounts here, and it
 * lives on a different origin than this app. The write is best-effort — the
 * client's local/Firestore save is always primary.
 */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Return a 204 preflight response when the request is an OPTIONS probe. */
export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
