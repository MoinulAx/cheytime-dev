"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord, saveRecord } from "@/app/admin/actions";
import type { FieldDef, TableDef } from "@/lib/admin/schema";
import { fromInputValue, toInputValue } from "@/lib/admin/datetime";
import { createClient } from "@/lib/supabase/browser";

type Row = Record<string, unknown>;
type Draft = Record<string, unknown>;

const INPUT =
  "w-full border border-bone-100/20 bg-transparent px-3 py-2 font-sans text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-600 focus:border-bone-100";

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/** Upload into the public bucket the site already reads and renders. */
async function uploadImage(file: File): Promise<string> {
  const db = createClient();
  const path = `admin/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
  const { data, error } = await db.storage
    .from("site-assets")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return db.storage.from("site-assets").getPublicUrl(data.path).data.publicUrl;
}

function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
              <label className="btn-editorial cursor-pointer text-[10px]">
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setUploadError(null);
                    try {
                      onChange(await uploadImage(file));
                    } catch (err) {
                      setUploadError(
                        err instanceof Error ? err.message : "Upload failed.",
                      );
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              {str(value) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={str(value)}
                  alt=""
                  className="h-12 w-12 border border-bone-100/15 object-cover"
                />
              )}
            </div>
            {uploadError && (
              <p className="font-sans text-[11px] text-cosmic-400">
                {uploadError}
              </p>
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
    </div>
  );
}

export default function TableEditor({
  def,
  rows,
  loadError,
}: {
  def: TableDef;
  rows: Row[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCreating = editingId === "__new__";
  const canCreate = def.canCreate !== false && !def.readOnly;

  const openNew = () => {
    setEditingId("__new__");
    setDraft({ ...def.defaults });
    setError(null);
  };

  const openEdit = (row: Row) => {
    setEditingId(String(row.id));
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
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-bone-400">
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
                />
              </div>
            ))}
          </div>
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
          const id = String(row.id);
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
                <div className="flex shrink-0 items-center gap-3">
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
