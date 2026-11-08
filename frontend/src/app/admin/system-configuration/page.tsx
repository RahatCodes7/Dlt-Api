import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminSystemConfigurationPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · Settings" title="System configuration" description="Feature flags and platform-wide controls stored on the server." />
      <SettingsForm
        group="system"
        submitLabel="Save configuration"
        fields={[
          { key: "signup_enabled", label: "Open registration", type: "boolean", hint: "When off, new email and Google sign-ups are rejected." },
          { key: "maintenance_enabled", label: "Maintenance mode", type: "boolean", hint: "Blocks POST /v1/dlt/<platform>/info and /download." },
          { key: "maintenance_message", label: "Maintenance message", type: "textarea" },
        ]}
      />
    </div>
  );
}
