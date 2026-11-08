import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminGeneralSettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · Settings" title="General settings" description="Platform name, locale, timezone, and support contact." />
      <SettingsForm
        group="general"
        fields={[
          { key: "platform_name", label: "Platform name", placeholder: "DLT API Platform" },
          { key: "support_email", label: "Support email", type: "email", placeholder: "support@yourdomain.com" },
          { key: "timezone", label: "Timezone", placeholder: "UTC" },
          { key: "locale", label: "Locale", placeholder: "en-US" },
        ]}
      />
    </div>
  );
}
