"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord, saveRecord } from "@/app/admin/actions";
import type {
  ChildTableDef,
  FieldDef,
  StorageBucket,
  TableDef,
} from "@/lib/admin/schema";
import { fromInputValue, toInputValue } from "@/lib/admin/datetime";
import { warningsFor, type Warning } from "@/lib/admin/visibility";
import { createClient } from "@/lib/supabase/browser";

type Row = Record<string, unknown>;
type Draft = Record<string, unknown>;

const INPUT =
  "w-full border border-bone-100/20 bg-transparent px-3 py-2 font-sans text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-600 focus:border-bone-100";

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
  const safeName = file.name.replace(/[^\w.-]+/g, "-");
  const prefix = bucket === "music-files" ? "audio" : "admin";
  const path = `${prefix}/${Date.now()}-${safeName}`;
  const { data, error } = await db.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

/** Shared file-picker button used by the image and audio fields. */
function UploadButton({
  accept,
  bucket,
  onUploaded,
}: {
  accept: string;
  bucket: StorageBucket;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <>
      <label className="btn-editorial cursor-pointer text-[10px]">
        {busy ? "Uploading…" : "Upload"}
        <input
          type="file"
          accept={accept}
          className="hidden"
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
        <p className="mt-1 font-sans text-[11px] text-cosmic-400">{failed}</p>
      )}
    </>
  );
}

function Field({
  def,
  value,
  onChange,
  warnings = [],
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  /** Reasons this value will stop the row appearing on the site. */
  warnings?: string[];
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
          <div className="space-y-2">
            <input
              id={def.key}
              type="url"
              value={str(value)}
              onChange={(e) => onChange(e.target.value)}
              className={INPUT}
              placeholder="https://… or upload below"
            />
            <div className="flex items-center gap-3">
              <UploadButton
                accept="image/*"
                bucket={def.bucket ?? "site-assets"}
                onUploaded={onChange}
              />
              {str(value) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={str(value)}
                  alt=""
                  className="h-12 w-12 border border-bone-100/15 object-cover"
                />
              )}
            </div>
          </div>
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

  return (
    <div>
      <label htmlFor={def.key} className="eyebrow mb-1.5 block">
        {def.label}
      </label>
      {control()}
      {def.hint && (
        <p className="mt-1 font-sans text-[11px] leading-snug text-bone-500">
          {def.hint}
        </p>
      )}
      {warnings.map((w) => (
        <p
          key={w}
          className="mt-1.5 border-l-2 border-cosmic-400/60 pl-2 font-sans text-[11px] leading-snug text-cosmic-400"
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
    // order-3 keeps the full-width strip below the row's own controls rather
    // than wrapping between the title and the buttons.
    <div className="order-3 mt-3 w-full border-t border-bone-100/10 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">
          {child.title}
          {images.length > 0 && (
            <span className="ml-2 text-bone-500">{images.length}</span>
          )}
        </p>
        <UploadButton
          accept="image/*"
          bucket={child.bucket ?? "site-assets"}
          onUploaded={add}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center border border-bone-100/30 bg-void text-[10px] text-bone-300 hover:border-cosmic-400 hover:text-cosmic-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 font-sans text-[11px] text-cosmic-400">{error}</p>
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

  const isCreating = editingId === "__new__";
  const canCreate = def.canCreate !== false && !def.readOnly;
  // `site_settings` is keyed on `key`, not `id`.
  const pk = def.primaryKey ?? "id";

  const openNew = () => {
    setEditingId("__new__");
    setDraft({ ...def.defaults });
    setError(null);
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

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl text-bone-50">
            {def.numeral && (
              <span className="mr-2 font-sans text-xs tracking-wide2 text-bone-500">
                {def.numeral}
              </span>
            )}
            {def.title}
          </h2>
          {/* Where an edit here actually lands. Stated first, and stated for
              the internal tables too, so "does this show anywhere?" is never
              a guess. */}
          <p className="mt-2 border-l-2 border-cosmic-600/50 pl-3 font-sans text-[13px] leading-relaxed text-bone-200">
            <span className="mr-1.5 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
              Appears on
            </span>
            {def.showsOn}
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-bone-400">
            {def.blurb}
          </p>
        </div>
        {canCreate && !editingId && (
          <button type="button" onClick={openNew} className="btn-editorial">
            + New
          </button>
        )}
      </div>

      {loadError && (
        <p className="mt-4 border border-cosmic-600/40 px-3 py-2 font-sans text-[12px] text-cosmic-400">
          Could not load: {loadError}
        </p>
      )}
      {error && (
        <p className="mt-4 border border-cosmic-600/40 px-3 py-2 font-sans text-[12px] text-cosmic-400">
          {error}
        </p>
      )}

      {/* Editor form */}
      {draft && (
        <div className="mt-6 border border-bone-100/20 p-5">
          <p className="eyebrow mb-4">{isCreating ? "New entry" : "Editing"}</p>
          <div className="grid gap-5 md:grid-cols-2">
            {def.fields.map((f) => (
              <div
                key={f.key}
                className={
                  f.type === "textarea" ? "md:col-span-2" : undefined
                }
              >
                <Field
                  def={f}
                  value={draft[f.key]}
                  onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                  warnings={fieldWarnings
                    .filter((w) => w.field === f.key)
                    .map((w) => w.message)}
                />
              </div>
            ))}
          </div>
          {rowWarnings.length > 0 && (
            <div className="mt-4 border border-cosmic-400/40 px-4 py-3">
              {rowWarnings.map((w) => (
                <p
                  key={w.message}
                  className="font-sans text-[12px] leading-relaxed text-cosmic-400"
                >
                  {w.message}
                </p>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-editorial disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={close}
              className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500 hover:text-bone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="mt-6 divide-y divide-bone-100/10 border-y border-bone-100/10">
        {rows.length === 0 && (
          <p className="py-8 text-center font-display text-lg italic text-bone-400">
            Nothing here yet.
          </p>
        )}
        {rows.map((row) => {
          const id = String(row[pk]);
          const label = str(row[def.labelKey]) || "Untitled";
          const isUnread =
            def.table === "contact_submissions" && !row.read ? true : false;
          return (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm text-bone-100">
                  {isUnread && (
                    <span className="mr-2 text-cosmic-400" aria-label="Unread">
                      ●
                    </span>
                  )}
                  {label}
                </p>
                <p className="mt-0.5 truncate font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
                  {[
                    str(row.outlet),
                    str(row.email),
                    str(row.release_type),
                    str(row.location),
                    row.price !== undefined && row.price !== null
                      ? `$${str(row.price)}`
                      : "",
                    row.active === false ? "inactive" : "",
                    row.published === false ? "unpublished" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {!def.readOnly && (
                <div className="order-2 flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="font-sans text-[11px] uppercase tracking-wide2 text-bone-300 hover:text-bone-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="font-sans text-[11px] uppercase tracking-wide2 text-bone-500 hover:text-cosmic-400"
                  >
                    Delete
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
            </div>
          );
        })}
      </div>

      {pending && (
        <p className="mt-4 font-sans text-[11px] uppercase tracking-wide2 text-bone-500">
          Refreshing…
        </p>
      )}
    </section>
  );
}
