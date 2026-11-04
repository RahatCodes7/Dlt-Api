export default function OverviewPage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back, Developer. Here's your API activity summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total API Requests</p>
              <p className="text-2xl font-bold">12,450</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">+12% vs last month</p>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Successful Requests</p>
              <p className="text-2xl font-bold">11,892</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">95.5% success rate</p>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed Requests</p>
              <p className="text-2xl font-bold">558</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">4.5% error rate</p>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Remaining Quota</p>
              <p className="text-2xl font-bold">87,550</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Resets in 14 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">API Usage Chart</h3>
            <div className="h-64 bg-muted rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
              <p className="text-muted-foreground">Usage chart visualization</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Recent API Activity</h3>
            <div className="space-y-4">
              {[
                { platform: "YouTube", endpoint: "/info", status: 200, time: "2m ago" },
                { platform: "Instagram", endpoint: "/download", status: 200, time: "15m ago" },
                { platform: "Facebook", endpoint: "/info", status: 429, time: "1h ago" },
                { platform: "TikTok", endpoint: "/download", status: 200, time: "3h ago" },
              ].map((a) => (
                <div key={a.platform + a.time} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{a.platform.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{a.platform}</p>
                      <p className="text-xs text-muted-foreground font-mono">{a.endpoint}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${a.status === 200 ? "text-emerald-600" : "text-rose-600"}`}>{a.status}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
