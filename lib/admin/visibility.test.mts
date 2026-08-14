/**
 * The warnings must agree with the loaders. A warning that fires when the row
 * would actually render is noise; one that stays silent when the row is
 * dropped is worse than nothing.
 */
import assert from "node:assert";
import type { WritableTable } from "./schema.ts";
import { warningsFor, imageWillRender } from "./visibility.ts";

let fail = 0;
const t = (name: string, fn: () => void) => {
  try { fn(); console.log("  PASS  " + name); }
  catch (e) { console.log("  FAIL  " + name + " :: " + (e as Error).message); fail++; }
};
const msgs = (tbl: WritableTable, row: Record<string, unknown>) =>
  warningsFor(tbl, row).map((w) => w.message).join(" | ");

console.log("\nimage allowlist");
t("supabase public object renders", () => assert.ok(imageWillRender("https://x.supabase.co/storage/v1/object/public/site-assets/a.jpg")));
t("supabase SIGNED url does not", () => assert.ok(!imageWillRender("https://x.supabase.co/storage/v1/object/sign/a.jpg")));
t("youtube thumbnail renders", () => assert.ok(imageWillRender("https://i.ytimg.com/vi/abc/hq.jpg")));
t("local path renders", () => assert.ok(imageWillRender("/assets/chey.jpg")));
t("instagram cdn does not", () => assert.ok(!imageWillRender("https://scontent.cdninstagram.com/a.jpg")));
t("google drive does not", () => assert.ok(!imageWillRender("https://drive.google.com/file/d/x/view")));
t("http is rejected", () => assert.ok(!imageWillRender("http://x.supabase.co/storage/v1/object/public/a.jpg")));
t("blank is not an error", () => assert.ok(imageWillRender("")));

console.log("\nevents");
t("past date warns", () => assert.match(msgs("events", { date_time: "2020-01-01T00:00:00Z" }), /already passed/));
t("future date is silent", () => assert.equal(msgs("events", { date_time: "2099-01-01T00:00:00Z" }), ""));
t("no date warns", () => assert.match(msgs("events", { date_time: "" }), /cannot be saved/));

console.log("\nmusic releases");
t("no link and no audio warns", () => assert.match(msgs("music_releases", {}), /will not appear anywhere/));
t("youtube link is enough", () => assert.equal(msgs("music_releases", { platform_link: "https://youtu.be/JOhFEdk0i00" }), ""));
t("spotify link warns", () => assert.match(msgs("music_releases", { platform_link: "https://open.spotify.com/track/x" }), /not a YouTube link/));
t("audio alone is enough", () => assert.equal(msgs("music_releases", { audio_url: "https://x.supabase.co/storage/v1/object/public/music-files/a.mp3" }), ""));

console.log("\nupcoming");
t("empty row warns", () => assert.match(msgs("upcoming_releases", {}), /needs a title, a video or a poster/));
t("title alone is fine", () => assert.equal(msgs("upcoming_releases", { title: "Orange Peel" }), ""));
t("video alone is fine", () => assert.equal(msgs("upcoming_releases", { video_url: "https://youtu.be/JOhFEdk0i00" }), ""));
t("bad video url warns", () => assert.match(msgs("upcoming_releases", { title: "x", video_url: "https://vimeo.com/1" }), /not a YouTube link/));

console.log("\ngallery");
t("bad host warns", () => assert.match(msgs("gallery_items", { image_url: "https://scontent.cdninstagram.com/a.jpg", media_type: "image" }), /will not appear/));
t("uploaded image is silent", () => assert.equal(msgs("gallery_items", { image_url: "https://x.supabase.co/storage/v1/object/public/site-assets/a.jpg", media_type: "image" }), ""));

console.log("\nvisibility flags");
t("inactive merch warns", () => assert.match(msgs("merch_products", { active: false }), /not appear in the Store/));
t("unpublished press warns", () => assert.match(msgs("press_features", { published: false }), /not appear on the Press/));
t("digital with no preview warns", () => assert.match(msgs("music_products", { active: true }), /nothing to play/));

console.log(fail ? `\n${fail} FAILED\n` : "\nall passed\n");
process.exit(fail ? 1 : 0);
