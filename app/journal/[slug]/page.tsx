import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BackStack from "@/components/BackStack";
import { loadJournalEntries, loadJournalPost } from "@/lib/loaders/journal";

/** Same window as the clock, so an edit surfaces on both within the minute. */
export const revalidate = 60;

/**
 * Prerender the slugs that exist at build time; anything added later is still
 * served, rendered on first request and then cached. Returning an empty list
 * (Supabase unreachable during the build) is fine for the same reason.
 */
export async function generateStaticParams() {
  const entries = await loadJournalEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadJournalPost(slug);
  // Bare titles: the root layout's template appends " · Chey Time".
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

/**
 * One Journal post, the deepest level of the stack.
 *
 * `body` is plain text from an admin-editable column, so it renders as text.
 * No markdown pass and no `dangerouslySetInnerHTML`: treating that column as
 * markup would turn the admin into an injection surface for the public site,
 * and nothing about a dispatch needs more than paragraphs.
 */
export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadJournalPost(slug);
  if (!post) notFound();

  return (
    <>
      {/* One level up, never straight home, see components/BackStack.tsx. */}
      <BackStack href="/journal" label="All entries" />

      <article>
        <header className="mb-8">
          {post.dateLabel && (
            <p className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
              {post.dateLabel}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight text-bone-50 md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 font-display text-lg italic leading-snug text-bone-300">
              {post.excerpt}
            </p>
          )}
          <div className="rule mt-8" />
        </header>

        {post.thumbnail && (
          <div className="relative mb-10 aspect-video w-full overflow-hidden border border-bone-100/10">
            <Image
              src={post.thumbnail}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        {post.body.length > 0 ? (
          <div className="space-y-5">
            {post.body.map((paragraph, i) => (
              <p
                key={i}
                className="font-sans text-[15px] leading-[1.75] text-bone-200/90"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="font-display text-lg italic text-bone-400">
            This entry has no body text yet.
          </p>
        )}

        {post.url && (
          <p className="mt-10 border-t border-bone-100/10 pt-6">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-editorial"
            >
              Read the full article ↗
            </a>
          </p>
        )}
      </article>
    </>
  );
}
