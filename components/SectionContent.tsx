"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";
import { startCheckout } from "@/lib/checkout";
import type {
  BlogPost,
  Credit,
  DigitalRelease,
  EventItem,
  GalleryImage,
  GalleryLink,
  MusicVideo,
  PressItem,
  Product,
  Section,
  SectionData,
  SocialLink,
} from "@/types/section";

/* ── shared bits ──────────────────────────────────────────────────────── */

function Stagger({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── GALLERY ──────────────────────────────────────────────────────────── */

export function GalleryBlock({
  description,
  images,
  links,
  limit,
}: {
  description?: string;
  images: GalleryImage[];
  links?: GalleryLink[];
  /** Panel preview count. Omitted on /gallery, which shows everything. */
  limit?: number;
}) {
  const shownImages = limit ? images.slice(0, limit) : images;
  const shownLinks = limit ? [] : links;
  const hiddenCount =
    images.length - shownImages.length + (limit ? (links?.length ?? 0) : 0);
  return (
    <Stagger>
      {description && (
        <Item>
          <p className="measure font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}
      <div className="mt-6 space-y-8">
        {shownImages.map((img, i) => (
          <Item key={`${img.src}-${i}`}>
            <figure>
              <div className="flex items-baseline justify-between pb-2">
                <span className="font-display text-sm italic text-bone-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                  {img.meta}
                </span>
              </div>
              <div className="relative aspect-video w-full overflow-hidden border border-bone-100/10">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 780px, 920px"
                  className="object-cover"
                  style={{ objectPosition: img.position ?? "50% 50%" }}
                />
              </div>
              {img.caption && (
                <figcaption className="mt-2 border-l border-bone-100/20 pl-3 font-sans text-[11px] leading-snug text-bone-300">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          </Item>
        ))}
      </div>

      {/* Off-site entries — appearances that only exist as posts. Grouped
          below the photographs rather than interleaved: they are a different
          kind of object, and threading them through the photo stack breaks
          its rhythm. */}
      {shownLinks && shownLinks.length > 0 && (
        <div className="mt-12">
          <Item>
            <p className="eyebrow border-b border-bone-100/10 pb-2">Elsewhere</p>
          </Item>
          <ul className="mt-4 space-y-8">
            {shownLinks.map((link) => {
              const label = [link.platform, link.kind, link.meta]
                .filter(Boolean)
                .join(" · ");

              // Embeddable entries get the source's own player, as the legacy
              // gallery did. Everything else stays a link card — the only
              // treatment available when there is nothing to embed.
              if (!link.embedUrl) {
                return (
                  <li key={link.url}>
                    <Item>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-baseline gap-3 border border-bone-100/10 px-4 py-3 transition-colors hover:border-bone-100/35 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-sans text-[13px] leading-snug text-bone-100">
                            {link.title}
                          </span>
                          <span className="mt-1 block font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                            {label}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-sans text-[11px] text-bone-500 transition-colors group-hover:text-bone-100"
                        >
                          ↗
                        </span>
                      </a>
                    </Item>
                  </li>
                );
              }

              return (
                <li key={link.url}>
                  <Item>
                    <figure>
                      <div className="flex items-baseline justify-between pb-2">
                        <span className="font-sans text-[13px] leading-snug text-bone-100">
                          {link.title}
                        </span>
                        <span className="shrink-0 pl-3 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                          {label}
                        </span>
                      </div>
                      {/* Instagram's embed renders its own white card, so the
                          container is light on purpose — a dark frame around it
                          reads as a rendering fault rather than a choice. */}
                      <div className="overflow-hidden border border-bone-100/10 bg-white">
                        <iframe
                          src={link.embedUrl}
                          title={link.title}
                          loading="lazy"
                          allow="encrypted-media"
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="block w-full border-0"
                          height={link.kind === "Reel" ? 620 : 500}
                        />
                      </div>
                      <figcaption className="mt-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500 transition-colors hover:text-bone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                        >
                          Open on {link.platform} ↗
                        </a>
                      </figcaption>
                    </figure>
                  </Item>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {hiddenCount > 0 && (
        <Item>
          <Link href="/gallery" className="btn-editorial mt-8">
            See all {images.length + (links?.length ?? 0)}
          </Link>
        </Item>
      )}
    </Stagger>
  );
}

/* ── ABOUT ────────────────────────────────────────────────────────────── */

function AboutBlock({
  bio,
  quote,
  credits,
}: {
  bio: string[];
  quote: string;
  credits: Credit[];
}) {
  return (
    <Stagger>
      {bio.map((p, i) => (
        <Item key={i}>
          <p className="measure mb-5 font-sans text-[15px] leading-relaxed text-bone-200/90">
            {p}
          </p>
        </Item>
      ))}
      <Item>
        <blockquote className="measure my-10 border-l border-bone-100/40 pl-5">
          <p className="font-display text-xl italic leading-snug text-bone-50">
            “{quote}”
          </p>
        </blockquote>
      </Item>
      <Item>
        <p className="eyebrow mb-3">Credits</p>
        <dl className="divide-y divide-bone-100/10 border-y border-bone-100/10">
          {credits.map((c) => (
            <div key={c.role} className="flex justify-between py-3">
              <dt className="font-sans text-xs uppercase tracking-wide2 text-bone-500">
                {c.role}
              </dt>
              <dd className="font-sans text-sm text-bone-100">{c.name}</dd>
            </div>
          ))}
        </dl>
      </Item>
    </Stagger>
  );
}

/* ── MUSIC ────────────────────────────────────────────────────────────── */

function LiteYouTube({ video }: { video: MusicVideo }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden border border-bone-100/10 bg-black">
      {open ? (
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Play ${video.title}`}
          className="group absolute inset-0"
        >
          <Image
            src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 780px, 920px"
            className="object-cover opacity-75 transition-opacity duration-300 group-hover:opacity-100"
          />
          {/* play affordance echoes the clock: a thin ring, nothing frosted */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-bone-50/60 bg-black/50 transition-transform duration-300 group-hover:scale-110">
              <svg width="16" height="18" viewBox="0 0 18 20" aria-hidden="true">
                <path d="M0 0l18 10L0 20z" fill="#f6f3ec" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

export function MusicBlock({
  channelLabel,
  channelUrl,
  videos,
  note,
  limit,
}: {
  channelLabel: string;
  channelUrl: string;
  videos: MusicVideo[];
  note?: string;
  /** Panel preview count. Omitted on /music, which shows everything. */
  limit?: number;
}) {
  const shownVideos = limit ? videos.slice(0, limit) : videos;
  const hiddenCount = videos.length - shownVideos.length;
  return (
    <Stagger>
      <Item>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-editorial"
        >
          Subscribe — {channelLabel}
        </a>
      </Item>
      <div className="mt-7 space-y-8">
        {shownVideos.map((v, i) => (
          <Item key={v.id}>
            <div className="mb-2 flex items-baseline justify-between border-b border-bone-100/10 pb-2">
              <p className="font-sans text-sm text-bone-100">
                <span className="mr-3 font-display italic text-bone-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {v.title}
              </p>
              {v.year && (
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                  {v.year}
                </span>
              )}
            </div>
            <LiteYouTube video={v} />
          </Item>
        ))}
      </div>
      {note && (
        <Item>
          <p className="mt-6 font-display text-sm italic text-bone-400">{note}</p>
        </Item>
      )}
      {hiddenCount > 0 && (
        <Item>
          <Link href="/music" className="btn-editorial mt-8">
            See all {videos.length}
          </Link>
        </Item>
      )}
    </Stagger>
  );
}

/* ── STORE ────────────────────────────────────────────────────────────── */

function StoreBlock({ products, note }: { products: Product[]; note?: string }) {
  // Which product is mid-redirect, and anything Stripe said went wrong.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    const result = await startCheckout([
      { title: product.title, price: product.price, quantity: 1, itemType: "merch" },
    ]);
    // Only reached when checkout failed — success navigates away.
    setBusyId(null);
    setError(result.error);
  };

  return (
    <Stagger>
      <div className="grid grid-cols-1 gap-5 min-[380px]:grid-cols-2">
        {products.map((p, i) => {
          const isBusy = busyId === p.id;
          return (
            <Item key={p.id}>
              <div className="group flex h-full flex-col border border-bone-100/10">
                {/* The photograph when the row has one the loader could keep;
                    otherwise the numbered plate, which is honest about being a
                    stand-in rather than pretending to be the product. */}
                <div className="relative aspect-square overflow-hidden border-b border-bone-100/10 bg-void-800">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 45vw, 210px"
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <span className="absolute inset-0 grid place-items-center font-display text-5xl italic text-bone-100/15">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="absolute left-0 top-0 border-b border-r border-bone-100/10 bg-void px-2 py-1 font-sans text-[9px] uppercase tracking-wide2 text-bone-500">
                        Preview
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-sans text-[13px] leading-tight text-bone-100">
                    {p.title}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                    {p.material}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                    <span className="font-display text-lg italic text-bone-50">
                      ${p.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => buy(p)}
                      disabled={busyId !== null}
                      className="border border-bone-100/25 px-3 py-1.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-200 transition-colors hover:border-bone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100 disabled:opacity-40"
                    >
                      {isBusy ? "Opening…" : "Buy"}
                    </button>
                  </div>
                </div>
              </div>
            </Item>
          );
        })}
      </div>
      {note && (
        <Item>
          <p className="mt-6 font-display text-sm italic text-bone-400">{note}</p>
        </Item>
      )}
      {error && (
        <Item>
          <p className="mt-6 font-sans text-[11px] text-cosmic-400">{error}</p>
        </Item>
      )}
    </Stagger>
  );
}

/* ── EVENTS ───────────────────────────────────────────────────────────── */

function EventsBlock({
  events,
  emptyMessage,
}: {
  events: EventItem[];
  emptyMessage: string;
}) {
  if (events.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12 text-center">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
        {/* No "placeholder — no dates confirmed" line here. It was a note to
            ourselves about the seed data and it was rendering to visitors,
            telling them the section is unfinished rather than that there is
            nothing on the calendar yet. `emptyMessage` already says that, and
            it is editable in the admin. */}
      </div>
    );
  }
  return (
    <Stagger>
      <div className="divide-y divide-bone-100/10 border-y border-bone-100/10">
        {events.map((e) => (
          <Item key={e.id}>
            <div className="py-5">
              <p className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                {e.dateLabel} · {e.location}
              </p>
              <h3 className="mt-1 font-display text-lg text-bone-50">{e.title}</h3>
              {e.description && (
                <p className="mt-2 font-sans text-sm text-bone-200/80">
                  {e.description}
                </p>
              )}
              {e.ticketUrl && (
                <a
                  href={e.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial mt-4"
                >
                  Get Tickets
                </a>
              )}
            </div>
          </Item>
        ))}
      </div>
    </Stagger>
  );
}

/* ── BLOG ─────────────────────────────────────────────────────────────── */

function BlogBlock({
  description,
  posts,
  emptyMessage,
}: {
  description?: string;
  posts: BlogPost[];
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12 text-center">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <Stagger>
      {description && (
        <Item>
          <p className="measure font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}
      <div className="mt-6 divide-y divide-bone-100/10 border-y border-bone-100/10">
        {posts.map((post) => {
          // Only a link when the post actually points somewhere — this site
          // has no per-post route, so a bare title must not look clickable.
          const Title = post.url ? "a" : "h3";
          return (
            <Item key={post.id}>
              <article className="py-5">
                {post.dateLabel && (
                  <p className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                    {post.dateLabel}
                  </p>
                )}
                <Title
                  {...(post.url
                    ? {
                        href: post.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className:
                          "mt-1 block font-display text-lg leading-snug text-bone-50 underline decoration-bone-100/20 underline-offset-4 transition-colors hover:decoration-bone-100",
                      }
                    : {
                        className:
                          "mt-1 font-display text-lg leading-snug text-bone-50",
                      })}
                >
                  {post.title}
                </Title>
                {post.excerpt && (
                  <p className="measure mt-2 font-sans text-sm leading-relaxed text-bone-200/80">
                    {post.excerpt}
                  </p>
                )}
              </article>
            </Item>
          );
        })}
      </div>

      {/* Out of the panel and into the stack. The drawer is a preview by
          design — a dispatch is longer than this column can hold without
          becoming a scroll tunnel, so the full text lives at /journal. */}
      <Item>
        <Link href="/journal" className="btn-editorial mt-6">
          See more
        </Link>
      </Item>
    </Stagger>
  );
}

/* ── DIGITAL ──────────────────────────────────────────────────────────── */

function DigitalBlock({
  description,
  releases,
  note,
  emptyMessage,
}: {
  description?: string;
  releases: DigitalRelease[];
  note?: string;
  emptyMessage: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (r: DigitalRelease) => {
    setBusyId(r.id);
    setError(null);
    const result = await startCheckout([
      { title: r.title, price: r.price, quantity: 1, itemType: "music" },
    ]);
    setBusyId(null);
    setError(result.error);
  };

  if (releases.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12 text-center">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <Stagger>
      {description && (
        <Item>
          <p className="measure font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}
      <div className="mt-6 space-y-6">
        {releases.map((r) => (
          <Item key={r.id}>
            <article className="border border-bone-100/10">
              <div className="flex gap-4 p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-bone-100/10 bg-void-800">
                  {r.cover ? (
                    <Image
                      src={r.cover}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-display text-2xl italic text-bone-100/15">
                      ♪
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[13px] leading-tight text-bone-100">
                    {r.title}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                    {r.artist}
                  </p>
                  {r.description && (
                    <p className="mt-2 font-sans text-[13px] leading-relaxed text-bone-200/80">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-display text-lg italic text-bone-50">
                    ${r.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => buy(r)}
                    disabled={busyId !== null}
                    className="border border-bone-100/25 px-3 py-1.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-200 transition-colors hover:border-bone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100 disabled:opacity-40"
                  >
                    {busyId === r.id ? "Opening…" : "Buy"}
                  </button>
                </div>
              </div>
              {r.previewUrl && (
                <div className="border-t border-bone-100/10 px-4 py-3">
                  <p className="eyebrow mb-2">Preview</p>
                  {/* Preview clip only — the full file is never sent to the
                      browser; it is released after purchase. */}
                  <audio
                    controls
                    preload="none"
                    src={r.previewUrl}
                    className="w-full"
                  />
                </div>
              )}
            </article>
          </Item>
        ))}
      </div>
      {note && (
        <Item>
          <p className="mt-6 font-display text-sm italic text-bone-400">{note}</p>
        </Item>
      )}
      {error && (
        <Item>
          <p className="mt-6 font-sans text-[11px] text-cosmic-400">{error}</p>
        </Item>
      )}
    </Stagger>
  );
}

/* ── PRESS ────────────────────────────────────────────────────────────── */

export function PressBlock({
  description,
  features,
  affiliations,
  emptyMessage,
  limit,
}: {
  description?: string;
  features: PressItem[];
  affiliations: string[];
  emptyMessage: string;
  /** Panel preview count. Omitted on /press, which shows everything. */
  limit?: number;
}) {
  const shownFeatures = limit ? features.slice(0, limit) : features;
  const hiddenCount = features.length - shownFeatures.length;
  if (features.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12 text-center">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <Stagger>
      {description && (
        <Item>
          <p className="measure font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}
      <div className="mt-6 divide-y divide-bone-100/10 border-y border-bone-100/10">
        {shownFeatures.map((f) => (
          <Item key={f.id}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block py-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                  {f.outlet}
                </span>
                {f.dateLabel && (
                  <span className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                    {f.dateLabel}
                  </span>
                )}
              </div>
              <h3 className="mt-1 font-display text-lg leading-snug text-bone-50 underline decoration-bone-100/20 underline-offset-4 transition-colors group-hover:decoration-bone-100">
                {f.headline}
              </h3>
            </a>
          </Item>
        ))}
      </div>
      {affiliations.length > 0 && (
        <Item>
          <div className="mt-8">
            <p className="eyebrow mb-3">Also featured on</p>
            <div className="flex flex-wrap gap-2">
              {affiliations.map((a) => (
                <span
                  key={a}
                  className="border border-bone-100/10 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-bone-500"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </Item>
      )}
      {hiddenCount > 0 && (
        <Item>
          <Link href="/press" className="btn-editorial mt-8">
            See all {features.length}
          </Link>
        </Item>
      )}
    </Stagger>
  );
}

/* ── CONTACT / ARCHIVE ────────────────────────────────────────────────── */

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}
const EMPTY: FormState = { name: "", email: "", subject: "", message: "" };

function ContactBlock({
  email,
  blurb,
  sla,
  socials,
}: {
  email: string;
  blurb: string;
  sla: string;
  socials: SocialLink[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<FormState> = {};
    if (!form.name.trim()) next.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Valid email required";
    if (!form.subject.trim()) next.subject = "Required";
    if (!form.message.trim()) next.message = "Required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Lands in `contact_submissions`, which the legacy Admin panel reads.
    // RLS grants anon INSERT only — nothing is readable back from the browser.
    setSending(true);
    setFailed(false);
    const { error } = await createSupabaseClient()
      .from("contact_submissions")
      .insert({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
    setSending(false);
    if (error) {
      console.error("[contact] submission failed", error);
      setFailed(true);
      return;
    }
    setSent(true);
  };

  // text-base below lg keeps iOS Safari from auto-zooming on focus (<16px inputs).
  const field =
    "w-full border-0 border-b border-bone-100/20 bg-transparent px-0 py-2.5 font-sans text-base lg:text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-bone-100";

  return (
    <Stagger>
      <Item>
        <p className="measure font-sans text-sm leading-relaxed text-bone-200/90">{blurb}</p>
        <a
          href={`mailto:${email}`}
          className="mt-2 inline-block font-display text-base italic text-bone-50 underline decoration-bone-100/30 underline-offset-4 hover:decoration-bone-100"
        >
          {email}
        </a>
      </Item>

      <Item>
        {sent ? (
          <div className="mt-6 border-y border-bone-100/20 py-6">
            <p className="eyebrow">Transmission received</p>
            <p className="mt-2 font-display text-xl italic text-bone-50">Thank you.</p>
            <p className="mt-1 font-sans text-sm text-bone-300/80">{sla}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {(["name", "email", "subject"] as const).map((key) => (
              <div key={key}>
                <label htmlFor={key} className="eyebrow mb-1 block">
                  {key}
                </label>
                <input
                  id={key}
                  name={key}
                  type={key === "email" ? "email" : "text"}
                  value={form[key]}
                  onChange={update(key)}
                  className={field}
                  placeholder={`Your ${key}`}
                  autoComplete="off"
                />
                {errors[key] && (
                  <p className="mt-1 font-sans text-[11px] text-cosmic-400">{errors[key]}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="message" className="eyebrow mb-1 block">
                message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={form.message}
                onChange={update("message")}
                className={`${field} resize-none`}
                placeholder="Your message"
              />
              {errors.message && (
                <p className="mt-1 font-sans text-[11px] text-cosmic-400">{errors.message}</p>
              )}
            </div>
            {failed && (
              <p className="font-sans text-[11px] text-cosmic-400">
                Transmission failed — please try again, or email {email} directly.
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="btn-editorial mt-2 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Transmission →"}
            </button>
          </form>
        )}
      </Item>

      <Item>
        <div className="mt-8">
          <p className="eyebrow mb-3">Channels</p>
          <div className="flex flex-wrap gap-2">
            {socials.map((s) =>
              s.url ? (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-bone-100/25 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-bone-200 transition-colors hover:bg-bone-100 hover:text-void"
                >
                  {s.label}
                </a>
              ) : (
                <span
                  key={s.label}
                  className="border border-bone-100/10 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-bone-500"
                  title="Link coming soon"
                >
                  {s.label} · soon
                </span>
              ),
            )}
          </div>
        </div>
      </Item>

    </Stagger>
  );
}

/* ── DISPATCH ─────────────────────────────────────────────────────────── */

export default function SectionContent({ section }: { section: Section }) {
  const data: SectionData = section.data;
  switch (data.kind) {
    case "about":
      return <AboutBlock bio={data.bio} quote={data.quote} credits={data.credits} />;
    case "music":
      return (
        <MusicBlock
          limit={3}
          channelLabel={data.channelLabel}
          channelUrl={data.channelUrl}
          videos={data.videos}
          note={data.note}
        />
      );
    case "store":
      return <StoreBlock products={data.products} note={data.note} />;
    case "events":
      return <EventsBlock events={data.events} emptyMessage={data.emptyMessage} />;
    case "contact":
      return (
        <ContactBlock
          email={data.email}
          blurb={data.blurb}
          sla={data.sla}
          socials={data.socials}
        />
      );
    case "blog":
      return (
        <BlogBlock
          description={data.description}
          posts={data.posts}
          emptyMessage={data.emptyMessage}
        />
      );
    case "digital":
      return (
        <DigitalBlock
          description={data.description}
          releases={data.releases}
          note={data.note}
          emptyMessage={data.emptyMessage}
        />
      );
    case "press":
      return (
        <PressBlock
          limit={3}
          description={data.description}
          features={data.features}
          affiliations={data.affiliations}
          emptyMessage={data.emptyMessage}
        />
      );
    case "gallery":
      return (
        <GalleryBlock
          limit={4}
          description={data.description}
          images={data.images}
          links={data.links}
        />
      );
    case "home":
      return (
        <p className="font-sans text-sm leading-relaxed text-bone-200/90">
          {data.intro}
        </p>
      );
  }
}
