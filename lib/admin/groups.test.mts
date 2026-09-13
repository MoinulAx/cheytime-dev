import assert from "node:assert/strict";
import { ADMIN_TABLES } from "./schema.ts";
import { NAV_GROUPS, groupedTables } from "./groups.ts";

let fail = 0;
const t = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    fail++;
    console.log(`  FAIL  ${name}\n        ${(e as Error).message}`);
  }
};

console.log("nav groups");
t("every admin table is reachable from the sidebar", () => {
  const listed = groupedTables().flatMap((g) => g.tables.map((d) => d.table));
  assert.equal(listed.length, ADMIN_TABLES.length);
  for (const def of ADMIN_TABLES) {
    assert.ok(listed.includes(def.table), `${def.table} is in no nav group`);
  }
});

t("no table is listed twice", () => {
  const listed = NAV_GROUPS.flatMap((g) => g.tables);
  assert.equal(new Set(listed).size, listed.length);
});

t("the four groups are the ones the client was shown", () =>
  assert.deepEqual(
    groupedTables().map((g) => g.label),
    ["Site", "Content", "Commerce", "Messages"],
  ));

t("each group keeps the order it declares", () =>
  assert.deepEqual(
    groupedTables()[0]!.tables.map((d) => d.title),
    ["Sections", "Copy", "Credits", "Channels"],
  ));

// The guards matter more than the happy path: they are what turns "a tab
// silently vanished" into a failing build.
console.log("\nit refuses to hide anything");
t("a table in no group throws", () =>
  assert.throws(
    () => groupedTables([...ADMIN_TABLES, { ...ADMIN_TABLES[0]!, table: "purchases_orphan" as never }]),
    /unreachable/,
  ));

t("a group naming an unknown table throws", () =>
  assert.throws(
    () => groupedTables(ADMIN_TABLES.filter((d) => d.table !== "social_links")),
    /not an admin table/,
  ));

console.log(fail ? `\n${fail} FAILED\n` : "\nall passed\n");
process.exit(fail ? 1 : 0);
