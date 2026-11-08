import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminHomepagePage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · Website" title="Homepage settings" description="Hero copy and call-to-action links shown on the public homepage." />
      <SettingsForm
        group="homepage"
        submitLabel="Save homepage"
        fields={[
          { key: "hero_title", label: "Hero title", placeholder: "Download APIs for every platform" },
          { key: "hero_subtitle", label: "Hero subtitle", type: "textarea", placeholder: "One consistent API…" },
          { key: "hero_primary_cta_label", label: "Primary CTA label", placeholder: "Get API access" },
          { key: "hero_primary_cta_href", label: "Primary CTA link", placeholder: "/register" },
          { key: "hero_secondary_cta_label", label: "Secondary CTA label", placeholder: "Read the docs" },
          { key: "hero_secondary_cta_href", label: "Secondary CTA link", placeholder: "/documentation" },
        ]}
      />
    </div>
  );
}
