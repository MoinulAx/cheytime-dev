"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary.
 *
 * The loaders already degrade to static content on any Supabase failure, so
 * reaching this means something got past them, a bad value that only breaks
 * at render. Better to show the brand and a way forward than React's blank
 * production error, and logging the digest here is what makes the server-side
 * stack findable in the hosting logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[chey-time] render failed", error.digest ?? "", error);
  }, [error]);

  return (
    <main className="grid h-dvh w-full place-items-center bg-void px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-3">Chey Time</p>
        <h1 className="font-display text-3xl italic text-bone-50">
          The clock stopped.
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
          Something went wrong loading this page. Try again, and if it keeps
          happening, the details are in the server logs.
        </p>
        <button type="button" onClick={reset} className="btn-editorial mt-6">
          Try again
        </button>
        {error.digest && (
          <p className="mt-6 font-sans text-[10px] uppercase tracking-wide2 text-bone-600">
            Digest {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
