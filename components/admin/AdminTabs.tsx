"use client";

import { useState } from "react";
import Link from "next/link";
import { ADMIN_TABLES } from "@/lib/admin/schema";
import type { AdminUser } from "@/lib/admin/auth";
import { signOut } from "@/app/admin/actions";
import TableEditor from "./TableEditor";

export interface TableRows {
  table: string;
  rows: Record<string, unknown>[];
  error: string | null;
}

export default function AdminTabs({
  user,
  data,
}: {
  user: AdminUser;
  data: TableRows[];
}) {
  const [active, setActive] = useState(ADMIN_TABLES[0].table);
  const byTable = new Map(data.map((d) => [d.table, d]));
  const activeDef = ADMIN_TABLES.find((d) => d.table === active)!;
  const activeData = byTable.get(active);

  const unread = (byTable.get("contact_submissions")?.rows ?? []).filter(
    (r) => !r.read,
  ).length;

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Chey Time</p>
          <h1 className="font-display text-3xl italic text-bone-50">Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-sans text-[11px] text-bone-500">
            {user.email}
          </span>
          <Link
            href="/"
            className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500 hover:text-bone-100"
          >
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500 hover:text-bone-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="rule my-6" />

      {/* Tabs — each names the clock hour it feeds. */}
      <nav className="flex flex-wrap gap-2">
        {ADMIN_TABLES.map((def) => {
          const isActive = def.table === active;
          const count =
            def.table === "contact_submissions"
              ? unread
              : (byTable.get(def.table)?.rows.length ?? 0);
          return (
            <button
              key={def.table}
              type="button"
              onClick={() => setActive(def.table)}
              aria-current={isActive ? "true" : undefined}
              className={[
                "border px-3 py-2 font-sans text-[11px] uppercase tracking-wide2 transition-colors",
                isActive
                  ? "border-bone-100 bg-bone-100 text-void"
                  : "border-bone-100/25 text-bone-300 hover:border-bone-100",
              ].join(" ")}
            >
              {def.numeral && (
                <span
                  className={
                    isActive ? "mr-2 text-void/60" : "mr-2 text-bone-500"
                  }
                >
                  {def.numeral}
                </span>
              )}
              {def.title}
              {count > 0 && <span className="ml-2 opacity-60">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-8">
        <TableEditor
          key={activeDef.table}
          def={activeDef}
          rows={activeData?.rows ?? []}
          loadError={activeData?.error ?? null}
        />
      </div>
    </>
  );
}
