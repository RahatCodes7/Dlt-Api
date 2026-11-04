import Link from "next/link";

const sections = [
  { id: "getting-started", title: "Getting Started", desc: "Introduction, Quick Start, Authentication" },
  { id: "youtube", title: "YouTube API", desc: "Video Information, Download" },
  { id: "instagram", title: "Instagram API", desc: "Media Information, Download" },
  { id: "facebook", title: "Facebook API", desc: "Video Information, Download" },
  { id: "tiktok", title: "TikTok API", desc: "Video Information, Download" },
  { id: "advanced", title: "Advanced", desc: "Rate Limits, Error Codes, Response Format, Best Practices" },
  { id: "sdk", title: "SDK & Examples", desc: "JavaScript, Python, PHP, cURL" },
];

export default function DocumentationPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 hidden lg:block space-y-4">
            <h3 className="font-bold text-lg mb-4">Documentation</h3>
            <nav className="space-y-2">
              {sections.map((s) => (
                <Link key={s.id} href={`/documentation/${s.id}`} className="block px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted hover:text-primary">
                  {s.title}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="lg:w-3/4">
            <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
            <p className="text-muted-foreground mb-8">Comprehensive guide to integrating with DELETE API Platform.</p>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-8">
              <h2 className="text-xl font-bold mb-4">Quick Start</h2>
              <p className="mb-4">Get started in 3 simple steps:</p>
              <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground mb-8">
                <li>Create an account at <Link href="/register">DELETE API Platform</Link></li>
                <li>Generate an API key from your dashboard</li>
                <li>Make your first request to any platform endpoint</li>
              </ol>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-8"><code className="font-mono">{`curl -X POST https://api.deleteapi.com/v1/dlt/youtube/info \\
  -H "Authorization: Bearer dl_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'`}</code></pre>
              <h3 className="font-bold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground">All requests require a Bearer token in the Authorization header.</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
