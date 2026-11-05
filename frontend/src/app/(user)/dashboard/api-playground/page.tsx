import { Play } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Playground } from "@/components/marketing/playground";

export default function APIPlaygroundPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Developer tools"
        title="API playground"
        description="Send real requests against the gateway, inspect the JSON response, and copy the equivalent cURL."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <Play className="h-3 w-3" /> Live
          </span>
        }
      />
      <Playground />
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Requests from the playground use your key if provided and count against your quota.
        Nothing is stored beyond your normal request logs.
      </div>
    </div>
  );
}
