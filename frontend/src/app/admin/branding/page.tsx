import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminBrandingPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · Website" title="Branding" description="Logo, accent colors, and brand identity stored on the platform." />
      <SettingsForm
        group="branding"
        submitLabel="Save branding"
        fields={[
          { key: "brand_name", label: "Brand name", placeholder: "DELETE API" },
          { key: "primary_color", label: "Primary color", type: "color", hint: "Main accent used for buttons and links." },
          { key: "accent_color", label: "Accent color", type: "color", hint: "Secondary accent (badges, highlights)." },
        ]}
      />
    </div>
  );
}
