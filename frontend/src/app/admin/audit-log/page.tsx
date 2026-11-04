"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import PageHeader from "@/components/admin/PageHeader";
import Alert from "@/components/ui/Alert";
import { apiFetch } from "@/lib/api";
import type { AuditEntry } from "@/lib/api-types";

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanAction(action: string) {
  return action
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<{ role: string }>("/admin/auth/me");
        if (me.role !== "super_admin") {
          router.replace("/admin");
          return;
        }
        const data = await apiFetch<AuditEntry[]>(
          "/super-admin/audit-log?limit=100"
        );
        if (cancelled) return;
        setItems(
          [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        const apiError = err as { message?: string; status?: number };
        if (!cancelled && apiError?.status !== 401) {
          setError(apiError?.message || "Failed to load the audit log.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((entry) =>
      `${entry.action} ${entry.actorAdminId ?? "system"} ${entry.targetType ?? ""} ${
        entry.targetId ?? ""
      }`
        .toLowerCase()
        .includes(needle)
    );
  }, [items, query]);

  const columns: Column<AuditEntry>[] = [
    {
      key: "action",
      header: "Action",
      mobilePrimary: true,
      render: (entry) => (
        <span className="flex flex-col">
          <span className="type-body-sm font-semibold text-text">
            {humanAction(entry.action)}
          </span>
          <span className="mt-0.5 type-overline uppercase tracking-[0.12em] text-faint">
            {entry.action}
          </span>
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (entry) => (
        <span className="type-body-sm text-muted">
          {entry.actorAdminId === null ? "System" : `Admin ${entry.actorAdminId.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (entry) =>
        entry.targetType ? (
          <span className="type-body-sm text-subtle">
            {entry.targetType}
            {entry.targetId !== null ? ` #${entry.targetId}` : ""}
          </span>
        ) : (
          <span className="type-body-sm text-faint">—</span>
        ),
    },
    {
      key: "time",
      header: "When",
      render: (entry) => (
        <span className="whitespace-nowrap type-body-sm text-subtle">
          {formatStamp(entry.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Super admin"
        title="Audit log"
        description="Account, content, and slot changes, newest first. The console requests the most recent 100 entries."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-surface px-4 py-2.5">
        <p className="type-body-sm text-subtle">
          <span className="type-overline text-text">{items.length}</span>{" "}
          recorded {items.length === 1 ? "entry" : "entries"}
        </p>
        <p className="type-overline uppercase tracking-[0.16em] text-faint">
          Read only
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getKey={(entry) => entry.id}
        loading={loading}
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search action, actor, or target…"
        emptyTitle={items.length === 0 ? "Nothing logged yet" : "No matches"}
        emptyDescription={
          items.length === 0
            ? "Actions taken in the console will appear here."
            : "Try a different search term."
        }
        caption="Audit log entries"
      />
    </div>
  );
}
