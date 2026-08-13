"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GalleryImage } from "@/types/section";

/**
 * Full-size view for one archive photograph.
 *
 * The grid draws every image cropped into its frame; this is the only place
 * the whole picture is visible, so it uses `object-contain` and lets the image
 * find its own shape rather than imposing one.
 *
 * Rendered at z-[70], above the content panel (z-50) and the cart indicator
 * (z-60) — it is the most recent thing the visitor asked for, so it has to sit
 * on top of both.
 */
export default function Lightbox({
  image,
  onClose,
  onPrev,
  onNext,
}: {
  image: GalleryImage | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev?.();
      } else if (e.key === "ArrowRight") {
        onNext?.();
      }
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    if (!image) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", onKeyDown);
    // Focus the close button so Escape and Tab have somewhere to start, and
    // so a screen reader lands inside the dialog rather than behind it.
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [image, onKeyDown]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={image.alt}
          className="fixed inset-0 z-[70] flex flex-col bg-void/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          {/* Backdrop click closes. A button rather than a div so it is
              reachable and announced, not just clickable. */}
          <button
            type="button"
            aria-label="Close full-size view"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="pointer-events-none relative flex items-center justify-between px-5 py-4 md:px-8">
            <p className="font-sans text-[10px] uppercase tracking-wide2 text-bone-400">
              {image.meta ?? "Archive"}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="pointer-events-auto inline-flex items-center gap-2 px-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-300 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
            >
              Close
              <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 md:px-8">
            <motion.div
              key={image.src}
              className="pointer-events-auto relative h-full w-full"
              initial={reduce ? false : { scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.22 }}
            >
              {/* `object-contain` and `fill`: the whole photograph, letterboxed
                  into whatever space the viewport has, at full quality. */}
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                quality={95}
                className="object-contain"
                priority
              />
            </motion.div>
          </div>

          <div className="pointer-events-none relative flex items-center justify-between gap-4 px-5 pb-6 md:px-8">
            <p className="font-sans text-[11px] leading-snug text-bone-300">
              {image.alt}
            </p>
            {(onPrev || onNext) && (
              <div className="pointer-events-auto flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Previous photograph"
                  className="flex h-9 w-9 items-center justify-center border border-bone-100/25 text-bone-200 transition-colors hover:border-bone-100 hover:bg-bone-50 hover:text-void focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Next photograph"
                  className="flex h-9 w-9 items-center justify-center border border-bone-100/25 text-bone-200 transition-colors hover:border-bone-100 hover:bg-bone-50 hover:text-void focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
