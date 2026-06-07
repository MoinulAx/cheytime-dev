"use client";

import { useEffect, useRef, useState } from "react";
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
 * bottom sheet. Frosted glass, AnimatePresence entry/exit, and three close
 * affordances (button · Escape · backdrop). Implements a focus trap and
 * restores focus to the trigger on close. Honours prefers-reduced-motion
 * (simple fade instead of spring).
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
          {/* Backdrop — kept light on desktop so the clock stays visible */}
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close panel"
            tabIndex={-1}
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default bg-black/30 backdrop-blur-[2px] lg:bg-black/20"
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
              "glass panel-scroll fixed z-50 overflow-y-auto outline-none",
              isDesktop
                ? "right-0 top-0 h-dvh w-full max-w-[460px] border-l"
                : "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t",
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
                <span className="h-1 w-10 rounded-full bg-diamond-300/30" />
              </div>
            )}

            <div className="px-7 pb-16 pt-7 md:px-9 md:pt-9">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-display text-3xl font-bold metallic-cosmic">
                    {section.numeral}
                  </span>
                  <h2 className="mt-2 font-display text-3xl font-bold leading-none text-diamond-50 md:text-4xl">
                    {section.title}
                  </h2>
                  <p className="eyebrow mt-2">{section.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-diamond-300/20 text-diamond-200 transition-colors hover:border-cosmic-400/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-400"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M2 2l12 12M14 2L2 14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-7 h-px w-full bg-gradient-to-r from-cosmic-400/50 to-transparent" />

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
