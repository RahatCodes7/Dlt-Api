export default function StatusPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Status</h1>
        <p className="text-muted-foreground mb-8">Real-time status of all DELETE API services.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[["YouTube API", "Operational"], ["Instagram API", "Operational"], ["Facebook API", "Operational"], ["TikTok API", "Operational"]].map(([name, status]) => (
            <div key={name} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-card flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground">REST API</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === "Operational" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-12 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
          <h3 className="font-bold mb-4">Incident History</h3>
          <p className="text-sm text-muted-foreground">No incidents reported in the last 30 days.</p>
        </div>
      </div>
    </div>
  );
}
