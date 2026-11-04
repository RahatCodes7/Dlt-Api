import Link from "next/link";

interface PlatformAPIProps {
  name: string;
  slug: string;
  color: string;
  icon: string;
  endpoints: { method: string; path: string; desc: string }[];
}

export default function PlatformAPIPage({ params }: { params: { slug: string } }) {
  const platforms: Record<string, PlatformAPIProps> = {
    youtube: {
      name: "YouTube", slug: "youtube", color: "text-red-500", icon: "YT",
      endpoints: [
        { method: "POST", path: "/info", desc: "Get video title, duration, thumbnail, and available formats." },
        { method: "POST", path: "/download", desc: "Download YouTube video in best available quality." },
      ],
    },
    instagram: {
      name: "Instagram", slug: "instagram", color: "text-purple-500", icon: "IG",
      endpoints: [
        { method: "POST", path: "/info", desc: "Get post/reel/story media info and dimensions." },
        { method: "POST", path: "/download", desc: "Download Instagram media without watermark." },
      ],
    },
    facebook: {
      name: "Facebook", slug: "facebook", color: "text-blue-500", icon: "FB",
      endpoints: [
        { method: "POST", path: "/info", desc: "Get Facebook video/reel metadata." },
        { method: "POST", path: "/download", desc: "Download Facebook videos in MP4 format." },
      ],
    },
    tiktok: {
      name: "TikTok", slug: "tiktok", color: "text-black", icon: "TT",
      endpoints: [
        { method: "POST", path: "/info", desc: "Get TikTok video metadata and author info." },
        { method: "POST", path: "/download", desc: "Download TikTok videos without watermark." },
      ],
    },
  };

  const api = platforms[params.slug];
  if (!api) return <div className="px-4 py-12">Platform not found</div>;

  return (
    <div className="px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className={`h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl`}>{api.icon}</div>
          <div>
            <h1 className="text-3xl font-bold">{api.name} API</h1>
            <p className="text-muted-foreground">Media information and download API for {api.name}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-8">
              <h2 className="text-xl font-bold mb-6">Endpoints</h2>
              <div className="space-y-4">
                {api.endpoints.map((ep, i) => (
                  <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-700">{ep.method}</span>
                      <span className="text-xs font-mono text-muted-foreground">/v1/dlt/{api.slug}{ep.path}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-8">
              <h2 className="text-xl font-bold mb-6">Request Example</h2>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto"><code>{`POST /v1/dlt/${api.slug}/info
Authorization: Bearer dl_live_your_key

{
  "url": "https://${api.slug}.com/..."}`}</code></pre>
            </section>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-6">
              <h3 className="font-bold mb-4">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">All API requests require a Bearer token in the Authorization header.</p>
              <div className="bg-muted p-3 rounded text-xs font-mono text-muted-foreground">
                Authorization: Bearer dl_live_xxxxx
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-6">
              <h3 className="font-bold mb-4">Rate Limits</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Free: 30 req/min (info), 10 req/min (download)</li>
                <li>Starter: 100 req/min (info), 30 req/min (download)</li>
                <li>Pro: 300 req/min (info), 60 req/min (download)</li>
              </ul>
            </div>
            <Link href="/playground" className="w-full btn-primary">
              Try in Playground
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
