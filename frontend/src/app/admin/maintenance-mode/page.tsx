import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminMaintenanceModePage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · System" title="Maintenance mode" description="Pause the public download API with a controlled message." />
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
        While maintenance mode is enabled, POST requests to <span className="font-mono">/v1/dlt/&lt;platform&gt;/info</span> and{" "}
        <span className="font-mono">/v1/dlt/&lt;platform&gt;/download</span> return{" "}
        <span className="font-mono">503 MAINTENANCE</span> with Retry-After. Auth, dashboards and the admin API keep working.
      </div>
      <SettingsForm
        group="system"
        submitLabel="Save settings"
        fields={[
          { key: "maintenance_enabled", label: "Maintenance mode", type: "boolean", hint: "Blocks all public API traffic until turned off." },
          { key: "maintenance_message", label: "Maintenance message", type: "textarea", placeholder: "We are performing scheduled maintenance…" },
        ]}
      />
    </div>
  );
}
