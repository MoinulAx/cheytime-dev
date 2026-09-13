"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_TABLES, type WritableTable } from "@/lib/admin/schema";
import { groupedTables } from "@/lib/admin/groups";
import type { AdminUser } from "@/lib/admin/auth";
import { signOut } from "@/app/admin/actions";
import TableEditor from "./TableEditor";

export interface TableRows {
  table: string;
  rows: Record<string, unknown>[];
  /** Rows of the table's `child`, if it has one. Empty otherwise. */
  childRows: Record<string, unknown>[];
  error: string | null;
}

const GROUPS = groupedTables();

export default function AdminShell({
  user,
  data,
}: {
  user: AdminUser;
  data: TableRows[];
}) {
  const [active, setActive] = useState(ADMIN_TABLES[0].table);
  const [navOpen, setNavOpen] = useState(false);

  const byTable = new Map(data.map((d) => [d.table, d]));
  const activeDef = ADMIN_TABLES.find((d) => d.table === active)!;
  const activeData = byTable.get(active);

  const unread = (byTable.get("contact_submissions")?.rows ?? []).filter(
    (r) => !r.read,
  ).length;

  /** Unread count for the inbox, plain row count everywhere else. */
  const countFor = (table: WritableTable) =>
    table === "contact_submissions" ? unread : (byTable.get(table)?.rows.length ?? 0);

  // The mobile nav is a sheet over the content, so Escape has to close it or
  // a keyboard user is stuck behind it.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const choose = (table: WritableTable) => {
    setActive(table);
    setNavOpen(false);
  };

  const nav = (
    <nav aria-label="Admin sections" className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.id}>
          <p className="px-3 font-sans text-[10px] uppercase tracking-wide2 text-bone-600">
            {group.label}
          </p>
          <ul className="mt-2 space-y-px">
            {group.tables.map((def) => {
              const isActive = def.table === active;
              const count = countFor(def.table);
              const flagged = def.table === "contact_submissions" && unread > 0;
              return (
                <li key={def.table}>
                  <button
                    type="button"
                    onClick={() => choose(def.table)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      // min-h-[44px] is the touch target; on desktop the text
                      // size already carries it.
                      "flex min-h-[44px] w-full items-center gap-2 rounded-sm px-3 py-2 text-left font-sans text-[13px] transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                      isActive
                        ? "bg-bone-100/10 text-bone-50"
                        : "text-bone-300 hover:bg-bone-100/5 hover:text-bone-100",
                    ].join(" ")}
                  >
                    {/* A hairline marker rather than a filled block: the active
                        row should be unmistakable without shouting. */}
                    <span
                      aria-hidden="true"
                      className={[
                        "h-4 w-px shrink-0 transition-colors",
                        isActive ? "bg-cosmic-400" : "bg-transparent",
                      ].join(" ")}
                    />
                    <span className="min-w-0 flex-1 truncate">{def.title}</span>
                    {count > 0 && (
                      <span
                        className={[
                          "shrink-0 font-sans text-[11px] tabular-nums",
                          flagged ? "text-cosmic-400" : "text-bone-600",
                        ].join(" ")}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-bone-100/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-expanded={navOpen}
            aria-controls="admin-mobile-nav"
            className="grid h-11 w-11 place-items-center rounded-sm border border-bone-100/20 text-bone-200 transition-colors hover:border-bone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void lg:hidden"
          >
            <span className="sr-only">Open sections menu</span>
            <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
              <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-wide2 text-bone-600">
              Chey Time
            </p>
            <h1 className="font-display text-2xl italic leading-tight text-bone-50">
              Admin
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[14rem] truncate font-sans text-[12px] text-bone-500 sm:block">
            {user.email}
          </span>
          <Link
            href="/"
            className="rounded-sm px-3 py-2 font-sans text-[12px] text-bone-300 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          >
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-sm px-3 py-2 font-sans text-[12px] text-bone-300 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-8 pt-6">
        {/* Desktop sidebar. Sticky so the nav stays put while a long tab
            scrolls, which is most of the point of having it. */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-0">{nav}</div>
        </aside>

        {/* Capped rather than filling the shell: a row stretched to 1100px
            puts Edit and Delete an eye-travel away from the title they act on.
            Reading width wins over using the whole monitor. */}
        <main className="min-w-0 max-w-5xl flex-1 pb-16">
          <TableEditor
            key={activeDef.table}
            def={activeDef}
            rows={activeData?.rows ?? []}
            childRows={activeData?.childRows ?? []}
            loadError={activeData?.error ?? null}
          />
        </main>
      </div>

      {/* Mobile navigation, a sheet rather than a dropdown: fifteen entries in
          four groups does not fit a select, and grouping is the thing that
          makes them findable. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close sections menu"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-void/80 backdrop-blur-[2px]"
          />
          <div
            id="admin-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Admin sections"
            className="relative flex h-full w-[17rem] max-w-[85vw] flex-col border-r border-bone-100/15 bg-void-900"
          >
            <div className="flex items-center justify-between border-b border-bone-100/10 px-4 py-4">
              <p className="font-sans text-[10px] uppercase tracking-wide2 text-bone-600">
                Sections
              </p>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close sections menu"
                className="grid h-11 w-11 place-items-center rounded-sm border border-bone-100/20 text-bone-300 hover:border-bone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.4" fill="none" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">{nav}</div>
          </div>
        </div>
      )}
    </div>
  );
}
