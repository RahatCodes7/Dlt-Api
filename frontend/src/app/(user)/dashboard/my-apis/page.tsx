export default function MyAPIsPage() {
  const apis = [
    { name: "YouTube API", status: "active", plan: "Starter", requests: "4,230", expiring: "Oct 15, 2026" },
    { name: "Instagram API", status: "active", plan: "Free", requests: "89", expiring: "N/A" },
    { name: "Facebook API", status: "expired", plan: "Starter", requests: "0", expiring: "Sep 1, 2026" },
    { name: "TikTok API", status: "active", plan: "Free", requests: "12", expiring: "N/A" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My APIs</h1>
        <p className="text-muted-foreground">View and manage your API subscriptions.</p>
      </div>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-muted-foreground">
                <th className="pb-4">API</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Plan</th>
                <th className="pb-4">Requests This Month</th>
                <th className="pb-4">Subscription Expires</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <tr key={api.name} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30 transition-colors">
                  <td className="py-4 font-medium">{api.name}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${api.status === "active" ? "bg-emerald-100 text-emerald-700" : api.status === "expired" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {api.status.charAt(0).toUpperCase() + api.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4">{api.plan}</td>
                  <td className="py-4 font-mono text-sm">{api.requests}</td>
                  <td className="py-4">{api.expiring}</td>
                  <td className="py-4">
                    <button className="text-primary hover:text-primary/80 font-medium">{api.status === "active" ? "Manage" : "Renew"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
