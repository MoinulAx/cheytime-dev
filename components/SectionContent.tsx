"use client";

import { useEffect, useRef, useState } from "react";
import MediaImage from "./MediaImage";
import Lightbox from "./Lightbox";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";
import { useCart } from "@/lib/cart";
import type {
  AlbumRecord,
  UpcomingRelease,
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

  // Lightbox only on the full page. The panel is itself a dialog, and opening
  // a second one inside it gives you two Escape targets and two close buttons
  // with no way to tell which is which.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isPreview = limit !== undefined;

  // Every other block has an empty state; this one rendered a bare panel with
  // a description and nothing under it. Cannot happen with the archive as it
  // stands, but "no rows yet" is a state, not an accident.
  if (shownImages.length === 0 && (!shownLinks || shownLinks.length === 0)) {
    return (
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
          The archive is empty. Photographs and posts added in the admin appear
          here.
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

      {/*
        Masonry, as the original site had it: CSS multi-column with
        `break-inside-avoid` on each tile. Columns rather than grid because
        photographs here are three different shapes and a grid would either
        force one shape on all of them, which is what made the archive look
        flat and soft, or leave ragged holes.

        The panel gets two columns at most; it is 600-920px wide and three
        would put each photograph below thumbnail size.
      */}
      <div
        className={[
          "mt-6 gap-4",
          isPreview
            ? "columns-1 min-[420px]:columns-2"
            // Full-bleed on the page, so the column count keeps climbing with
            // the monitor instead of stopping at three and leaving the rest
            // of a 1920 screen empty.
            : "columns-1 min-[560px]:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 md:gap-6",
        ].join(" ")}
      >
        {shownImages.map((img, i) => (
          <figure
            key={`${img.src}-${i}`}
            className="mb-4 break-inside-avoid md:mb-6"
          >
            <GalleryTile
              image={img}
              index={i}
              interactive={!isPreview}
              onOpen={() => setOpenIndex(i)}
              sizes={
                isPreview
                  ? "(max-width: 419px) 90vw, (max-width: 1023px) 45vw, 440px"
                  : "(max-width: 559px) 92vw, (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, (max-width: 1535px) 24vw, 19vw"
              }
            />
            <figcaption className="mt-2 flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                {img.alt}
              </span>
              {img.meta && (
                <span className="shrink-0 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                  {img.meta}
                </span>
              )}
            </figcaption>
            {img.caption && (
              <p className="mt-1 border-l border-bone-100/20 pl-3 font-sans text-[11px] leading-snug text-bone-300">
                {img.caption}
              </p>
            )}
          </figure>
        ))}
      </div>

      {/*
        Off-site entries live in the same masonry as the photographs.

        They used to sit in a full-width list underneath, which broke once the
        page went full-bleed: an Instagram embed stretched across 1900px
        renders its card adrift in a sea of white and clips its own content.
        Instagram's embed is happiest between about 326 and 540px, which is
        almost exactly a masonry column, so it goes in the column, as the
        legacy gallery had it.
      */}
      {shownLinks && shownLinks.length > 0 && (
        <div className="mt-10">
          <Item>
            <p className="eyebrow border-b border-bone-100/10 pb-2">Elsewhere</p>
          </Item>
          {/* Column count tuned so each embed lands in Instagram's comfortable
              range (roughly 326-540px) at every width, too narrow and it
              clips its own card, too wide and it floats in white. */}
          <div className="mt-5 columns-1 gap-4 min-[560px]:columns-2 lg:columns-3 2xl:columns-4 min-[2200px]:columns-5 md:gap-6">
            {shownLinks.map((link) => {
              const label = [link.platform, link.kind, link.meta]
                .filter(Boolean)
                .join(" · ");

              // Embeddable entries get the source's own player, as the legacy
              // gallery did. Everything else stays a link card, the only
              // treatment available when there is nothing to embed.
              if (!link.embedUrl) {
                return (
                  <div key={link.url} className="mb-4 break-inside-avoid md:mb-6">
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
                  </div>
                );
              }

              return (
                <figure
                  key={link.url}
                  className="mb-4 break-inside-avoid md:mb-6"
                >
                  <div className="flex items-baseline justify-between gap-3 pb-2">
                    <span className="min-w-0 truncate font-sans text-[13px] leading-snug text-bone-100">
                      {link.title}
                    </span>
                    <span className="shrink-0 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                      {label}
                    </span>
                  </div>
                  {/* Instagram's embed renders its own white card, so the
                      container is light on purpose, a dark frame around it
                      reads as a rendering fault rather than a choice.
                      `overflow-hidden` clips the embed's own horizontal
                      scrollbar, which is what pushed the card past the right
                      edge of its column. */}
                  <div className="overflow-hidden border border-bone-100/10 bg-white">
                    <iframe
                      src={link.embedUrl}
                      title={link.title}
                      loading="lazy"
                      scrolling="no"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="block w-full border-0"
                      height={link.kind === "Reel" ? 560 : 480}
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
              );
            })}
          </div>
        </div>
      )}

      {hiddenCount > 0 && (
        <Item>
          <Link href="/gallery" className="btn-editorial mt-8">
            See all {images.length + (links?.length ?? 0)}
          </Link>
        </Item>
      )}

      {!isPreview && (
        <Lightbox
          image={openIndex === null ? null : (shownImages[openIndex] ?? null)}
          onClose={() => setOpenIndex(null)}
          onPrev={() =>
            setOpenIndex((i) =>
              i === null ? null : (i - 1 + shownImages.length) % shownImages.length,
            )
          }
          onNext={() =>
            setOpenIndex((i) => (i === null ? null : (i + 1) % shownImages.length))
          }
        />
      )}
    </Stagger>
  );
}

/**
 * Starting shape for a tile, from `gallery_items.aspect_ratio`.
 *
 * Only used to reserve space before the photograph arrives. Once it loads the
 * tile switches to the image's real ratio, so a 16:9 shot no longer has its
 * sides cut off to fit a 4:3 box.
 */
const HINT_RATIO: Record<NonNullable<GalleryImage["aspect"]>, number> = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
};

/**
 * One photograph in the masonry.
 *
 * The frame starts at the row's declared shape, which reserves height, so
 * nothing reflows as the archive streams in, and then adopts the image's
 * true ratio the moment it decodes. That is what stops photographs being
 * cropped: `object-cover` only ever crops when the frame disagrees with the
 * picture, and after load it never does.
 *
 * Reading `naturalWidth` rather than storing dimensions in the database
 * because nothing uploads them and asking the client to measure every
 * photograph by hand is not a real workflow.
 */
function GalleryTile({
  image,
  index,
  interactive,
  onOpen,
  sizes,
}: {
  image: GalleryImage;
  index: number;
  interactive: boolean;
  onOpen: () => void;
  sizes: string;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const hint = HINT_RATIO[image.aspect ?? "landscape"];

  const inner = (
    <div
      className="relative w-full overflow-hidden border border-bone-100/10 bg-void-800"
      style={{ aspectRatio: String(ratio ?? hint) }}
    >
      <MediaImage
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ objectPosition: image.position ?? "50% 50%" }}
        // The first few are above the fold on most screens; the rest stay lazy.
        priority={index < 2}
        onLoad={(e) => {
          const el = e.currentTarget;
          if (el.naturalWidth > 0 && el.naturalHeight > 0) {
            setRatio(el.naturalWidth / el.naturalHeight);
          }
        }}
      />
    </div>
  );

  if (!interactive) return inner;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${image.alt} full size`}
      className="group block w-full cursor-zoom-in focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
    >
      {inner}
    </button>
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
          aria-label={video.title ? `Play ${video.title}` : "Play video"}
          className="group absolute inset-0"
        >
          <MediaImage
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
          Subscribe on {channelLabel}
        </a>
      </Item>
      <div className="mt-7 space-y-8">
        {shownVideos.map((v, i) => (
          <Item key={v.id}>
            <div className="mb-2 flex items-baseline justify-between border-b border-bone-100/10 pb-2">
              {/* A row can legitimately have no title yet, a video added
                  before anyone typed its name. The number carries the row on
                  its own; inventing a title would be worse than showing none. */}
              <p className="font-sans text-sm text-bone-100">
                <span className={v.title ? "mr-3 font-display italic text-bone-400" : "font-display italic text-bone-400"}>
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

/* ── BASKET BITS ──────────────────────────────────────────────────────── */

/**
 * Holds an "Added" label on the button for a moment after a click.
 *
 * The basket lives top-right, outside the panel the shopper is looking at, so
 * without this the only feedback for adding something is a badge they are not
 * looking at incrementing behind an overlay.
 */
function useAddFlash() {
  const [addedId, setAddedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return [
    addedId,
    (id: string) => {
      setAddedId(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAddedId(null), 1800);
    },
  ] as const;
}

/** The way out of the panel and into checkout, once there is something to buy. */
function CartLink({ totalItems }: { totalItems: number }) {
  if (totalItems === 0) return null;
  return (
    <Link href="/cart" className="btn-editorial mt-6">
      View cart ({totalItems})
    </Link>
  );
}

/* ── STORE ────────────────────────────────────────────────────────────── */

function StoreBlock({ products, note }: { products: Product[]; note?: string }) {
  // Adding is local and instant now; Stripe is only reached from /cart, which
  // is the one place that knows about the whole basket rather than one row.
  const { add, totalItems } = useCart();
  const [addedId, flash] = useAddFlash();

  return (
    <Stagger>
      <div className="grid grid-cols-1 gap-5 min-[380px]:grid-cols-2">
        {products.map((p, i) => {
          const added = addedId === p.id;
          return (
            <Item key={p.id}>
              <div className="group flex h-full flex-col border border-bone-100/10">
                {/* The photograph when the row has one the loader could keep;
                    otherwise the numbered plate, which is honest about being a
                    stand-in rather than pretending to be the product. */}
                <div className="relative aspect-square overflow-hidden border-b border-bone-100/10 bg-void-800">
                  {p.image ? (
                    <MediaImage
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
                      onClick={() => {
                        // Namespaced: merch and downloads come from separate
                        // tables, so their ids can collide with each other.
                        add({
                          id: `merch:${p.id}`,
                          title: p.title,
                          price: p.price,
                          itemType: "merch",
                          image: p.image,
                          meta: p.material,
                        });
                        flash(p.id);
                      }}
                      className="border border-bone-100/25 px-3 py-1.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-200 transition-colors hover:border-bone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                    >
                      {added ? "Added ✓" : "Add"}
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
      <Item>
        <CartLink totalItems={totalItems} />
      </Item>
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
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
        {/* No "placeholder, no dates confirmed" line here. It was a note to
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
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
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
          // Only a link when the post actually points somewhere, this site
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
          design, a dispatch is longer than this column can hold without
          becoming a scroll tunnel, so the full text lives at /journal. */}
      <Item>
        <Link href="/journal" className="btn-editorial mt-6">
          See more
        </Link>
      </Item>
    </Stagger>
  );
}

/* ── UPCOMING ─────────────────────────────────────────────────────────── */

/**
 * Upcoming (I), what is next.
 *
 * The first entry gets the poster at full width and the rest run as a list.
 * An announcement hour with six equal tiles announces nothing; the lead
 * release is the message, and the others are context.
 *
 * Everything below the title is optional. A row can be a title and a status
 * and still be worth showing, that is what an announcement is before the
 * artwork and the link exist.
 */
function UpcomingBlock({
  description,
  releases,
  emptyMessage,
}: {
  description?: string;
  releases: UpcomingRelease[];
  emptyMessage: string;
}) {
  if (releases.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Split rather than one mixed list. "Upcoming" that opens on something
  // released last spring is not an announcement hour, it is a feed, and the
  // one thing a visitor is here for, what is next, was buried among things
  // that already happened. Order within each group is still the admin's.
  const ahead = releases.filter((r) => !r.released);
  const out = releases.filter((r) => r.released);
  const primary = ahead.length > 0 ? ahead : out;

  // The lead slot is a showcase, so it goes to the first row that can fill
  // one. Sort order still decides between rows that have media; it just does
  // not hand the hero to a text-only row and push a video into a thumbnail.
  const lead = primary.find((r) => r.youtubeId || r.artwork) ?? primary[0];
  const secondary = primary.filter((r) => r.id !== lead.id);
  const recent = ahead.length > 0 ? out : [];

  return (
    <Stagger>
      {description && (
        <Item>
          <p className="measure font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}

      {/* Lead release, its video if it has one, otherwise its poster. */}
      <Item>
        <article className="mt-6 border border-bone-100/10">
          <LeadMedia release={lead} />
          <div className="p-5">
            <Badge label={lead.statusLabel} released={lead.released} />
            {/* An untitled row is a real state, a video added before anyone
                typed its name. The badge, date and video carry the card;
                printing an empty heading would just leave a gap. */}
            {lead.title && (
              <h3 className="mt-3 font-display text-3xl leading-[1.05] text-bone-50">
                {lead.title}
              </h3>
            )}
            {lead.dateLabel && (
              <p className="mt-2 font-sans text-[11px] uppercase tracking-wide2 text-bone-400">
                {lead.dateLabel}
              </p>
            )}
            {lead.description && (
              <p className="measure mt-3 font-sans text-[14px] leading-relaxed text-bone-200/85">
                {lead.description}
              </p>
            )}
            {lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial mt-5"
              >
                {lead.linkLabel}
              </a>
            )}
          </div>
        </article>
      </Item>

      {secondary.length > 0 && <ReleaseList releases={secondary} />}

      {recent.length > 0 && (
        <div className="mt-10">
          <Item>
            <p className="eyebrow border-b border-bone-100/10 pb-2">
              Recently released
            </p>
          </Item>
          <ReleaseList releases={recent} />
        </div>
      )}
    </Stagger>
  );
}

/** The lead card's media: video first, then poster, then nothing. */
function LeadMedia({ release }: { release: UpcomingRelease }) {
  if (release.youtubeId) {
    return (
      <div className="border-b border-bone-100/10">
        <LiteYouTube
          video={{
            id: release.id,
            title: release.title,
            youtubeId: release.youtubeId,
          }}
        />
      </div>
    );
  }
  if (release.artwork) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-bone-100/10 bg-void-800 sm:aspect-[16/10]">
        <MediaImage
          src={release.artwork}
          alt={`Artwork for ${release.title}`}
          fill
          sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 780px, 920px"
          className="object-cover"
          priority
        />
      </div>
    );
  }
  return null;
}

/**
 * The rows under the lead.
 *
 * A row with a video gets a player, not a thumbnail. This hour exists to show
 * what is coming, and a teaser reduced to a 64px still is not showing it,
 * `LiteYouTube` only loads a poster frame until someone presses play, so a
 * handful of them costs one image each.
 */
function ReleaseList({ releases }: { releases: UpcomingRelease[] }) {
  return (
    <div className="mt-4 space-y-6">
      {releases.map((r) =>
        r.youtubeId ? (
          <Item key={r.id}>
            <article className="border border-bone-100/10">
              <LiteYouTube
                video={{ id: r.id, title: r.title, youtubeId: r.youtubeId }}
              />
              <div className="p-4">
                <Badge label={r.statusLabel} released={r.released} />
                {r.title && (
                  <p className="mt-2 font-display text-xl leading-tight text-bone-50">
                    {r.title}
                  </p>
                )}
                {r.dateLabel && (
                  <p className="mt-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                    {r.dateLabel}
                  </p>
                )}
                {r.description && (
                  <p className="mt-2 font-sans text-[13px] leading-relaxed text-bone-200/80">
                    {r.description}
                  </p>
                )}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-sans text-[10px] uppercase tracking-wide2 text-bone-300 underline decoration-bone-100/25 underline-offset-4 transition-colors hover:text-bone-50 hover:decoration-bone-100"
                  >
                    {r.linkLabel}
                  </a>
                )}
              </div>
            </article>
          </Item>
        ) : (
          <Item key={r.id}>
            <article className="flex gap-4 border-t border-bone-100/10 pt-5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-bone-100/10 bg-void-800">
                {r.artwork ? (
                  <MediaImage
                    src={r.artwork}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center font-display text-xl italic text-bone-100/15">
                    ♪
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Badge label={r.statusLabel} released={r.released} />
                {r.title && (
                  <p className="mt-1.5 font-display text-lg leading-tight text-bone-50">
                    {r.title}
                  </p>
                )}
                {r.dateLabel && (
                  <p className="mt-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                    {r.dateLabel}
                  </p>
                )}
                {r.description && (
                  <p className="mt-2 font-sans text-[13px] leading-relaxed text-bone-200/80">
                    {r.description}
                  </p>
                )}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-sans text-[10px] uppercase tracking-wide2 text-bone-300 underline decoration-bone-100/25 underline-offset-4 transition-colors hover:text-bone-50 hover:decoration-bone-100"
                  >
                    {r.linkLabel}
                  </a>
                )}
              </div>
            </article>
          </Item>
        ),
      )}
    </div>
  );
}

/** Out-now reads as an accent; anything still pending stays quiet. */
function Badge({ label, released }: { label: string; released: boolean }) {
  return (
    <span
      className={[
        "inline-block border px-2 py-1 font-sans text-[9px] uppercase tracking-wide2",
        released
          ? "border-cosmic-400/50 text-cosmic-400"
          : "border-bone-100/20 text-bone-400",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/* ── ALBUM ────────────────────────────────────────────────────────────── */

/**
 * Album (III), the record, playable in full.
 *
 * One native `<audio>` per track rather than a custom transport. A bespoke
 * player would have to re-earn keyboard control, screen-reader labelling,
 * scrubbing and the OS media keys, and it would still be the second-best way
 * to listen to a record on a phone.
 *
 * `preload="none"` throughout: a tracklist of ten would otherwise start ten
 * range requests the moment the hour opens, on a panel most visitors are only
 * passing through.
 */
function AlbumBlock({
  description,
  albums,
  emptyMessage,
}: {
  description?: string;
  albums: AlbumRecord[];
  emptyMessage: string;
}) {
  if (albums.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
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

      <div className="mt-6 space-y-10">
        {albums.map((album) => {
          const playable = album.tracks.filter((t) => t.audioUrl).length;
          return (
            <Item key={album.id}>
              <section className="border border-bone-100/10">
                {/* Sleeve + title, set like a record jacket */}
                <div className="flex gap-4 border-b border-bone-100/10 p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-bone-100/10 bg-void-800">
                    {album.cover ? (
                      <MediaImage
                        src={album.cover}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-display text-3xl italic text-bone-100/15">
                        ♪
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl leading-tight text-bone-50">
                      {album.title}
                    </h3>
                    <p className="mt-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
                      {album.year ? `${album.year} · ` : ""}
                      {/* A record we do not hold the files for has no track
                          count to give. "0 tracks" would read as broken. */}
                      {playable > 0
                        ? `${playable} track${playable === 1 ? "" : "s"}`
                        : album.link
                          ? "Streaming"
                          : "0 tracks"}
                    </p>
                    {album.description && (
                      <p className="mt-2 font-sans text-[13px] leading-relaxed text-bone-200/80">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tracklist */}
                <ol className="divide-y divide-bone-100/10">
                  {album.tracks.map((track, i) => (
                    <li key={track.id} className="px-4 py-4">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-sm italic tabular-nums text-bone-500">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-[14px] leading-tight text-bone-100">
                            {track.title}
                          </p>
                          {track.description && (
                            <p className="mt-1 font-sans text-[12px] leading-relaxed text-bone-200/70">
                              {track.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {track.audioUrl ? (
                        <audio
                          controls
                          preload="none"
                          src={track.audioUrl}
                          aria-label={`${track.title}, from ${album.title}`}
                          className="mt-3 w-full"
                        />
                      ) : (
                        // The row exists but no file has been uploaded. Said
                        // plainly, so the admin can see what is still missing
                        // rather than wondering why a track has no player.
                        <p className="mt-3 font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                          Audio coming soon
                        </p>
                      )}
                    </li>
                  ))}
                </ol>

                {/* Where to hear it, for a record that streams elsewhere. Sits
                    below the tracklist so a record with both keeps its player
                    first: the point of this hour is that the music plays here
                    when we hold the files. */}
                {album.link && (
                  <div className="border-t border-bone-100/10 px-4 py-4">
                    <a
                      href={album.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-editorial"
                    >
                      {album.link.label}
                    </a>
                  </div>
                )}
              </section>
            </Item>
          );
        })}
      </div>
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
  if (releases.length === 0) {
    return (
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
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
                    <MediaImage
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
                {/* No price, no Add. Digital is preview-only, the tracks are
                    here to be heard, not sold. `music_products.price` is still
                    read by the loader and still editable in the admin, so
                    turning sales back on is a UI change, not a data migration.

                    The one thing that does leave this hour is a free track,
                    below, and only when the client has ticked it as such. */}
                {r.free && (
                  <span className="h-fit shrink-0 border border-bone-100/25 px-2 py-1 font-sans text-[9px] uppercase tracking-wide2 text-bone-200">
                    Free
                  </span>
                )}
              </div>
              {/* A free track plays in full and can be kept. Anything else
                  gets the preview clip only: `audio_url` stays server-side,
                  and full files meant for listening live on Album (III). */}
              {r.downloadUrl ? (
                <div className="border-t border-bone-100/10 px-4 py-3">
                  <p className="eyebrow mb-2">Free download</p>
                  <audio
                    controls
                    preload="none"
                    src={r.downloadUrl}
                    className="w-full"
                  />
                  <a
                    href={r.downloadUrl}
                    className="btn-editorial mt-3 inline-block"
                  >
                    Download
                  </a>
                </div>
              ) : (
                r.previewUrl && (
                  <div className="border-t border-bone-100/10 px-4 py-3">
                    <p className="eyebrow mb-2">Preview</p>
                    <audio
                      controls
                      preload="none"
                      src={r.previewUrl}
                      className="w-full"
                    />
                  </div>
                )
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
      <div className="border-y border-bone-100/10 py-12">
        <p className="font-display text-2xl italic text-bone-300">Nothing yet.</p>
        <p className="measure mt-3 font-sans text-sm leading-relaxed text-bone-300/80">
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
    // RLS grants anon INSERT only, nothing is readable back from the browser.
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
            <p className="eyebrow">Message sent</p>
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
                That didn&apos;t send. Try again, or email {email} directly.
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="btn-editorial mt-2 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Message →"}
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
    case "upcoming":
      return (
        <UpcomingBlock
          description={data.description}
          releases={data.releases}
          emptyMessage={data.emptyMessage}
        />
      );
    case "album":
      return (
        <AlbumBlock
          description={data.description}
          albums={data.albums}
          emptyMessage={data.emptyMessage}
        />
      );
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
