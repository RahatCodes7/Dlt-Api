import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminSeoPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin · Website" title="SEO settings" description="Meta titles, descriptions, and canonical URLs." />
      <SettingsForm
        group="seo"
        submitLabel="Save SEO"
        fields={[
          { key: "meta_title", label: "Meta title", placeholder: "DELETE API — Download APIs" },
          { key: "meta_description", label: "Meta description", type: "textarea", placeholder: "Professional download APIs…" },
          { key: "canonical_url", label: "Canonical URL", type: "url", placeholder: "https://dltapi.cc.cd" },
        ]}
      />
    </div>
  );
}
