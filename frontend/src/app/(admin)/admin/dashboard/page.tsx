export default function AdminDashboardPage() {
  const stats = [
    { label: "Total Users", value: "12,450", change: "+12%" },
    { label: "Active Users", value: "8,920", change: "+8%" },
    { label: "Total API Requests", value: "2.4M", change: "+24%" },
    { label: "Today's Requests", value: "85,420", change: "+15%" },
    { label: "Total Revenue", value: "$45,230", change: "+18%" },
    { label: "Monthly Revenue", value: "$12,450", change: "+22%" },
    { label: "Active Subscriptions", value: "3,420", change: "+5%" },
    { label: "Failed Requests", value: "1.2%", change: "-0.3%" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Control Center</h1>
        <p className="text-muted-foreground">Platform overview and administration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{s.value}</span>
              <span className="text-sm text-emerald-600 font-medium">{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">API Health Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "YouTube API", status: "Healthy", latency: "145ms" },
                { name: "Instagram API", status: "Healthy", latency: "182ms" },
                { name: "Facebook API", status: "Degraded", latency: "420ms" },
                { name: "TikTok API", status: "Healthy", latency: "168ms" },
              ].map((s) => (
                <div key={s.name} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.latency}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === "Healthy" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Server Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Primary Server</span>
                <span className="text-emerald-600 text-xs font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Proxy Pool</span>
                <span className="text-emerald-600 text-xs font-bold">12 active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-emerald-600 text-xs font-bold">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
