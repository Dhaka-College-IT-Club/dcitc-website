"use client";

import { Facebook, Github, Globe, Linkedin, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import ImageUpload from "@/components/admin/ImageUpload";
import PageHeader from "@/components/admin/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Drawer from "@/components/ui/Drawer";
import TextField from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import type { Leader } from "@/lib/api-types";

type FormState = {
  name: string;
  role: string;
  tier: "executive" | "chief" | "joint";
  batch: string;
  image: string;
  facebook: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

const emptyForm: FormState = {
  name: "",
  role: "",
  tier: "executive",
  batch: "",
  image: "",
  facebook: "",
  linkedin: "",
  github: "",
  portfolio: "",
};

const tierLabels: Record<FormState["tier"], string> = {
  executive: "Executive",
  chief: "Chief",
  joint: "Joint",
};

const linkKeys = ["facebook", "linkedin", "github", "portfolio"] as const;

function validate(form: FormState) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Enter the member's name.";
  if (!form.role.trim()) errors.role = "Enter a role or title.";
  if (!form.batch.trim()) errors.batch = "Enter the HSC batch.";
  for (const key of linkKeys) {
    const value = form[key].trim();
    if (value && !/^https?:\/\/\S+$/i.test(value)) {
      errors[key] = "Use a full http(s) link.";
    }
  }
  return errors;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "DC";
}

export default function AdminLeadershipPage() {
  const toast = useToast();
  const [items, setItems] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeBatch, setActiveBatch] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Leader | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<Leader[]>("/admin/leadership");
      setItems(data);
      setError("");
    } catch (err) {
      const apiError = err as { message?: string; status?: number };
      if (apiError?.status !== 401) {
        setError(apiError?.message || "Failed to load leadership.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const batches = useMemo(
    () => Array.from(new Set(items.map((item) => item.batch))).sort().reverse(),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeBatch !== "all" && item.batch !== activeBatch) return false;
      if (!needle) return true;
      return `${item.name} ${item.role} ${item.batch}`
        .toLowerCase()
        .includes(needle);
    });
  }, [items, activeBatch, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function openEdit(item: Leader) {
    setEditing(item);
    setForm({
      name: item.name,
      role: item.role,
      tier: item.tier,
      batch: item.batch,
      image: item.image ?? "",
      facebook: item.facebook ?? "",
      linkedin: item.linkedin ?? "",
      github: item.github ?? "",
      portfolio: item.portfolio ?? "",
    });
    setFieldErrors({});
    setDrawerOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    const body = {
      name: form.name.trim(),
      role: form.role.trim(),
      tier: form.tier,
      batch: form.batch.trim(),
      image: form.image || null,
      facebook: form.facebook.trim() || null,
      linkedin: form.linkedin.trim() || null,
      github: form.github.trim() || null,
      portfolio: form.portfolio.trim() || null,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/leadership/${editing.id}`, {
          method: "PATCH",
          body,
        });
        toast.push(`${body.name} updated.`);
      } else {
        await apiFetch("/admin/leadership", { method: "POST", body });
        toast.push(`${body.name} added to ${body.batch}.`);
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: Record<string, string>;
      };
      if (apiError?.fields) setFieldErrors(apiError.fields);
      toast.push(apiError?.message || "Could not save the member.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await apiFetch(`/admin/leadership/${deleting.id}`, { method: "DELETE" });
      toast.push(`${deleting.name} removed.`);
      setDeleting(null);
      await load();
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not delete the member.", "error");
    } finally {
      setDeletePending(false);
    }
  }

  const columns: Column<Leader>[] = [
    {
      key: "name",
      header: "Member",
      mobilePrimary: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="h-9 w-9 shrink-0 border border-white/10 object-cover grayscale"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] font-orbitron text-[9px] text-slate-400">
              {initials(item.name)}
            </span>
          )}
          <span className="font-rajdhani text-sm font-semibold text-white">
            {item.name}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <span className="font-rajdhani text-sm text-slate-300">{item.role}</span>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (item) => (
        <span className="inline-flex border border-white/10 px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.12em] text-slate-400">
          {tierLabels[item.tier]}
        </span>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      render: (item) => (
        <span className="font-orbitron text-[10px] tracking-[0.1em] text-slate-400">
          {item.batch}
        </span>
      ),
    },
    {
      key: "links",
      header: "Links",
      render: (item) => {
        const links = [
          { href: item.facebook, Icon: Facebook, label: "Facebook" },
          { href: item.linkedin, Icon: Linkedin, label: "LinkedIn" },
          { href: item.github, Icon: Github, label: "GitHub" },
          { href: item.portfolio, Icon: Globe, label: "Portfolio" },
        ].filter((link) => Boolean(link.href));
        if (links.length === 0) {
          return <span className="font-rajdhani text-xs text-slate-500">—</span>;
        }
        return (
          <span className="flex gap-1.5">
            {links.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href as string}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.name} ${label}`}
                className="text-slate-500 transition-colors hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Public panel"
        title="Leadership"
        description="The people shown in the public Leadership section, grouped by HSC batch."
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add member
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveBatch("all")}
            aria-pressed={activeBatch === "all"}
            className={`rounded-full px-4 py-1.5 font-orbitron text-[10px] uppercase tracking-[0.16em] transition-all sm:px-5 sm:py-2 ${
              activeBatch === "all"
                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          {batches.map((batch) => (
            <button
              key={batch}
              type="button"
              onClick={() => setActiveBatch(batch)}
              aria-pressed={activeBatch === batch}
              className={`rounded-full px-4 py-1.5 font-orbitron text-[10px] uppercase tracking-[0.16em] transition-all sm:px-5 sm:py-2 ${
                activeBatch === batch
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {batch}
            </button>
          ))}
        </div>
        <span className="font-rajdhani text-xs text-slate-500">
          {items.length} member{items.length === 1 ? "" : "s"} listed
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getKey={(item) => item.id}
        loading={loading}
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search name, role, or batch…"
        emptyTitle={
          items.length === 0 ? "No members yet" : "No matches in this view"
        }
        emptyDescription={
          items.length === 0
            ? "Add the first panel member and it will appear on the public Leadership section."
            : "Try another batch or clear the search."
        }
        caption="Leadership members"
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
        title={editing ? "Edit member" : "New member"}
        description={
          editing
            ? `Updating ${editing.name}. Changes appear publicly after the next refresh.`
            : "Add a panel member to a batch. Only filled link fields are published."
        }
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              name="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              error={fieldErrors.name}
              placeholder="e.g. Md. Samiul Islam"
              required
            />
            <TextField
              label="Role"
              name="role"
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              error={fieldErrors.role}
              placeholder="e.g. President"
              required
            />
            <TextField
              label="HSC batch"
              name="batch"
              list="admin-batches"
              value={form.batch}
              onChange={(event) => update("batch", event.target.value)}
              error={fieldErrors.batch}
              placeholder="e.g. DC-27"
              required
            />
            <datalist id="admin-batches">
              <option value="DC-27" />
              <option value="DC-26" />
              <option value="DC-25" />
            </datalist>
            <div>
              <label htmlFor="tier" className="dc-label">
                Tier
              </label>
              <select
                id="tier"
                className="dc-input"
                value={form.tier}
                onChange={(event) =>
                  update("tier", event.target.value as FormState["tier"])
                }
              >
                <option value="executive">Executive</option>
                <option value="chief">Chief</option>
                <option value="joint">Joint</option>
              </select>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <ImageUpload
              label="Photo"
              value={form.image}
              onChange={(url) => update("image", url)}
              shape="portrait"
              hint="Square portrait works best. Falls back to the club logo."
            />
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="font-orbitron text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Social links (optional)
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Facebook"
                name="facebook"
                type="url"
                inputMode="url"
                value={form.facebook}
                onChange={(event) => update("facebook", event.target.value)}
                error={fieldErrors.facebook}
                placeholder="https://facebook.com/…"
              />
              <TextField
                label="LinkedIn"
                name="linkedin"
                type="url"
                inputMode="url"
                value={form.linkedin}
                onChange={(event) => update("linkedin", event.target.value)}
                error={fieldErrors.linkedin}
                placeholder="https://linkedin.com/in/…"
              />
              <TextField
                label="GitHub"
                name="github"
                type="url"
                inputMode="url"
                value={form.github}
                onChange={(event) => update("github", event.target.value)}
                error={fieldErrors.github}
                placeholder="https://github.com/…"
              />
              <TextField
                label="Portfolio"
                name="portfolio"
                type="url"
                inputMode="url"
                value={form.portfolio}
                onChange={(event) => update("portfolio", event.target.value)}
                error={fieldErrors.portfolio}
                placeholder="https://…"
              />
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
              {saving
                ? "Saving"
                : editing
                  ? "Save changes"
                  : "Add member"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        title="Remove this member?"
        description={
          deleting
            ? `${deleting.name} will disappear from the public Leadership section. This cannot be undone.`
            : ""
        }
        confirmLabel="Remove member"
        pending={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
