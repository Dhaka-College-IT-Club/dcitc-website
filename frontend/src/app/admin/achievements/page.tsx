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
import type { Achievement } from "@/lib/api-types";

type FormState = {
  title: string;
  detail: string;
  year: string;
  image: string;
  gallery: string[];
};

const emptyForm: FormState = {
  title: "",
  detail: "",
  year: String(new Date().getFullYear()),
  image: "",
  gallery: ["", "", "", ""],
};

export default function AdminAchievementsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slotBusy, setSlotBusy] = useState(false);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<Achievement[]>("/admin/achievements");
      setItems(data);
      setError("");
    } catch (err) {
      const apiError = err as { message?: string; status?: number };
      if (apiError?.status !== 401) {
        setError(apiError?.message || "Failed to load achievements.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.title} ${item.detail} ${item.year}`.toLowerCase().includes(needle)
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function openEdit(item: Achievement) {
    setEditing(item);
    setForm({
      title: item.title,
      detail: item.detail,
      year: String(item.year),
      image: item.image ?? "",
      gallery: [...(item.gallery ?? []), "", "", "", ""].slice(0, 4),
    });
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Give the achievement a title.";
    if (!form.detail.trim()) errors.detail = "Describe what happened.";
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      errors.year = "Enter a four-digit year.";
    }
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
      title: form.title.trim(),
      detail: form.detail.trim(),
      year: Number(form.year),
      image: form.image || null,
      gallery: form.gallery.filter(Boolean),
    };
    try {
      if (editing) {
        await apiFetch(`/admin/achievements/${editing.id}`, {
          method: "PATCH",
          body,
        });
        toast.push("Achievement updated.");
      } else {
        await apiFetch("/admin/achievements", { method: "POST", body });
        toast.push("Achievement created.");
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: Record<string, string>;
      };
      if (apiError?.fields) setFieldErrors(apiError.fields);
      toast.push(apiError?.message || "Could not save the achievement.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function assign(id: number, slot: number | null) {
    if (slotBusy) return;
    setSlotBusy(true);
    try {
      await apiFetch(`/admin/achievements/${id}/featured`, {
        method: "PUT",
        body: { slot },
      });
      await load();
      toast.push(
        slot === null ? "Slot cleared." : `Placed in slot ${slot + 1}.`
      );
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
      await apiFetch(`/admin/achievements/${deleting.id}`, {
        method: "DELETE",
      });
      toast.push("Achievement deleted.");
      setDeleting(null);
      await load();
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not delete the achievement.", "error");
    } finally {
      setDeletePending(false);
    }
  }

  const columns: Column<Achievement>[] = [
    {
      key: "title",
      header: "Achievement",
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
          <span className="font-rajdhani text-sm font-semibold leading-snug text-white">
            {item.title}
          </span>
        </div>
      ),
    },
    {
      key: "year",
      header: "Year",
      render: (item) => (
        <span className="font-orbitron text-[10px] tracking-[0.1em] text-slate-400">
          {item.year}
        </span>
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
        title="Achievements"
        description="Every achievement, plus the five slots that headline the landing page."
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New achievement
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SlotGrid
        count={5}
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
        searchPlaceholder="Search achievements…"
        emptyTitle={
          items.length === 0 ? "No achievements yet" : "No matching achievements"
        }
        emptyDescription={
          items.length === 0
            ? "Create the first achievement and optionally assign it to a landing-page slot."
            : "Try a different search term."
        }
        caption="Achievements"
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
        title={editing ? "Edit achievement" : "New achievement"}
        description="Main image and up to four gallery images. Uploads preview before you save."
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            error={fieldErrors.title}
            placeholder="e.g. National Robotics Championship Finalist"
            required
          />

          <div>
            <label htmlFor="achievement-detail" className="dc-label">
              Detail
            </label>
            <textarea
              id="achievement-detail"
              className="dc-input"
              rows={5}
              value={form.detail}
              onChange={(event) => setForm({ ...form, detail: event.target.value })}
              placeholder="What happened, who took part, and why it matters."
              aria-invalid={fieldErrors.detail ? true : undefined}
              aria-describedby={
                fieldErrors.detail ? "achievement-detail-error" : undefined
              }
              required
            />
            {fieldErrors.detail ? (
              <p
                id="achievement-detail-error"
                role="alert"
                className="mt-1.5 font-rajdhani text-sm text-red-300"
              >
                {fieldErrors.detail}
              </p>
            ) : null}
          </div>

          <TextField
            label="Year"
            name="year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            value={form.year}
            onChange={(event) => setForm({ ...form, year: event.target.value })}
            error={fieldErrors.year}
            required
          />

          <div className="border-t border-white/10 pt-5">
            <ImageUpload
              label="Main image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              shape="wide"
            />
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="font-orbitron text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Gallery
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {form.gallery.map((image, index) => (
                <ImageUpload
                  key={index}
                  label={`Image ${index + 1}`}
                  value={image}
                  onChange={(url) => {
                    const next = [...form.gallery];
                    next[index] = url;
                    setForm({ ...form, gallery: next });
                  }}
                  shape="square"
                  hint="Optional."
                />
              ))}
            </div>
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
              {saving ? "Saving" : editing ? "Save changes" : "Create achievement"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this achievement?"
        description={
          deleting
            ? `“${deleting.title}” and its gallery images will be removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete achievement"
        pending={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
