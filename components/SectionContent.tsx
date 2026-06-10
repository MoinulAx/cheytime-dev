"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type {
  Credit,
  EventItem,
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

const linkBtn =
  "inline-flex items-center gap-2 rounded-full border border-cosmic-400/40 px-5 py-2.5 font-sans text-[11px] uppercase tracking-wide2 text-diamond-100 transition-colors hover:border-cosmic-400 hover:bg-cosmic-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-400";

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
          <p className="mb-4 font-sans text-[15px] leading-relaxed text-diamond-200/90">
            {p}
          </p>
        </Item>
      ))}
      <Item>
        <blockquote className="my-8 border-l-2 border-cosmic-400/60 pl-5">
          <p className="font-display text-xl italic leading-snug text-diamond-50">
            “{quote}”
          </p>
        </blockquote>
      </Item>
      <Item>
        <p className="eyebrow mb-3">Credits</p>
        <dl className="divide-y divide-diamond-300/10">
          {credits.map((c) => (
            <div key={c.role} className="flex justify-between py-3">
              <dt className="font-sans text-xs uppercase tracking-wide2 text-diamond-500">
                {c.role}
              </dt>
              <dd className="font-sans text-sm text-diamond-100">{c.name}</dd>
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
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cosmic-400/20 bg-black">
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
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover opacity-65 transition-opacity duration-300 group-hover:opacity-90"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-diamond-50/40 bg-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true">
                <path d="M0 0l18 10L0 20z" fill="#fff" />
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
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className={linkBtn}>
          ▶ Subscribe — {channelLabel}
        </a>
      </Item>
      <div className="mt-7 space-y-7">
        {videos.map((v) => (
          <Item key={v.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-sans text-sm text-diamond-100">{v.title}</p>
              {v.year && (
                <span className="font-sans text-[11px] uppercase tracking-wide2 text-diamond-500">
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
          <p className="mt-6 font-sans text-xs italic text-diamond-500">{note}</p>
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
      <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
        {products.map((p) => {
          const isReserved = reserved.has(p.id);
          return (
            <Item key={p.id}>
              <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-diamond-300/10 bg-void-800/40">
                {/* placeholder product visual (no product imagery in source) */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-cosmic-900/50 to-void-900">
                  <span className="absolute inset-0 grid place-items-center font-display text-4xl metallic opacity-40">
                    {p.title.charAt(0)}
                  </span>
                  <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 font-sans text-[9px] uppercase tracking-wide2 text-diamond-400">
                    Preview
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-sans text-[13px] leading-tight text-diamond-100">
                    {p.title}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] uppercase tracking-wide2 text-diamond-500">
                    {p.material}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                    <span className="font-display text-lg metallic">${p.price}</span>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={isReserved}
                      className={[
                        "rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-wide2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-400",
                        isReserved
                          ? "border-cosmic-400 bg-cosmic-600/30 text-white"
                          : "border-diamond-300/25 text-diamond-200 hover:border-cosmic-400/70",
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
          <p className="mt-6 font-sans text-xs italic text-diamond-500">{note}</p>
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
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-cosmic-400/30">
          <span className="font-display text-2xl metallic">VIII</span>
        </div>
        <p className="max-w-xs font-sans text-sm leading-relaxed text-diamond-300/80">
          {emptyMessage}
        </p>
        <span className="eyebrow mt-5">Placeholder — no dates confirmed</span>
      </div>
    );
  }
  return (
    <Stagger>
      <div className="space-y-4">
        {events.map((e) => (
          <Item key={e.id}>
            <div className="rounded-xl border border-diamond-300/10 p-4">
              <p className="font-sans text-[11px] uppercase tracking-wide2 text-diamond-500">
                {e.dateLabel} · {e.location}
              </p>
              <h3 className="mt-1 font-display text-lg text-diamond-50">{e.title}</h3>
              {e.description && (
                <p className="mt-2 font-sans text-sm text-diamond-200/80">
                  {e.description}
                </p>
              )}
              {e.ticketUrl && (
                <a
                  href={e.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkBtn} mt-4`}
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
    "w-full rounded-lg border border-diamond-300/15 bg-void-900/50 px-3 py-2.5 font-sans text-base lg:text-sm text-diamond-50 outline-none transition-colors placeholder:text-diamond-500 focus:border-cosmic-400";

  return (
    <Stagger>
      <Item>
        <p className="font-sans text-sm leading-relaxed text-diamond-200/90">{blurb}</p>
        <a
          href={`mailto:${email}`}
          className="mt-2 inline-block font-sans text-sm text-cosmic-200 underline-offset-4 hover:underline"
        >
          {email}
        </a>
      </Item>

      <Item>
        {sent ? (
          <div className="mt-6 rounded-xl border border-cosmic-400/40 bg-cosmic-600/10 p-5">
            <p className="eyebrow">Transmission received</p>
            <p className="mt-2 font-display text-xl text-diamond-50">Thank you.</p>
            <p className="mt-1 font-sans text-sm text-diamond-300/80">{sla}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3">
            {(["name", "email", "subject"] as const).map((key) => (
              <div key={key}>
                <label htmlFor={key} className="eyebrow mb-1.5 block">
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
                  <p className="mt-1 font-sans text-[11px] text-cosmic-200">{errors[key]}</p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="message" className="eyebrow mb-1.5 block">
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
                <p className="mt-1 font-sans text-[11px] text-cosmic-200">{errors.message}</p>
              )}
            </div>
            <button type="submit" className={`${linkBtn} mt-2`}>
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
                  className="rounded-full border border-diamond-300/20 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-diamond-200 transition-colors hover:border-cosmic-400/70 hover:text-white"
                >
                  {s.label}
                </a>
              ) : (
                <span
                  key={s.label}
                  className="rounded-full border border-diamond-300/10 px-3 py-1.5 font-sans text-[11px] uppercase tracking-wide2 text-diamond-500"
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
              <div
                key={i}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border border-diamond-300/10 bg-gradient-to-br from-void-700 to-void-900"
              >
                <div className="absolute inset-0 flex flex-col justify-end p-2">
                  <p className="font-sans text-[11px] leading-tight text-diamond-200">
                    {a.alt}
                  </p>
                  <p className="font-sans text-[9px] uppercase tracking-wide2 text-diamond-500">
                    {a.meta}
                  </p>
                </div>
              </div>
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
    case "home":
      return (
        <p className="font-sans text-sm leading-relaxed text-diamond-200/90">
          {data.intro}
        </p>
      );
  }
}
