import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/auth";
import { ADMIN_TABLES } from "@/lib/admin/schema";
import AdminTabs, { type TableRows } from "@/components/admin/AdminTabs";

export const metadata = { title: "Admin · Chey Time" };

/**
 * Admin dashboard.
 *
 * Reads every table server-side in one pass and hands the rows to the client
 * shell, so the panel arrives populated instead of flashing through a loading
 * state per tab. Dynamic by nature, it reads cookies. Never cache it.
 */
export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const db = await createClient();

  const results = await Promise.all(
    ADMIN_TABLES.map(async (def): Promise<TableRows> => {
      let query = db.from(def.table).select("*");
      for (const order of def.orderBy) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      const { data, error } = await query;

      // Child rows (extra merch images) come back in the same pass, so the
      // strip under each product renders with the list instead of firing a
      // request per row after mount.
      let childRows: Record<string, unknown>[] = [];
      if (def.child) {
        let childQuery = db.from(def.child.table).select("*");
        if (def.child.sortKey) {
          childQuery = childQuery.order(def.child.sortKey, {
            ascending: true,
          });
        }
        const { data: children } = await childQuery;
        childRows = (children ?? []) as Record<string, unknown>[];
      }

      return {
        table: def.table,
        rows: (data ?? []) as Record<string, unknown>[],
        childRows,
        error: error?.message ?? null,
      };
    }),
  );

  return <AdminTabs user={user} data={results} />;
}
