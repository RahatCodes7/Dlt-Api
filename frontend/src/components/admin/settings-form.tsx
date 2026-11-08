"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "boolean" | "color" | "email" | "url";
  placeholder?: string;
  hint?: string;
}

interface SitePayload {
  group: string;
  values: Record<string, string>;
}

/**
 * Generic form for the backend-backed SystemSetting groups exposed at
 * GET/PUT /v1/admin/site/{group}. Every field persists to the database.
 */
export function SettingsForm({
  group,
  fields,
  submitLabel = "Save changes",
}: {
  group: string;
  fields: FieldDef[];
  submitLabel?: string;
}) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<SitePayload>(`/v1/admin/site/${group}`);
        setValues(data.values ?? {});
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load settings");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [group]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await apiFetch<SitePayload>(`/v1/admin/site/${group}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setValues(data.values ?? values);
      setNotice("Saved.");
      setTimeout(() => setNotice(""), 2400);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isTruthy = (value: string | undefined) =>
    ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());

  return (
    <form onSubmit={submit} className="surface space-y-5 p-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
          {notice}
        </div>
      )}
      {fields.map((field) => {
        const value = values[field.key] ?? "";
        if (field.type === "boolean") {
          const checked = isTruthy(value);
          return (
            <label
              key={field.key}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-4"
            >
              <span>
                <span className="block text-sm font-semibold">{field.label}</span>
                {field.hint && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{field.hint}</span>
                )}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => setValues((prev) => ({ ...prev, [field.key]: checked ? "false" : "true" }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
            </label>
          );
        }
        const inputType = field.type === "number" || field.type === "color" || field.type === "email" || field.type === "url" ? field.type : "text";
        return (
          <label key={field.key} className="block">
            <span className="text-sm font-semibold">{field.label}</span>
            {field.hint && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{field.hint}</span>
            )}
            {field.type === "textarea" ? (
              <textarea
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : (
              <input
                type={inputType}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            )}
          </label>
        );
      })}
      <div className="flex justify-end border-t border-border pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
