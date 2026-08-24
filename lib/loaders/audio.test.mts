import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { downloadableAudio, streamableAudio } from "./audio.ts";

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

const PUBLIC = "https://x.supabase.co/storage/v1/object/public/music-files/orange-peel.mp3";

console.log("streamableAudio");
t("public https url passes", () => assert.equal(streamableAudio(PUBLIC), PUBLIC));
t("signed url is rejected", () =>
  assert.equal(streamableAudio("https://x.supabase.co/storage/v1/object/sign/m/a.mp3"), undefined));
t("token url is rejected", () => assert.equal(streamableAudio(`${PUBLIC}?token=abc`), undefined));
t("http url is rejected", () => assert.equal(streamableAudio("http://x.co/a.mp3"), undefined));
t("blank is rejected", () => assert.equal(streamableAudio(""), undefined));

console.log("\ndownloadableAudio");
t("asks Storage for an attachment", () =>
  assert.equal(downloadableAudio(PUBLIC, "Orange Peel"), `${PUBLIC}?download=orange-peel.mp3`));
t("keeps the real extension", () =>
  assert.match(downloadableAudio(PUBLIC.replace(".mp3", ".wav"), "Orange Peel") ?? "", /orange-peel\.wav$/));
t("a title of only punctuation still yields a filename", () =>
  assert.match(downloadableAudio(PUBLIC, "!!!") ?? "", /track\.mp3$/));
t("refuses everything streamableAudio refuses", () =>
  assert.equal(downloadableAudio("https://x.supabase.co/storage/v1/object/sign/m/a.mp3", "x"), undefined));

// The guard that keeps paid masters off the wire. If `audio_url` is ever read
// anywhere in the digital loader other than behind the `free` check, a paid
// track starts shipping in the page source and nothing else would catch it.
console.log("\nthe leak guard");
t("digital loader reads audio_url only when the row is free", () => {
  const src = readFileSync(new URL("./digital.ts", import.meta.url), "utf8");
  const reads = src
    .split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"))
    .filter((l) => l.includes("row.audio_url"));
  assert.equal(reads.length, 1, `expected one read of row.audio_url, found ${reads.length}`);
  assert.match(reads[0]!, /free \?/, "the single read is no longer gated on `free`");
});

console.log(fail ? `\n${fail} FAILED\n` : "\nall passed\n");
process.exit(fail ? 1 : 0);
