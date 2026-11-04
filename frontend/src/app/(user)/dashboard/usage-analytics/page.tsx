export default function UsageAnalyticsPage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground">Track your API usage across platforms.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Daily Requests</h3>
            <div className="h-64 bg-muted rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
              <p className="text-muted-foreground">Chart visualization area</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Platform Usage</h3>
            <div className="space-y-4">
              {[
                { name: "YouTube", pct: 45, color: "bg-red-500" },
                { name: "Instagram", pct: 30, color: "bg-purple-500" },
                { name: "Facebook", pct: 15, color: "bg-blue-500" },
                { name: "TikTok", pct: 10, color: "bg-black" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-12">{p.name}</div>
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-mono">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Success Rate</h3>
            <p className="text-3xl font-bold">95.5%</p>
            <p className="text-sm text-muted-foreground mt-2">Last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
