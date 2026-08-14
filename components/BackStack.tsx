import Link from "next/link";

/**
 * The back control, pinned top-left on every page below the clock.
 *
 * It pops one level of the stack rather than sending you home:
 *
 *   /journal/[slug]  →  /journal   →  /#blog (the clock, Journal panel open)
 *
 * Always the same control in the same place, so going back never requires
 * finding a different affordance at a different depth. A `<Link>` rather than
 * `router.back()` because the destination has to be the level above, not
 * whatever the browser happened to visit last, arriving from a shared link
 * should still walk up the stack, not out of the site.
 */
export default function BackStack({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-5 mb-8 bg-void/85 px-5 py-4 backdrop-blur-sm md:-mx-8 md:px-8">
      <Link
        href={href}
        className="group inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wide2 text-bone-400 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
      >
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          ←
        </span>
        {label}
      </Link>
    </div>
  );
}
