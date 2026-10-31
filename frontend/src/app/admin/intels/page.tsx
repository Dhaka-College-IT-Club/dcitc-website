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
import { apiFetch } from "@/lib/api";
import type { Intel } from "@/lib/api-types";

type FormState = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  date: string;
  image: string;
};

const emptyForm: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  tag: "",
  date: "",
  image: "",
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
    // load() awaits the request before touching state; the rule only guards
    // synchronous setState in an effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.title} ${item.slug} ${item.tag} ${item.date}`
        .toLowerCase()
        .includes(needle)
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
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
      date: item.date,
      image: item.image ?? "",
    });
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Give the intel a title.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errors.slug = "Use lowercase letters, numbers, and single dashes.";
    }
    if (!form.excerpt.trim()) errors.excerpt = "Add a short excerpt.";
    if (!form.content.trim()) errors.content = "Write the article body.";
    if (!form.tag.trim()) errors.tag = "Add a tag.";
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
    const body = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      tag: form.tag.trim(),
      date: form.date.trim(),
      image: form.image,
    };
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
        <div className="flex items-center gap-3">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="h-10 w-14 shrink-0 border border-white/10 object-cover grayscale"
            />
          ) : (
            <span className="h-10 w-14 shrink-0 border border-white/10 bg-white/[0.04]" />
          )}
          <span className="min-w-0">
            <span className="block truncate font-rajdhani text-sm font-semibold text-white">
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
      render: (item) => (
        <span className="inline-flex border border-white/10 px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.1em] text-slate-400">
          {item.tag}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="font-rajdhani text-sm text-slate-400">{item.date}</span>
      ),
    },
    {
      key: "slot",
      header: "Featured",
      render: (item) =>
        item.featuredSlot === null ? (
          <span className="font-rajdhani text-xs text-slate-500">Not featured</span>
        ) : (
          <span className="inline-flex items-center gap-1 border border-white/30 bg-white/[0.06] px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.12em] text-white">
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
        description="The slug becomes the public URL. Lowercase letters, numbers, and dashes only."
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
            placeholder="e.g. Behind the Robotics Lab"
            required
          />

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

          <TextField
            label="Excerpt"
            name="excerpt"
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            error={fieldErrors.excerpt}
            placeholder="One or two lines shown on the card."
            required
          />

          <div>
            <label htmlFor="intel-content" className="dc-label">
              Content
            </label>
            <textarea
              id="intel-content"
              className="dc-input"
              rows={8}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Write the article. Blank lines separate paragraphs."
              aria-invalid={fieldErrors.content ? true : undefined}
              aria-describedby={
                fieldErrors.content ? "intel-content-error" : undefined
              }
              required
            />
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

          <div className="grid gap-4 sm:grid-cols-2">
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
