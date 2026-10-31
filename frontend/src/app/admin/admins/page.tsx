"use client";

import { KeyRound, Plus, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Drawer from "@/components/ui/Drawer";
import PasswordField from "@/components/ui/PasswordField";
import TextField from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import type { Admin } from "@/lib/api-types";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminAdminsPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Admin[]>([]);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [toggling, setToggling] = useState<Admin | null>(null);
  const [togglePending, setTogglePending] = useState(false);

  const [rotating, setRotating] = useState<Admin | null>(null);
  const [rotatePassword, setRotatePassword] = useState("");
  const [rotateConfirm, setRotateConfirm] = useState("");
  const [rotateErrors, setRotateErrors] = useState<Record<string, string>>({});
  const [rotatePending, setRotatePending] = useState(false);

  async function load() {
    try {
      const current = await apiFetch<Admin>("/admin/auth/me");
      setMe({ id: current.id, role: current.role });
      if (current.role !== "super_admin") {
        router.replace("/admin");
        return;
      }
      const data = await apiFetch<Admin[]>("/super-admin/admins");
      setItems(data);
      setError("");
    } catch (err) {
      const apiError = err as { message?: string; status?: number };
      if (apiError?.status !== 401) {
        setError(apiError?.message || "Failed to load operators.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(needle)
    );
  }, [items, query]);

  function openCreate() {
    setForm({ name: "", email: "", password: "", role: "admin" });
    setFormErrors({});
    setCreateOpen(true);
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Enter a name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await apiFetch("/super-admin/admins", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
      });
      toast.push(`${form.email.trim()} can now sign in.`);
      setCreateOpen(false);
      await load();
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: Record<string, string>;
      };
      if (apiError?.fields) setFormErrors(apiError.fields);
      toast.push(apiError?.message || "Could not create the operator.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggle() {
    if (!toggling) return;
    setTogglePending(true);
    try {
      await apiFetch(`/super-admin/admins/${toggling.id}`, {
        method: "PATCH",
        body: { active: !toggling.active },
      });
      toast.push(
        toggling.active
          ? `${toggling.email} deactivated.`
          : `${toggling.email} reactivated.`
      );
      setToggling(null);
      await load();
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not update the account.", "error");
    } finally {
      setTogglePending(false);
    }
  }

  function openRotate(item: Admin) {
    setRotating(item);
    setRotatePassword("");
    setRotateConfirm("");
    setRotateErrors({});
  }

  async function rotate(event: React.FormEvent) {
    event.preventDefault();
    if (!rotating || rotatePending) return;
    const errors: Record<string, string> = {};
    if (rotatePassword.length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    if (rotateConfirm !== rotatePassword) {
      errors.confirm = "Passwords do not match.";
    }
    setRotateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRotatePending(true);
    try {
      await apiFetch(
        `/super-admin/admins/${rotating.id}/rotate-password`,
        { method: "POST", body: { password: rotatePassword } }
      );
      toast.push(`Password rotated for ${rotating.email}.`);
      setRotating(null);
    } catch (err) {
      const apiError = err as { message?: string };
      toast.push(apiError?.message || "Could not rotate the password.", "error");
    } finally {
      setRotatePending(false);
    }
  }

  const columns: Column<Admin>[] = [
    {
      key: "operator",
      header: "Operator",
      mobilePrimary: true,
      render: (item) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="font-rajdhani text-sm font-semibold text-white">
              {item.name}
            </span>
            {item.id === me?.id ? (
              <span className="border border-white/20 px-1 py-0.5 font-orbitron text-[8px] uppercase tracking-[0.12em] text-slate-400">
                You
              </span>
            ) : null}
          </span>
          <span className="font-rajdhani text-xs text-slate-500">
            {item.email}
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.12em] ${
            item.role === "super_admin"
              ? "border-white/40 bg-white/[0.08] text-white"
              : "border-white/10 text-slate-400"
          }`}
        >
          {item.role === "super_admin" ? (
            <Shield className="h-2.5 w-2.5" aria-hidden="true" />
          ) : null}
          {item.role === "super_admin" ? "Super admin" : "Admin"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 font-rajdhani text-xs ${
            item.active ? "text-emerald-300" : "text-slate-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 ${
              item.active ? "bg-emerald-400" : "bg-slate-600"
            }`}
            aria-hidden="true"
          />
          {item.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (item) => (
        <span className="font-rajdhani text-sm text-slate-400">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Super admin"
        title="Operators"
        description="Create operator accounts, pause access, or rotate a password. Every action is written to the audit log."
        actions={
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New operator
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <DataTable
        columns={columns}
        rows={filtered}
        getKey={(item) => item.id}
        loading={loading}
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search operators…"
        emptyTitle={items.length === 0 ? "No operator accounts" : "No matches"}
        emptyDescription={
          items.length === 0
            ? "Create the first operator account."
            : "Try a different search term."
        }
        caption="Operator accounts"
        actions={(item) => {
          const isSelf = item.id === me?.id;
          return (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openRotate(item)}
              >
                <KeyRound className="h-3 w-3" aria-hidden="true" />
                Password
              </Button>
              <span
                title={
                  isSelf
                    ? "You cannot deactivate your own account."
                    : undefined
                }
              >
                <Button
                  type="button"
                  variant={item.active ? "danger" : "secondary"}
                  size="sm"
                  disabled={isSelf}
                  onClick={() => setToggling(item)}
                >
                  {item.active ? "Deactivate" : "Activate"}
                </Button>
              </span>
            </>
          );
        }}
      />

      <p className="font-rajdhani text-xs leading-snug text-slate-500">
        Your own row cannot be deactivated. Ask another super admin to change
        your access.
      </p>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New operator"
        description="Operators can edit public content. Super admins can also manage accounts and read the audit log."
      >
        <form onSubmit={create} className="space-y-5" noValidate>
          <TextField
            label="Name"
            name="name"
            autoComplete="off"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={formErrors.name}
            placeholder="e.g. Content Lead"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            error={formErrors.email}
            placeholder="operator@example.com"
            required
          />
          <PasswordField
            label="Initial password"
            name="new-admin-password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            error={formErrors.password}
            hint="At least 8 characters. Share it securely."
            required
          />
          <div>
            <label htmlFor="admin-role" className="dc-label">
              Role
            </label>
            <select
              id="admin-role"
              className="dc-input"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Creating" : "Create operator"}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={rotating !== null}
        onClose={() => setRotating(null)}
        title="Rotate password"
        description={
          rotating
            ? `Set a new password for ${rotating.email}. Existing sessions are invalidated.`
            : ""
        }
      >
        <form onSubmit={rotate} className="space-y-5" noValidate>
          <PasswordField
            label="New password"
            name="rotate-password"
            autoComplete="new-password"
            value={rotatePassword}
            onChange={(event) => setRotatePassword(event.target.value)}
            error={rotateErrors.password}
            hint="At least 8 characters."
            required
          />
          <PasswordField
            label="Confirm password"
            name="rotate-confirm"
            autoComplete="new-password"
            value={rotateConfirm}
            onChange={(event) => setRotateConfirm(event.target.value)}
            error={rotateErrors.confirm}
            required
          />
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRotating(null)}
              disabled={rotatePending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={rotatePending}>
              {rotatePending ? "Rotating" : "Rotate password"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={toggling !== null}
        title={
          toggling?.active ? "Deactivate this operator?" : "Reactivate this operator?"
        }
        description={
          toggling
            ? toggling.active
              ? `${toggling.email} will be signed out and cannot sign in until reactivated.`
              : `${toggling.email} will be able to sign in again.`
            : ""
        }
        confirmLabel={toggling?.active ? "Deactivate" : "Reactivate"}
        destructive={Boolean(toggling?.active)}
        pending={togglePending}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
