"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { CLUB } from "@/constants";
import Card from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import type { PublicSettings } from "@/lib/api-types";

function urlError(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "Use an http(s) link.";
    }
    return "";
  } catch {
    return "Enter a complete URL, including https://.";
  }
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await apiFetch<PublicSettings>("/settings/public");
        if (cancelled) return;
        setFormUrl(settings.membershipFormUrl ?? "");
        setPrice(String(settings.membershipPriceBdt));
      } catch {
        if (!cancelled) setError("Could not load the current settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: Record<string, string> = {};
    const invalidUrl = urlError(formUrl);
    if (invalidUrl) nextErrors.membershipFormUrl = invalidUrl;
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      nextErrors.membershipPriceBdt = "Enter a price greater than zero.";
    }

    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: {
          membershipFormUrl: formUrl.trim() === "" ? null : formUrl.trim(),
          membershipPriceBdt: numericPrice,
        },
      });
      toast.push("Membership settings saved.");
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: Record<string, string>;
      };
      setError(apiError?.message || "Save failed. Try again.");
      if (apiError?.fields) setFieldErrors(apiError.fields);
      toast.push(apiError?.message || "Save failed.", "error");
    } finally {
      setPending(false);
    }
  }

  const canTest = Boolean(formUrl.trim()) && !urlError(formUrl);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="The membership form and price shown on every member dashboard."
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <span className="h-72 animate-pulse border border-line bg-surface lg:col-span-3" />
          <span className="h-72 animate-pulse border border-line bg-surface lg:col-span-2" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <form
            onSubmit={submit}
            noValidate
            className="border border-line bg-surface p-5 sm:p-6 lg:col-span-3"
          >
            <div className="space-y-5">
              {error ? <Alert variant="error">{error}</Alert> : null}

              <div>
                <TextField
                  label="Membership form URL"
                  name="membershipFormUrl"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://forms.gle/…"
                  value={formUrl}
                  onChange={(event) => setFormUrl(event.target.value)}
                  error={fieldErrors.membershipFormUrl}
                  hint="Members open this link from the dashboard card. Leave empty to show “Membership closed”."
                />
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={!canTest}
                    onClick={() =>
                      window.open(formUrl.trim(), "_blank", "noopener,noreferrer")
                    }
                    className="inline-flex items-center gap-1.5 type-overline uppercase tracking-[0.14em] text-subtle transition-colors hover:text-text disabled:cursor-not-allowed disabled:text-faint"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    Test link
                  </button>
                </div>
              </div>

              <TextField
                label="Membership price (BDT)"
                name="membershipPriceBdt"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                error={fieldErrors.membershipPriceBdt}
                hint="One-time registration fee in whole taka. Shown on the member dashboard."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button type="submit" loading={pending}>
                {pending ? "Saving" : "Save settings"}
              </Button>
            </div>
          </form>

          <Card as="aside" padding="p-5 sm:p-6" className="lg:col-span-2">
            <p className="type-overline uppercase tracking-[0.24em] text-faint">
              Member preview
            </p>
            <div className=" mt-4 border border-line-strong bg-surface-2 p-4">
              <p className="type-overline uppercase tracking-[0.2em] text-subtle">
                Membership
              </p>
              <p className="mt-2 type-h3 font-bold text-text">
                Membership
              </p>
              <p className="type-h3 mt-3 font-bold text-text">
                {Number(price) > 0 ? price : "—"}
                <span className="ml-1.5 text-sm font-medium text-subtle">
                  BDT
                </span>
              </p>
              <p className="mt-3 type-body-sm text-subtle">
                One-time fee, valid through the member&apos;s HSC years.
              </p>
              <p className="mt-2 type-caption text-faint">
                {canTest
                  ? "Members see the join button on their dashboard."
                  : "No live form link yet, so members see the closed state."}
              </p>
            </div>
            <p className="mt-4 type-caption leading-snug text-faint">
              Changing the price updates the dashboard membership card. It does
              not edit any responses already collected in the form.
            </p>
            <div className="mt-6 border-t border-line pt-4">
              <p className="type-overline uppercase tracking-[0.24em] text-faint">
                Build
              </p>
              <p className="mt-2 type-body-sm text-subtle">
                Version <span className="text-text">v{CLUB.VERSION}</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
