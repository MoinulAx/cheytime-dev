/**
 * Next signals rendering decisions by throwing: `redirect()`, `notFound()`, and
 * bailing out of static rendering all raise an error carrying a `digest`.
 *
 * Any `catch` that wraps framework calls has to let those through. Swallowing
 * one turns a routing instruction into silence, a redirect that never happens,
 * or a route Next believes it may cache when it must not. Both fail quietly,
 * which is the worst way for them to fail.
 */
export function isFrameworkSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return (
    typeof digest === "string" && /^(NEXT_|DYNAMIC_SERVER_USAGE)/.test(digest)
  );
}
