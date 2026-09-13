"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/**
 * A focused editing surface that does not move the list underneath it.
 *
 * The form used to render above the list, so opening a row halfway down a long
 * tab scrolled the page, pushed everything else down, and lost the reader's
 * place; closing it scrolled somewhere else again. A drawer leaves the list
 * exactly where it was, which is what makes editing several rows in a row
 * bearable.
 *
 * A panel on the right at desktop width, a full-height sheet on a phone. Both
 * are the same element, so there is one focus trap and one Escape handler
 * rather than a second mobile implementation to keep in step.
 */
export default function RecordDrawer({
  open,
  title,
  eyebrow,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  /** Names the record being edited, so the drawer is never ambiguous. */
  title: string;
  eyebrow: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Whatever had focus when the drawer opened, so it can be handed back.
  const openerRef = useRef<HTMLElement | null>(null);

  const focusables = useCallback((): HTMLElement[] => {
    const root = panelRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }, []);

  // Kept in a ref so the trap effect below does not depend on it. `onClose` is
  // a fresh closure on every render of the parent, and an effect that re-ran
  // each time would re-capture `openerRef` from inside the drawer, handing
  // focus back to the drawer's own heading instead of the button that opened
  // it.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Remember the opener once, on the way in, and hand focus back on the way
  // out. Split from the trap so it runs exactly twice per open.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    // The heading rather than the first input: reading what you opened before
    // typing into it matters more than saving one Tab.
    panelRef.current?.querySelector<HTMLElement>("[data-drawer-heading]")?.focus();
    return () => {
      const opener = openerRef.current;
      // The row may have re-rendered while the drawer was open, so only
      // restore focus to a node still in the document.
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      // Without this the next Tab walks out of the drawer and into the list
      // behind it, which for a screen-reader user reads as the form vanishing.
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, focusables]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-void/80 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${eyebrow}: ${title}`}
        className="relative flex h-full w-full flex-col border-l border-bone-100/15 bg-void-900 shadow-2xl sm:max-w-[34rem]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-bone-100/10 px-5 py-4">
          <div className="min-w-0">
            <p className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
              {eyebrow}
            </p>
            <h2
              data-drawer-heading
              tabIndex={-1}
              className="mt-1 truncate font-display text-xl text-bone-50 outline-none"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-bone-100/20 text-bone-300 transition-colors hover:border-bone-100 hover:text-bone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.4"
                fill="none"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        <footer className="flex items-center gap-3 border-t border-bone-100/10 bg-void-900 px-5 py-4">
          {footer}
        </footer>
      </div>
    </div>
  );
}
