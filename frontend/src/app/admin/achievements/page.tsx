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
import { apiFetch } from "@/lib/api";
import type { Achievement, PublicSettings } from "@/lib/api-types";

type FormState = {
  title: string;
  detail: string;
  year: string;
  image: string;
  imageFocalX: number;
  imageFocalY: number;
  gallery: string[];
};

const emptyForm: FormState = {
  title: "",
  detail: "",
  year: String(new Date().getFullYear()),
  image: "",
  imageFocalX: 50,
  imageFocalY: 50,
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
  const [visible, setVisible] = useState(false);
  const [visibleBusy, setVisibleBusy] = useState(false);

  async function load() {
    try {
      const [data, settings] = await Promise.all([
        apiFetch<Achievement[]>("/admin/achievements"),
        apiFetch<PublicSettings>("/settings/public").catch(() => null),
      ]);
      setItems(data);
      if (settings) setVisible(settings.achievementsVisible);
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
      image: item.image,
      imageFocalX: item.imageFocalX ?? 50,
      imageFocalY: item.imageFocalY ?? 50,
      gallery: [...(item.gallery ?? []), "", "", "", ""].slice(0, 4),
    });
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Give the achievement a title.";
    if (!form.detail.trim()) errors.detail = "Describe what happened.";
    if (!form.image) errors.image = "Upload the main image.";
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
      image: form.image,
      imageFocalX: form.imageFocalX,
      imageFocalY: form.imageFocalY,
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

  async function toggleVisibility(next: boolean) {
    if (visibleBusy) return;
    setVisibleBusy(true);
    try {
      const settings = await apiFetch<PublicSettings>("/admin/settings", {
        method: "PUT",
        body: { achievementsVisible: next },
      });
      setVisible(settings.achievementsVisible);
      toast.push(
        next
          ? "Achievements section is visible on the landing page."
          : "Achievements section is hidden from the landing page."
      );
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not update the visibility.", "error");
    } finally {
      setVisibleBusy(false);
    }
  }

  const columns: Column<Achievement>[] = [
    {
      key: "title",
      header: "Achievement",
      mobilePrimary: true,
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative h-10 w-14 shrink-0 overflow-hidden border border-line bg-surface-2">
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
          <span
            title={item.title}
            className="line-clamp-2 min-w-0 flex-1 type-body-sm font-semibold leading-snug text-text"
          >
            {item.title}
          </span>
        </div>
      ),
    },
    {
      key: "year",
      header: "Year",
      className: "w-20 whitespace-nowrap",
      render: (item) => (
        <span className="type-overline tracking-[0.1em] text-subtle">
          {item.year}
        </span>
      ),
    },
    {
      key: "slot",
      header: "Featured",
      className: "hidden w-28 xl:table-cell",
      render: (item) =>
        item.featuredSlot === null ? (
          <span className="type-caption text-faint">Not featured</span>
        ) : (
          <span className="inline-flex items-center gap-1 whitespace-nowrap border border-line-strong bg-surface-2 px-1.5 py-0.5 type-overline uppercase tracking-[0.12em] text-text">
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

      <div className="flex items-center justify-between gap-4 border border-line bg-surface p-4">
        <div className="min-w-0">
          <p className="type-overline uppercase tracking-[0.2em] text-faint">
            Landing page section
          </p>
          <p className="mt-1 type-body-sm leading-snug text-muted">
            {visible
              ? "The Achievements section is visible on the public landing page."
              : "The Achievements section is hidden from the public landing page."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label="Show achievements on the landing page"
          disabled={visibleBusy || loading}
          onClick={() => void toggleVisibility(!visible)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 ${
            visible
              ? "border-orange-400/60 bg-orange-600"
              : "border-line-strong bg-surface-2"
          }`}
        >
          <span
            className={`ml-0.5 inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              visible ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

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
                className="mt-1.5 type-body-sm text-red-300"
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

          <div className="border-t border-line pt-5">
            <ImageUpload
              label="Main image"
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

          <div className="border-t border-line pt-5">
            <p className="type-overline uppercase tracking-[0.2em] text-faint">
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

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
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
