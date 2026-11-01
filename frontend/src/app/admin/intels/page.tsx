"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import SlotGrid from "@/components/admin/SlotGrid";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Drawer from "@/components/ui/Drawer";
import TextField from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import IntelImage from "@/components/ui/IntelImage";
import IntelMarkdown from "@/components/ui/IntelMarkdown";
import { apiFetch } from "@/lib/api";
import { formatShortDate } from "@/lib/intel";
import type { Intel } from "@/lib/api-types";

type FormState = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  author: string;
  date: string;
  image: string;
  imageFocalX: number;
  imageFocalY: number;
};

const TITLE_MAX = 120;
const EXCERPT_MAX = 200;

const emptyForm: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  tag: "",
  author: "",
  date: "",
  image: "",
  imageFocalX: 50,
  imageFocalY: 50,
};

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function AdminIntelsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Intel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Intel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slotBusy, setSlotBusy] = useState(false);
  const [deleting, setDeleting] = useState<Intel | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");

  async function load() {
    try {
      const data = await apiFetch<Intel[]>("/admin/intels");
      setItems(data);
      setError("");
    } catch (err) {
      const apiError = err as { message?: string; status?: number };
      if (apiError?.status !== 401) {
        setError(apiError?.message || "Failed to load intel.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load() awaits the request before touching state, so the async IIFE keeps
    // the rule from treating the call as synchronous setState (same as layout).
    void (async () => {
      await load();
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.title} ${item.slug} ${item.tag} ${item.author} ${item.date}`
        .toLowerCase()
        .includes(needle)
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setContentTab("write");
    setDrawerOpen(true);
  }

  function openEdit(item: Intel) {
    setEditing(item);
    setForm({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      tag: item.tag,
      author: item.author,
      date: item.date,
      image: item.image ?? "",
      imageFocalX: item.imageFocalX ?? 50,
      imageFocalY: item.imageFocalY ?? 50,
    });
    setFieldErrors({});
    setContentTab("write");
    setDrawerOpen(true);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Give the intel a title.";
    if (form.title.trim().length > TITLE_MAX) {
      errors.title = `Keep the title under ${TITLE_MAX} characters.`;
    }
    if (/[\r\n]/.test(form.title)) {
      errors.title = "Use a single line.";
    }
    if (!editing && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errors.slug = "Use lowercase letters, numbers, and single dashes.";
    }
    if (form.excerpt.trim().length > EXCERPT_MAX) {
      errors.excerpt = `Keep the excerpt under ${EXCERPT_MAX} characters.`;
    }
    if (!form.content.trim()) errors.content = "Write the article body.";
    if (!form.tag.trim()) errors.tag = "Add a tag.";
    if (!form.author.trim()) errors.author = "Add the author.";
    if (!form.date.trim()) errors.date = "Add a date label, e.g. Nov 2025.";
    if (!form.image) errors.image = "Upload the cover image.";
    return errors;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    const fields = {
      title: form.title.trim(),
      // Empty means "derive it from the body" on the server.
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      tag: form.tag.trim(),
      author: form.author.trim(),
      date: form.date.trim(),
      image: form.image,
      imageFocalX: form.imageFocalX,
      imageFocalY: form.imageFocalY,
    };
    // The slug is immutable after creation, so an edit must not send it.
    const body = editing ? fields : { ...fields, slug: form.slug.trim() };
    try {
      if (editing) {
        await apiFetch(`/admin/intels/${editing.id}`, {
          method: "PATCH",
          body,
        });
        toast.push("Intel updated.");
      } else {
        await apiFetch("/admin/intels", { method: "POST", body });
        toast.push("Intel published.");
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: Record<string, string>;
        code?: string;
      };
      if (apiError?.code === "slug_taken") {
        setFieldErrors({ slug: "That slug is already in use." });
      } else if (apiError?.fields) {
        setFieldErrors(apiError.fields);
      }
      toast.push(apiError?.message || "Could not save the intel.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function assign(id: number, slot: number | null) {
    if (slotBusy) return;
    setSlotBusy(true);
    try {
      await apiFetch(`/admin/intels/${id}/featured`, {
        method: "PUT",
        body: { slot },
      });
      await load();
      toast.push(slot === null ? "Slot cleared." : `Placed in slot ${slot + 1}.`);
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      if (
        apiError?.code === "slot_taken" ||
        (apiError?.message ?? "").includes("slot_taken")
      ) {
        toast.push("That slot is already taken. Clear it first.", "error");
      } else {
        toast.push(apiError?.message || "Could not update the slot.", "error");
      }
    } finally {
      setSlotBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await apiFetch(`/admin/intels/${deleting.id}`, { method: "DELETE" });
      toast.push("Intel deleted.");
      setDeleting(null);
      await load();
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not delete the intel.", "error");
    } finally {
      setDeletePending(false);
    }
  }

  const columns: Column<Intel>[] = [
    {
      key: "title",
      header: "Intel",
      mobilePrimary: true,
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative h-10 w-14 shrink-0 overflow-hidden border border-white/10 bg-white/[0.04]">
            {item.image ? (
              <IntelImage
                src={item.image}
                alt=""
                focalX={item.imageFocalX}
                focalY={item.imageFocalY}
                sizes="56px"
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span
              title={item.title}
              className="line-clamp-2 font-rajdhani text-sm font-semibold leading-snug text-white"
            >
              {item.title}
            </span>
            <span className="mt-0.5 block truncate font-rajdhani text-xs text-slate-500">
              /{item.slug}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "tag",
      header: "Tag",
      className: "w-36",
      render: (item) => (
        <span className="block truncate">
          <span className="inline-flex max-w-full border border-white/10 px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.1em] text-slate-400">
            {item.tag}
          </span>
        </span>
      ),
    },
    {
      key: "author",
      header: "Author",
      className: "hidden w-32 xl:table-cell",
      render: (item) => (
        <span
          title={item.author}
          className="block truncate font-rajdhani text-sm text-slate-400"
        >
          {item.author}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "w-28 whitespace-nowrap",
      render: (item) => (
        <span
          className="whitespace-nowrap font-rajdhani text-sm text-slate-400"
          title={item.date}
        >
          {formatShortDate(item.date)}
        </span>
      ),
    },
    {
      key: "slot",
      header: "Featured",
      className: "hidden w-28 xl:table-cell",
      render: (item) =>
        item.featuredSlot === null ? (
          <span className="font-rajdhani text-xs text-slate-500">Not featured</span>
        ) : (
          <span className="inline-flex items-center gap-1 whitespace-nowrap border border-white/30 bg-white/[0.06] px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.12em] text-white">
            Slot {item.featuredSlot + 1}
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Public archive"
        title="Intel"
        description="Articles shown under /intel, plus the three landing-page slots."
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New intel
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SlotGrid
        count={3}
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          slot: item.featuredSlot,
        }))}
        onAssign={(id, slot) => void assign(id, slot)}
        onClear={(id) => void assign(id, null)}
        busy={slotBusy || loading}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getKey={(item) => item.id}
        loading={loading}
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search intel…"
        emptyTitle={items.length === 0 ? "No intel yet" : "No matching intel"}
        emptyDescription={
          items.length === 0
            ? "Publish the first article and optionally feature it on the landing page."
            : "Try a different search term."
        }
        caption="Intel articles"
        fixed
        actions={(item) => (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openEdit(item)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDeleting(item)}
            >
              Delete
            </Button>
          </>
        )}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit intel" : "New intel"}
        description={
          editing
            ? "Editing an existing article. Its public URL stays the same."
            : "The slug becomes the public URL. Lowercase letters, numbers, and dashes only."
        }
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setForm((current) => ({
                ...current,
                title: nextTitle,
                slug:
                  editing || current.slug.trim()
                    ? current.slug
                    : slugFromTitle(nextTitle),
              }));
            }}
            error={fieldErrors.title}
            counter={{
              text: `${form.title.length}/${TITLE_MAX}`,
              over: form.title.length > TITLE_MAX,
            }}
            hint="Single line only. Multi-line prose belongs in the body."
            placeholder="e.g. Behind the Robotics Lab"
            required
          />

          {editing ? (
            <div>
              <p className="dc-label">Slug</p>
              <p className="mt-1.5 break-all font-rajdhani text-base text-slate-300">
                /intel/<span className="text-white">{editing.slug}</span>
              </p>
              <p className="mt-1 font-rajdhani text-xs leading-relaxed text-slate-500">
                The public URL cannot change after creation.
              </p>
            </div>
          ) : (
            <TextField
              label="Slug"
              name="slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              error={fieldErrors.slug}
              hint="Used as /intel/your-slug."
              placeholder="behind-the-robotics-lab"
              required
            />
          )}

          <TextField
            label="Excerpt"
            name="excerpt"
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            error={fieldErrors.excerpt}
            counter={{
              text: `${form.excerpt.length}/${EXCERPT_MAX}`,
              over: form.excerpt.length > EXCERPT_MAX,
            }}
            hint="Leave blank to generate it from the article body."
            placeholder="One or two lines shown on the card."
          />

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="intel-content" className="dc-label">
                Content
              </label>
              <div
                role="tablist"
                aria-label="Content editor"
                className="flex border border-white/10"
              >
                {(["write", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={contentTab === tab}
                    onClick={() => setContentTab(tab)}
                    className={`h-7 px-3 font-orbitron text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      contentTab === tab
                        ? "bg-white text-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab === "write" ? "Write" : "Preview"}
                  </button>
                ))}
              </div>
            </div>

            {contentTab === "write" ? (
              <textarea
                id="intel-content"
                className="dc-input"
                rows={12}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                placeholder={"## A heading\n\nWrite the article in markdown."}
                aria-invalid={fieldErrors.content ? true : undefined}
                aria-describedby={
                  fieldErrors.content ? "intel-content-error" : "intel-content-hint"
                }
                required
              />
            ) : (
              <div className="dc-scroll max-h-[28rem] overflow-y-auto border border-white/15 bg-black/45 px-4 py-3">
                {form.content.trim() ? (
                  <IntelMarkdown content={form.content} />
                ) : (
                  <p className="font-rajdhani text-sm text-slate-500">
                    Nothing to preview yet. Write some markdown first.
                  </p>
                )}
              </div>
            )}

            <p
              id="intel-content-hint"
              className="mt-1.5 font-rajdhani text-xs leading-relaxed text-slate-500"
            >
              Markdown: <code>## Heading</code>, <code>**bold**</code>,{" "}
              <code>- list</code>, <code>[link](https://…)</code>,{" "}
              <code>&gt; quote</code>, <code>```</code> code. Blank lines start a
              new paragraph.
            </p>

            {fieldErrors.content ? (
              <p
                id="intel-content-error"
                role="alert"
                className="mt-1.5 font-rajdhani text-sm text-red-300"
              >
                {fieldErrors.content}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Tag"
              name="tag"
              value={form.tag}
              onChange={(event) => setForm({ ...form, tag: event.target.value })}
              error={fieldErrors.tag}
              placeholder="e.g. Robotics"
              required
            />
            <TextField
              label="Author"
              name="author"
              value={form.author}
              onChange={(event) => setForm({ ...form, author: event.target.value })}
              error={fieldErrors.author}
              placeholder="e.g. DCITC Team"
              required
            />
            <TextField
              label="Date label"
              name="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              error={fieldErrors.date}
              placeholder="e.g. Nov 2025"
              required
            />
          </div>

          <div className="border-t border-white/10 pt-5">
            <ImageUpload
              label="Cover image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              shape="wide"
              error={fieldErrors.image}
              focal={{
                x: form.imageFocalX,
                y: form.imageFocalY,
                onChange: (imageFocalX, imageFocalY) =>
                  setForm((current) => ({ ...current, imageFocalX, imageFocalY })),
              }}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Saving" : editing ? "Save changes" : "Publish intel"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this intel?"
        description={
          deleting
            ? `“${deleting.title}” will stop resolving at /intel/${deleting.slug}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete intel"
        pending={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
