/**
 * Every setting the site reads must exist as a seeded row.
 *
 * `site_settings` and `site_sections` both have create disabled in the admin,
 * because their keys are a fixed vocabulary the code looks up rather than a
 * free list. The consequence is that a key which is read but never seeded is
 * editable by nobody: the client cannot add it, and changing it needs a
 * deploy. That is how the Music hour's YouTube handle stayed hard-coded.
 *
 * Run with: npx tsx lib/admin/coverage.test.mts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert";

const loaders = readdirSync("lib/loaders")
  .filter((f) => f.endsWith(".ts"))
  .map((f) => readFileSync(join("lib/loaders", f), "utf8"))
  .join("\n");

// setting(s, "key", …) and s["key"] are the two ways a loader reads one.
const read = new Set<string>();
for (const m of loaders.matchAll(/setting\(\s*s\s*,\s*"([^"]+)"/g)) read.add(m[1]);
for (const m of loaders.matchAll(/s\[\s*"([a-z][a-z_]*\.[a-z_.]+)"\s*\]/gi)) read.add(m[1]);

const sql = readdirSync("supabase/migrations")
  .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
  .join("\n");

const missing = [...read].filter((k) => !sql.includes(`'${k}'`)).sort();

console.log(`settings keys read by loaders: ${read.size}`);
console.log(`seeded: ${read.size - missing.length}`);
if (missing.length) console.log("MISSING:", missing.join(", "));
assert.equal(missing.length, 0, `unseeded settings keys: ${missing.join(", ")}`);
console.log("every key a loader reads is seeded, so all of it is editable");
