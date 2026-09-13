"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord, saveRecord } from "@/app/admin/actions";
import type {
  ChildTableDef,
  FieldDef,
  StorageBucket,
  TableDef,
} from "@/lib/admin/schema";
import { fromInputValue, toInputValue } from "@/lib/admin/datetime";
import { prepareImageUpload } from "@/lib/admin/image-upload";
import { warningsFor, type Warning } from "@/lib/admin/visibility";
import { badgesFor, metaFor, thumbnailKey, type Badge } from "@/lib/admin/rows";
import { createClient } from "@/lib/supabase/browser";
import RecordDrawer from "./RecordDrawer";

type Row = Record<string, unknown>;
type Draft = Record<string, unknown>;

const INPUT =
  "w-full rounded-sm border border-bone-100/20 bg-void-800/60 px-3 py-2.5 font-sans text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-600 focus:border-bone-100 focus-visible:ring-2 focus-visible:ring-bone-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900";

/** Row badge colours. Restrained: a hairline and a tint, never a filled chip. */
const BADGE_TONE: Record<Badge["tone"], string> = {
  warn: "border-amber-300/40 text-amber-200/90",
  accent: "border-cosmic-400/50 text-cosmic-200",
  note: "border-bone-100/20 text-bone-400",
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/**
 * Upload to a storage bucket and return the public URL.
 *
 * Images go to `site-assets`; audio to `music-files`, matching where the
 * legacy admin and the `secure-download` function expect to find things.
 * The timestamped path keeps two files of the same name from colliding.
 */
async function uploadTo(file: File, bucket: StorageBucket): Promise<string> {
  const db = createClient();
  const prepared =
    bucket === "site-assets" ? await prepareImageUpload(file) : file;
  const safeName = prepared.name.replace(/[^\w.-]+/g, "-");
  const prefix = bucket === "music-files" ? "audio" : "admin";
  const path = `${prefix}/${Date.now()}-${safeName}`;
  const { data, error } = await db.storage
    .from(bucket)
    .upload(path, prepared, { upsert: true });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

/** Shared file-picker button used by the image and audio fields. */
function UploadButton({
  accept,
  bucket,
  onUploaded,
  label,
  compact = false,
}: {
  accept: string;
  bucket: StorageBucket;
  onUploaded: (url: string) => void;
  /** What is being replaced, e.g. "Cover". A form can hold several of these,
      and "Upload" on its own tells a screen reader nothing about which. */
  label: string;
  /** Inline variant for the row strip, where a full button dominates. */
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <>
      <label
        className={
          compact
            ? "cursor-pointer rounded-sm border border-bone-100/25 px-2 py-1 font-sans text-[11px] text-bone-300 transition-colors hover:border-bone-100 hover:text-bone-50 focus-within:ring-2 focus-within:ring-bone-100 focus-within:ring-offset-2 focus-within:ring-offset-void"
            : "btn-editorial cursor-pointer text-[12px] focus-within:ring-2 focus-within:ring-bone-100 focus-within:ring-offset-2 focus-within:ring-offset-void-900"
        }
      >
        {busy ? "Uploading…" : "Upload"}
        <input
          type="file"
          accept={accept}
          aria-label={busy ? `Uploading ${label}` : `Upload ${label}`}
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setFailed(null);
            try {
              onUploaded(await uploadTo(file, bucket));
            } catch (err) {
              setFailed(err instanceof Error ? err.message : "Upload failed.");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      {failed && (
        <p className="mt-1 font-sans text-[12px] text-red-200" role="alert">{failed}</p>
      )}
    </>
  );
}

/**
 * An image field that shows what was uploaded and where it lands.
 *
 * The old control was a URL box, a small button and a 48px chip, which left
 * two questions unanswered at exactly the moment they are asked: what does
 * this picture look like at a usable size, and where will it show up? Worse,
 * on a music release it sat directly above the audio upload and looked
 * identical to it, so a cover and a song were two indistinguishable "Upload"
 * buttons.
 *
 * So: a real square preview, the destination stated in words, the format and
 * size stated before a file is chosen rather than after the wrong one is in
 * the bucket, and an upload state that is always named.
 *
 * Optimisation, bucket and the saved URL are untouched, this is the same
 * `uploadTo` every other field uses.
 */
type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done" }
  | { status: "failed"; message: string };

function ImageField({
  def,
  value,
  onChange,
  hideLabel = false,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: unknown) => void;
  /** Suppressed when a group heading above already names this field. */
  hideLabel?: boolean;
}) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  // Distinguishes "this file is unreachable" from "no file yet": both render
  // an empty frame otherwise, and they need different fixes.
  const [broken, setBroken] = useState(false);
  const square = def.preview !== "wide";
  const hasImage = value.trim().length > 0 && !broken;

  const choose = async (file: File) => {
    setState({ status: "uploading" });
    setBroken(false);
    try {
      const url = await uploadTo(file, def.bucket ?? "site-assets");
      onChange(url);
      setState({ status: "done" });
    } catch (err) {
      setState({
        status: "failed",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  };

  const STATUS: Record<UploadState["status"], string | null> = {
    idle: null,
    uploading: "Uploading\u2026",
    done: "Uploaded",
    failed: null,
  };

  return (
    <div>
      {!hideLabel && (
        <p className="mb-1.5 font-sans text-[12px] font-medium text-bone-200">
          {def.label}
        </p>
      )}
      {def.hint && (
        <p className="mb-3 font-sans text-[12px] leading-snug text-bone-400">
          {def.hint}
        </p>
      )}

      <div className="flex items-start gap-4">
        {/* Preview. Deliberately modest: large enough to recognise the image,
            small enough that the field does not dominate the form. */}
        <div
          className={[
            "relative shrink-0 overflow-hidden rounded-sm border border-bone-100/20 bg-void-800",
            square
              ? "h-[104px] w-[104px] sm:h-[144px] sm:w-[144px]"
              : "h-[76px] w-[135px] sm:h-[96px] sm:w-[171px]",
          ].join(" ")}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              onError={() => setBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-2 text-center font-sans text-[11px] leading-snug text-bone-600">
              {broken ? "Image will not load" : (def.emptyLabel ?? "No image")}
            </span>
          )}
          {state.status === "uploading" && (
            <span className="absolute inset-0 grid place-items-center bg-void/75 font-sans text-[11px] text-bone-100">
              Uploading&#8230;
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={[
                "inline-flex min-h-[40px] cursor-pointer items-center rounded-sm border px-3 font-sans text-[12px] transition-colors",
                "focus-within:ring-2 focus-within:ring-bone-100 focus-within:ring-offset-2 focus-within:ring-offset-void-900",
                state.status === "uploading"
                  ? "cursor-wait border-bone-100/20 text-bone-500"
                  : "border-bone-100/30 text-bone-100 hover:bg-bone-100 hover:text-void",
              ].join(" ")}
            >
              {state.status === "uploading"
                ? "Uploading\u2026"
                : hasImage
                  ? "Replace image"
                  : "Upload"}
              <input
                id={def.key ? `${def.key}-file` : undefined}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={state.status === "uploading"}
                aria-label={`${hasImage ? "Replace" : "Upload"} ${def.label}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void choose(file);
                }}
              />
            </label>

            {hasImage && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setState({ status: "idle" });
                  setBroken(false);
                }}
                className="min-h-[40px] rounded-sm px-3 font-sans text-[12px] text-bone-400 transition-colors hover:bg-red-400/10 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900"
              >
                Remove
                <span className="sr-only"> {def.label}</span>
              </button>
            )}
          </div>

          <div aria-live="polite" className="empty:hidden">
            {STATUS[state.status] && (
              <p className="font-sans text-[12px] text-bone-300">
                {STATUS[state.status]}
              </p>
            )}
            {state.status === "failed" && (
              <p role="alert" className="font-sans text-[12px] text-red-200">
                Failed: {state.message}
              </p>
            )}
          </div>

          {def.spec && (
            <p className="font-sans text-[12px] leading-snug text-bone-500">
              {def.spec}
            </p>
          )}
        </div>
      </div>

      {/* Secondary, for pasting a Storage URL by hand. Kept because that is a
          real workflow, demoted because uploading is the common one. */}
      <label
        htmlFor={def.key}
        className="mt-3 block font-sans text-[11px] text-bone-600"
      >
        Or paste an image URL
      </label>
      <input
        id={def.key}
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setBroken(false);
          setState({ status: "idle" });
        }}
        className={`${INPUT} mt-1 text-[13px]`}
        placeholder="https://\u2026"
      />
    </div>
  );
}

function Field({
  def,
  value,
  onChange,
  warnings = [],
  labelledByGroup = false,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  /** Reasons this value will stop the row appearing on the site. */
  warnings?: string[];
  /** The group heading above already carries this field's name. */
  labelledByGroup?: boolean;
}) {
  const control = () => {
    switch (def.type) {
      case "textarea":
        return (
          <textarea
            id={def.key}
            rows={3}
            value={str(value)}
            onChange={(e) => onChange(e.target.value)}
            className={`${INPUT} resize-y`}
            placeholder={def.placeholder}
          />
        );
      case "boolean":
        return (
          <label className="flex items-center gap-2 py-1">
            <input
              id={def.key}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 accent-bone-100"
            />
            <span className="font-sans text-sm text-bone-300">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );
      case "select":
        return (
          <select
            id={def.key}
            value={str(value)}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
          >
            {def.options?.map((o) => (
              <option key={o} value={o} className="bg-void-800">
                {o}
              </option>
            ))}
          </select>
        );
      case "number":
        return (
          <input
            id={def.key}
            type="number"
            step="any"
            value={str(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            className={INPUT}
          />
        );
      case "datetime":
        return (
          <input
            id={def.key}
            type="datetime-local"
            value={toInputValue(str(value))}
            onChange={(e) => onChange(fromInputValue(e.target.value))}
            className={INPUT}
          />
        );
      case "date":
        return (
          <input
            id={def.key}
            type="date"
            value={str(value).slice(0, 10)}
            onChange={(e) => onChange(e.target.value || null)}
            className={INPUT}
          />
        );
      case "image":
        return (
          <ImageField
            def={def}
            value={str(value)}
            onChange={onChange}
            hideLabel={labelledByGroup}
          />
        );
      case "audio":
        return (
          <div className="space-y-2">
            <input
              id={def.key}
              type="url"
              value={str(value)}
              onChange={(e) => onChange(e.target.value)}
              className={INPUT}
              placeholder="https://… or upload below"
            />
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                accept="audio/*"
                bucket={def.bucket ?? "music-files"}
                onUploaded={onChange}
                label={def.label}
              />
              {str(value) && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500 hover:text-cosmic-400"
                >
                  Clear
                </button>
              )}
            </div>
            {str(value) && (
              <audio
                controls
                preload="none"
                src={str(value)}
                className="w-full"
              />
            )}
          </div>
        );
      default:
        return (
          <input
            id={def.key}
            type={def.type === "url" ? "url" : "text"}
            value={str(value)}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
            placeholder={def.placeholder}
          />
        );
    }
  };

  // An image field draws its own label and hint alongside the preview, so the
  // wrapper must not draw them again.
  const selfLabelled = def.type === "image";
  const hideOwnLabel = selfLabelled || labelledByGroup;

  return (
    <div>
      {!hideOwnLabel && (
        <label
          htmlFor={def.key}
          className="mb-1.5 block font-sans text-[12px] font-medium text-bone-200"
        >
          {def.label}
        </label>
      )}
      {control()}
      {!selfLabelled && def.hint && (
        <p className="mt-1.5 font-sans text-[12px] leading-snug text-bone-500">
          {def.hint}
        </p>
      )}
      {warnings.map((w) => (
        <p
          key={w}
          className="mt-1.5 border-l-2 border-amber-300/60 pl-2.5 font-sans text-[12px] leading-snug text-amber-200/90"
        >
          {w}
        </p>
      ))}
    </div>
  );
}

/**
 * Extra images for one parent row (merch product → merch_product_images).
 *
 * Adding uploads first, then writes the row, so a failed upload never leaves a
 * record pointing at nothing. Deleting only removes the row, the file stays
 * in the bucket, matching the legacy admin and keeping a mis-click recoverable.
 */
function ChildImages({
  child,
  parentId,
  images,
  onChanged,
}: {
  child: ChildTableDef;
  parentId: string;
  images: Row[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const add = async (url: string) => {
    setError(null);
    const result = await saveRecord(child.table, null, {
      [child.foreignKey]: parentId,
      [child.imageKey]: url,
      ...(child.sortKey ? { [child.sortKey]: images.length } : {}),
    });
    if (!result.ok) setError(result.error ?? "Could not add the image.");
    else onChanged();
  };

  const remove = async (id: string) => {
    setError(null);
    const result = await deleteRecord(child.table, id);
    if (!result.ok) setError(result.error ?? "Could not remove the image.");
    else onChanged();
  };

  return (
    // Full-width and last in the row, indented to line up with the row's text
    // so it reads as belonging to that product rather than as a row of its
    // own. It used to carry a top border, which made it look like one.
    <div className="order-last w-full pb-1 pl-[3.75rem]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-sans text-[12px] text-bone-500">
          {child.title}
          {images.length > 0 && (
            <span className="ml-1.5 tabular-nums text-bone-600">
              {images.length}
            </span>
          )}
        </p>
        <UploadButton
          accept="image/*"
          bucket={child.bucket ?? "site-assets"}
          onUploaded={add}
          label={`${child.title} for this product`}
          compact
        />
      </div>

      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={String(img.id)} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={str(img[child.imageKey])}
                alt=""
                className="h-14 w-14 border border-bone-100/15 object-cover"
              />
              <button
                type="button"
                onClick={() => remove(String(img.id))}
                aria-label="Remove image"
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-sm border border-bone-100/30 bg-void text-[11px] text-bone-300 transition-colors hover:border-red-300 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-1 focus-visible:ring-offset-void"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 font-sans text-[12px] text-red-200" role="alert">{error}</p>
      )}
    </div>
  );
}

export default function TableEditor({
  def,
  rows,
  childRows,
  loadError,
}: {
  def: TableDef;
  rows: Row[];
  childRows: Row[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  // Recomputed from the live draft, so a warning appears while typing rather
  // than after saving and wondering where the row went. Split into the ones
  // that belong under a field and the ones about the row as a whole.
  const allWarnings: Warning[] = draft ? warningsFor(def.table, draft) : [];
  const fieldWarnings = allWarnings.filter((w) => w.field);
  const rowWarnings = allWarnings.filter((w) => !w.field);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Shown briefly after a write lands. A save that closes the drawer and
  // changes nothing visible otherwise reads as a save that did not happen.
  const [saved, setSaved] = useState(false);

  const isCreating = editingId === "__new__";
  const canCreate = def.canCreate !== false && !def.readOnly;
  // `site_settings` is keyed on `key`, not `id`.
  const pk = def.primaryKey ?? "id";

  const openNew = () => {
    setEditingId("__new__");
    setDraft({ ...def.defaults });
    setError(null);
    setSaved(false);
  };

  const openEdit = (row: Row) => {
    setEditingId(String(row[pk]));
    setDraft(Object.fromEntries(def.fields.map((f) => [f.key, row[f.key]])));
    setError(null);
  };

  const close = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
  };

  // The success note clears itself. Left up, it goes stale and starts
  // describing an older save than the one you are looking at.
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const result = await saveRecord(
      def.table,
      isCreating ? null : editingId,
      draft,
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Save failed.");
      return;
    }
    close();
    setSaved(true);
    startTransition(() => router.refresh());
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this permanently?")) return;
    const result = await deleteRecord(def.table, id);
    if (!result.ok) {
      setError(result.error ?? "Delete failed.");
      return;
    }
    startTransition(() => router.refresh());
  };

  const count = rows.length;
  const thumbKey = thumbnailKey(def);

  return (
    <section>
      {/* Header: what this is, how many, and the one action that creates. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl text-bone-50">{def.title}</h2>
            {def.numeral && (
              <span className="font-sans text-[12px] text-bone-600">
                Hour {def.numeral}
              </span>
            )}
            <span className="font-sans text-[12px] tabular-nums text-bone-600">
              {count} {count === 1 ? "entry" : "entries"}
            </span>
          </div>
          {/* One line, always visible: nobody should have to open anything to
              learn whether an edit here is publicly visible. The longer
              guidance moves into the details below. */}
          <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-bone-400">
            {def.showsOn}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openNew}
            className="btn-editorial shrink-0 text-[12px]"
          >
            New
          </button>
        )}
      </div>

      {/* Secondary guidance, collapsed. It was three stacked paragraphs on
          every tab, read once and then permanently in the way. */}
      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-sans text-[12px] text-bone-500 transition-colors hover:text-bone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void">
          <span
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
          >
            ›
          </span>
          How this tab works
        </summary>
        <p className="measure mt-2 border-l border-bone-100/15 pl-3 font-sans text-[13px] leading-relaxed text-bone-400">
          {def.blurb}
        </p>
      </details>

      {/* Status. One region, spoken politely, so a save or a failure is
          announced rather than only drawn. */}
      <div aria-live="polite" className="empty:hidden">
        {loadError && (
          <p className="mt-4 rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2.5 font-sans text-[13px] text-red-200">
            Could not load this table: {loadError}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2.5 font-sans text-[13px] text-red-200">
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-4 rounded-sm border border-bone-100/25 bg-bone-100/5 px-3 py-2.5 font-sans text-[13px] text-bone-200">
            Saved. The site updates within a minute.
          </p>
        )}
        {pending && !saved && (
          <p className="mt-4 font-sans text-[12px] text-bone-500">Refreshing…</p>
        )}
      </div>

      {/* Rows */}
      <ul className="mt-5 divide-y divide-bone-100/10 border-y border-bone-100/10">
        {rows.length === 0 && (
          <li className="px-1 py-12 text-center">
            <p className="font-display text-lg italic text-bone-300">
              Nothing here yet.
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={openNew}
                className="btn-editorial mt-4 text-[12px]"
              >
                Add the first one
              </button>
            )}
          </li>
        )}

        {rows.map((row) => {
          const id = String(row[pk]);
          const label = str(row[def.labelKey]) || "Untitled";
          const badges = badgesFor(def, row);
          const meta = metaFor(def, row);
          const thumb = thumbKey ? str(row[thumbKey]) : "";
          const isOpen = id === editingId;

          return (
            <li
              key={id}
              className={[
                "flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-2.5 transition-colors",
                isOpen ? "bg-bone-100/[0.06]" : "hover:bg-bone-100/[0.03]",
              ].join(" ")}
            >
              {thumbKey && (
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-bone-100/15 bg-void-800">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      // Not every image_url is an image: the gallery stores
                      // Instagram permalinks in the same column. Hiding a
                      // failed load beats a broken-image glyph in every row.
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-full w-full place-items-center font-display text-base italic text-bone-100/20"
                    >
                      ♪
                    </span>
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="min-w-0 truncate font-sans text-[14px] text-bone-100">
                    {label}
                  </p>
                  {badges.map((b) => (
                    <span
                      key={b.label}
                      className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide ${BADGE_TONE[b.tone]}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
                {meta && (
                  <p className="mt-0.5 truncate font-sans text-[12px] text-bone-500">
                    {meta}
                  </p>
                )}
              </div>

              {!def.readOnly && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="min-h-[40px] rounded-sm px-3 font-sans text-[12px] text-bone-200 transition-colors hover:bg-bone-100/10 hover:text-bone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  >
                    Edit
                    <span className="sr-only"> {label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="min-h-[40px] rounded-sm px-3 font-sans text-[12px] text-bone-500 transition-colors hover:bg-red-400/10 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  >
                    Delete
                    <span className="sr-only"> {label}</span>
                  </button>
                </div>
              )}

              {def.child && (
                <ChildImages
                  child={def.child}
                  parentId={id}
                  images={childRows.filter(
                    (c) => String(c[def.child!.foreignKey]) === id,
                  )}
                  onChanged={() => startTransition(() => router.refresh())}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* The editor, over the list rather than above it, so closing it puts
          you back exactly where you were. */}
      <RecordDrawer
        open={draft !== null}
        eyebrow={isCreating ? `New in ${def.title}` : `Editing ${def.title}`}
        title={
          isCreating
            ? "New entry"
            : str(draft?.[def.labelKey]) || "Untitled"
        }
        onClose={close}
        footer={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-editorial text-[12px] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={close}
              className="min-h-[40px] rounded-sm px-3 font-sans text-[12px] text-bone-400 transition-colors hover:text-bone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bone-100 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900"
            >
              Cancel
            </button>
            {error && (
              <span className="ml-auto font-sans text-[12px] text-red-200">
                Not saved
              </span>
            )}
          </>
        }
      >
        {draft && (
          <>
            {rowWarnings.length > 0 && (
              <div className="mb-5 rounded-sm border border-amber-300/40 bg-amber-300/5 px-3 py-2.5">
                {rowWarnings.map((w) => (
                  <p
                    key={w.message}
                    className="font-sans text-[12px] leading-relaxed text-amber-200/90"
                  >
                    {w.message}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-5">
              {def.fields.map((f, i) => {
                // A group heading is drawn when the group changes, so
                // consecutive fields sharing one sit in a single block. On
                // Music & Album this is what separates the cover image from
                // the audio file, which were previously two identical-looking
                // Upload buttons stacked on top of each other.
                const startsGroup = f.group && f.group !== def.fields[i - 1]?.group;
                return (
                  <div
                    key={f.key}
                    className={
                      startsGroup
                        ? "rounded-sm border border-bone-100/15 bg-bone-100/[0.02] p-4"
                        : undefined
                    }
                  >
                    {startsGroup && (
                      <div className="mb-3">
                        <h3 className="font-sans text-[13px] font-medium text-bone-100">
                          {f.group}
                        </h3>
                        {f.groupNote && (
                          <p className="mt-0.5 font-sans text-[12px] leading-snug text-bone-500">
                            {f.groupNote}
                          </p>
                        )}
                      </div>
                    )}
                    <Field
                      def={f}
                      labelledByGroup={f.group === f.label}
                      value={draft[f.key]}
                      onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                      warnings={fieldWarnings
                        .filter((w) => w.field === f.key)
                        .map((w) => w.message)}
                    />
                  </div>
                );
              })}
            </div>
            {error && (
              <p className="mt-5 rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2.5 font-sans text-[13px] text-red-200">
                {error}
              </p>
            )}
          </>
        )}
      </RecordDrawer>
    </section>
  );
}
