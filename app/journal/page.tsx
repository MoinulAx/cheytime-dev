import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import BackStack from "@/components/BackStack";
import { loadJournalEntries } from "@/lib/loaders/journal";
import { loadSectionChrome } from "@/lib/loaders/chrome";

/** Same window as the clock, so an edit surfaces on both within the minute. */
export const revalidate = 60;

// Bare title: the root layout's template appends " · Chey Time".
export const metadata: Metadata = {
  title: "Journal",
  description: "Dispatches from Chey.",
};

/**
 * Journal index, every post, one level down from the clock's panel.
 *
 * The Journal panel on the dial is a preview; this is the full list, and each entry
 * opens its own page. Headings come from `site_sections` like every other
 * section's chrome, so the admin controls the wording here too rather than
 * this route quietly having its own copy.
 */
export default async function JournalIndexPage() {
  const [entries, chrome] = await Promise.all([
    loadJournalEntries(),
    loadSectionChrome(),
  ]);

  const shell = chrome.blog ?? {};
  const title = shell.title ?? "Journal";
  const subtitle = shell.subtitle ?? "Dispatches";

  return (
    <>
      {/* Up to the clock, with the Journal panel reopened. */}
      <BackStack href="/#blog" label="Back to the clock" />

      <header className="mb-10">
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50 md:text-6xl">
          {title}
        </h1>
        <p className="mt-2 font-display text-lg italic text-bone-400">
          {subtitle}
        </p>
        {shell.description && (
          <p className="mt-6 max-w-xl font-sans text-[15px] leading-relaxed text-bone-200/90">
            {shell.description}
          </p>
        )}
        {/* No rule here, the list below is bordered top and bottom, and the
            two together read as a doubled line. */}
      </header>

      {entries.length === 0 ? (
        <div className="border-y border-bone-100/10 py-16 text-center">
          <p className="font-display text-2xl italic text-bone-300">
            Nothing yet.
          </p>
          <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
            {shell.emptyMessage ?? "New dispatches will appear here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-bone-100/10 border-y border-bone-100/10">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/journal/${entry.slug}`}
                className="group flex gap-5 py-7 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
              >
                {entry.thumbnail && (
                  <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden border border-bone-100/10 sm:block">
                    <Image
                      src={entry.thumbnail}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {entry.dateLabel && (
                    <p className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                      {entry.dateLabel}
                    </p>
                  )}
                  <h2 className="mt-1 font-display text-2xl leading-snug text-bone-50 transition-colors group-hover:text-white">
                    {entry.title}
                  </h2>
                  {entry.excerpt && (
                    <p className="mt-2 line-clamp-3 font-sans text-sm leading-relaxed text-bone-300/85">
                      {entry.excerpt}
                    </p>
                  )}
                  <span className="mt-3 inline-block font-sans text-[10px] uppercase tracking-wide2 text-bone-500 transition-colors group-hover:text-bone-100">
                    Read →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
