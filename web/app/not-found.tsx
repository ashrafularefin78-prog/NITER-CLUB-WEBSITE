import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-16 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-3 text-2xl font-extrabold text-ink">Page not found</h1>
      <p className="mx-auto max-w-md text-[14px] text-muted">
        The page you are looking for doesn’t exist — it may have moved, or the link may be wrong.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary no-underline">
          Go home
        </Link>
        <Link href="/clubs" className="btn btn-outline no-underline">
          Browse clubs
        </Link>
      </div>
    </div>
  );
}
