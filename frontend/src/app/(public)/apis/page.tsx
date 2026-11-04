import Link from "next/link";

const apis: { name: string; slug: string; desc: string; icon: string; color: string }[] = [
  { name: "YouTube", slug: "youtube", desc: "Extract video information and download YouTube videos.", icon: "YT", color: "text-red-500" },
  { name: "Instagram", slug: "instagram", desc: "Get media info and download Instagram posts, reels, and stories.", icon: "IG", color: "text-purple-500" },
  { name: "Facebook", slug: "facebook", desc: "Download Facebook videos, reels, and stories.", icon: "FB", color: "text-blue-500" },
  { name: "TikTok", slug: "tiktok", desc: "Extract TikTok video information and download without watermark.", icon: "TT", color: "text-black" },
];

export default function APIsPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Available APIs</h1>
        <p className="text-muted-foreground mb-12">Access media information and downloads from all major platforms.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {apis.map((api) => (
            <Link key={api.slug} href={`/apis/${api.slug}`} className="group block p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all">
              <div className="h-14 w-14 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-6 font-bold text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {api.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{api.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{api.desc}</p>
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <span>Endpoints: 2</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 p-8 rounded-2xl bg-muted/50 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold mb-4">Unified API</h3>
          <p className="text-sm text-muted-foreground mb-4">One API key, one integration, access to all platforms.</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-white">1</span>
              <span>POST /v1/dlt/:platform/info — Get media metadata & formats</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-white">2</span>
              <span>POST /v1/dlt/:platform/download — Authorized media download</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
