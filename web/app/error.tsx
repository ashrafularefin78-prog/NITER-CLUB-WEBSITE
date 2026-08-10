"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x py-16 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="mt-3 text-xl font-bold text-ink">Something went wrong</h1>
      <p className="mx-auto max-w-md text-[14px] text-muted">
        An unexpected error occurred while loading this page. Try again — if it keeps happening, check your
        connection.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
