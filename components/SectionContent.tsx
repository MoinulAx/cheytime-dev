"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type {
  Credit,
  EventItem,
  GalleryImage,
  MusicVideo,
  Product,
  Section,
  SectionData,
  SocialLink,
  ArchiveItem,
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

function GalleryBlock({
  description,
  images,
}: {
  description?: string;
  images: GalleryImage[];
}) {
  return (
    <Stagger>
      {description && (
        <Item>
          <p className="font-display text-lg italic leading-snug text-bone-200">
            {description}
          </p>
        </Item>
      )}
      <div className="mt-6 space-y-8">
        {images.map((img, i) => (
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
                  sizes="(max-width: 1024px) 100vw, 480px"
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
          <p className="mb-4 font-sans text-[15px] leading-relaxed text-bone-200/90">
            {p}
          </p>
        </Item>
      ))}
      <Item>
        <blockquote className="my-8 border-l border-bone-100/40 pl-5">
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
            sizes="(max-width: 1024px) 100vw, 440px"
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

function MusicBlock({
  channelLabel,
  channelUrl,
  videos,
  note,
}: {
  channelLabel: string;
  channelUrl: string;
  videos: MusicVideo[];
  note?: string;
}) {
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
        {videos.map((v, i) => (
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
    </Stagger>
  );
}

/* ── STORE ────────────────────────────────────────────────────────────── */

function StoreBlock({ products, note }: { products: Product[]; note?: string }) {
  const [reserved, setReserved] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setReserved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Stagger>
      <div className="grid grid-cols-1 gap-5 min-[380px]:grid-cols-2">
        {products.map((p, i) => {
          const isReserved = reserved.has(p.id);
          return (
            <Item key={p.id}>
              <div className="group flex h-full flex-col border border-bone-100/10">
                {/* placeholder product visual (no product imagery in source) */}
                <div className="relative aspect-square overflow-hidden border-b border-bone-100/10 bg-void-800">
                  <span className="absolute inset-0 grid place-items-center font-display text-5xl italic text-bone-100/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute left-0 top-0 border-b border-r border-bone-100/10 bg-void px-2 py-1 font-sans text-[9px] uppercase tracking-wide2 text-bone-500">
                    Preview
                  </span>
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
                      onClick={() => toggle(p.id)}
                      aria-pressed={isReserved}
                      className={[
                        "border px-3 py-1.5 font-sans text-[10px] uppercase tracking-wide2 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100",
                        isReserved
                          ? "border-bone-100 bg-bone-100 text-void"
                          : "border-bone-100/25 text-bone-200 hover:border-bone-100",
                      ].join(" ")}
                    >
                      {isReserved ? "Reserved ✓" : "Reserve"}
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
        <span className="eyebrow mt-5 block">Placeholder — no dates confirmed</span>
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
  archive,
}: {
  email: string;
  blurb: string;
  sla: string;
  socials: SocialLink[];
  archive: ArchiveItem[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sent, setSent] = useState(false);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<FormState> = {};
    if (!form.name.trim()) next.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Valid email required";
    if (!form.subject.trim()) next.subject = "Required";
    if (!form.message.trim()) next.message = "Required";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      // Supabase/EmailJS wiring is deferred — show confirmation only.
      setSent(true);
    }
  };

  // text-base below lg keeps iOS Safari from auto-zooming on focus (<16px inputs).
  const field =
    "w-full border-0 border-b border-bone-100/20 bg-transparent px-0 py-2.5 font-sans text-base lg:text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-bone-100";

  return (
    <Stagger>
      <Item>
        <p className="font-sans text-sm leading-relaxed text-bone-200/90">{blurb}</p>
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
            <button type="submit" className="btn-editorial mt-2">
              Send Transmission →
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

      <Item>
        <div className="mt-8">
          <p className="eyebrow mb-3">The Archive</p>
          <div className="grid grid-cols-2 gap-3">
            {archive.map((a, i) => (
              <figure key={i} className="border border-bone-100/10">
                <div className="relative aspect-[4/3] overflow-hidden bg-void-800">
                  {a.src && (
                    <Image
                      src={a.src}
                      alt={a.alt}
                      fill
                      sizes="(max-width: 1024px) 50vw, 220px"
                      className="object-cover"
                      style={{ objectPosition: a.position ?? "50% 50%" }}
                    />
                  )}
                </div>
                <figcaption className="border-t border-bone-100/10 p-2">
                  <p className="font-sans text-[11px] leading-tight text-bone-200">
                    {a.alt}
                  </p>
                  <p className="mt-0.5 font-sans text-[9px] uppercase tracking-wide2 text-bone-500">
                    {a.meta}
                  </p>
                </figcaption>
              </figure>
            ))}
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
          archive={data.archive}
        />
      );
    case "gallery":
      return <GalleryBlock description={data.description} images={data.images} />;
    case "home":
      return (
        <p className="font-sans text-sm leading-relaxed text-bone-200/90">
          {data.intro}
        </p>
      );
  }
}
