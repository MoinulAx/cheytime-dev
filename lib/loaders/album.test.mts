import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { isRecord, listenLink } from "./album.ts";

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

console.log("isRecord");
t("album groups tracks", () => assert.ok(isRecord("album")));
t("mixtape groups tracks", () => assert.ok(isRecord("mixtape")));
t("a loose track does not", () => assert.ok(!isRecord("track")));
t("null does not", () => assert.ok(!isRecord(null)));

console.log("\nlistenLink");
t("names Apple Music from the platform column", () =>
  assert.equal(
    listenLink("apple_music", "https://music.apple.com/us/album/x/1")?.label,
    "Listen on Apple Music",
  ));
t("builds the official Apple Music embed URL", () =>
  assert.equal(
    listenLink(
      "apple_music",
      "https://music.apple.com/us/album/cheys-time/6804045277?i=123#track",
    )?.embedUrl,
    "https://embed.music.apple.com/us/album/cheys-time/6804045277",
  ));
t("names Spotify", () =>
  assert.equal(listenLink("spotify", "https://open.spotify.com/album/x")?.label, "Listen on Spotify"));
t("does not invent an embed for an unsupported platform", () =>
  assert.equal(
    listenLink("spotify", "https://open.spotify.com/album/x")?.embedUrl,
    undefined,
  ));
t("falls back to the host for an unknown platform", () =>
  assert.equal(listenLink("carrier pigeon", "https://bandcamp.com/a")?.label, "Listen on bandcamp.com"));
t("refuses a non-https link", () =>
  assert.equal(listenLink("apple_music", "http://music.apple.com/a"), undefined));
t("refuses a blank link", () => assert.equal(listenLink("apple_music", ""), undefined));

/*
 * The seam between the migration and the loader.
 *
 * The seeded mixtape only appears on the Album hour if the exact strings the
 * migration writes are strings the loader accepts. A typo in either file, or
 * someone later renaming a platform value, breaks the hour silently: the row
 * saves, the page renders, and the record is simply missing. Reading the
 * values back out of the SQL is the only way to catch that here, since the
 * database itself is unreachable from this environment.
 */
console.log("\nthe seeded mixtape reaches the hour");
const dir = new URL("../../supabase/migrations/", import.meta.url);
const sql = readdirSync(dir)
  .filter((f) => f.includes("mixtape"))
  .map((f) => readFileSync(new URL(f, dir), "utf8"))
  .join("\n");

t("a mixtape migration exists", () => assert.ok(sql.length > 0, "no migration matching *mixtape* found"));

const seeded = sql.match(/SELECT\s+'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*\n?\s*'([^']+)'/);

t("its INSERT can be read back", () => assert.ok(seeded, "could not parse the seeded values out of the SQL"));
t("the seeded release_type is one the loader groups", () =>
  assert.ok(isRecord(seeded![2]), `release_type ${JSON.stringify(seeded![2])} would fall through to a loose track`));
t("the seeded platform and link produce a Listen button", () => {
  const link = listenLink(seeded![3], seeded![4]);
  assert.ok(link, `platform ${JSON.stringify(seeded![3])} + link ${JSON.stringify(seeded![4])} yields no button`);
  assert.equal(link!.label, "Listen on Apple Music");
});
t("the title survived SQL quote-doubling", () =>
  assert.equal(seeded![1].replace(/''/g, "'"), "Chey's Time"));

console.log(fail ? `\n${fail} FAILED\n` : "\nall passed\n");
process.exit(fail ? 1 : 0);
