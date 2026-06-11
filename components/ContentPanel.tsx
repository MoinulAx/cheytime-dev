"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SectionContent from "./SectionContent";
import type { Section } from "@/types/section";

interface ContentPanelProps {
  section: Section | null;
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';

/**
 * ContentPanel — z-40. Desktop: slides from the right. Mobile: rises as a
 * bottom sheet. A solid editorial surface (no blur, square corners, hairline
 * border) that opens on the section's own photograph. AnimatePresence
 * entry/exit and three close affordances (button · Escape · backdrop).
 * Implements a focus trap and restores focus to the trigger on close.
 * Honours prefers-reduced-motion (simple fade instead of spring).
 */
export default function ContentPanel({
  section,
  isOpen,
  onClose,
}: ContentPanelProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Focus management: trap Tab, close on Escape, restore focus on unmount.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = panelRef.current;

    const getFocusables = () =>
      node
        ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null,
          )
        : [];

    // Defer initial focus until after the enter animation begins.
    const raf = requestAnimationFrame(() => {
      const f = getFocusables();
      (f[0] ?? node)?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = getFocusables();
      if (f.length === 0) {
        e.preventDefault();
        node?.focus();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose, section?.id]);

  const panelVariants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isDesktop
      ? {
          initial: { x: "100%", opacity: 0.4 },
          animate: { x: 0, opacity: 1 },
          exit: { x: "100%", opacity: 0.2 },
        }
      : {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
        };

  const panelTransition = reduce
    ? { duration: 0.18 }
    : { type: "spring" as const, stiffness: 260, damping: 32 };

  return (
    <AnimatePresence mode="wait">
      {isOpen && section && (
        <>
          {/* Backdrop — a plain darken, no blur; kept light on desktop so
              the clock stays visible */}
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close panel"
            tabIndex={-1}
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default bg-black/40 lg:bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            key={`panel-${section.id}`}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${section.title} — ${section.subtitle}`}
            tabIndex={-1}
            className={[
              "panel panel-scroll fixed z-50 overflow-y-auto outline-none",
              isDesktop
                ? "right-0 top-0 h-dvh w-full max-w-[480px] border-l"
                : "inset-x-0 bottom-0 max-h-[88dvh] border-t",
            ].join(" ")}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            {/* mobile grab handle */}
            {!isDesktop && (
              <div className="sticky top-0 z-10 flex justify-center pt-3">
                <span className="h-0.5 w-12 bg-bone-300/40" />
              </div>
            )}

            <div className="px-6 pb-16 pt-6 md:px-8 md:pt-8">
              {/* Header — index row, then the title like a chapter opener */}
              <div className="flex items-baseline justify-between gap-4">
                <p className="eyebrow">
                  Hour {section.numeral}&ensp;·&ensp;
                  {String(section.hourIndex === 0 ? 12 : section.hourIndex).padStart(2, "0")}
                  /12
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="pointer-events-auto -mr-1 inline-flex shrink-0 items-center gap-2 px-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-300 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                >
                  Close
                  <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M2 2l12 12M14 2L2 14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <h2 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-bone-50 md:text-5xl">
                {section.title}
              </h2>
              <p className="mt-2 font-display text-base italic text-bone-300">
                {section.subtitle}
              </p>

              <div className="rule mt-6" />

              {/* Opening photograph — each section gets its own */}
              {section.image && (
                <figure className="mt-6">
                  <div className="relative aspect-[16/10] w-full overflow-hidden border border-bone-100/10">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 480px"
                      className="photo-treatment object-cover"
                      style={{ objectPosition: section.image.position ?? "50% 50%" }}
                    />
                    <div className="grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
                  </div>
                  <figcaption className="mt-2 flex items-baseline justify-between">
                    <span className="font-sans text-[10px] uppercase tracking-wide2 text-bone-400">
                      {section.image.meta ?? section.image.alt}
                    </span>
                    <span className="font-display text-xs italic text-bone-500">
                      fig. {section.numeral.toLowerCase()}
                    </span>
                  </figcaption>
                </figure>
              )}

              {/* Body */}
              <div className="mt-7">
                <SectionContent section={section} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
