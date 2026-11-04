export default function AllAPIsPage() {
  const apis = [
    { name: "YouTube", status: "active", requests: "1.2M", price: "$0.001" },
    { name: "Instagram", status: "active", requests: "850K", price: "$0.0015" },
    { name: "Facebook", status: "active", requests: "420K", price: "$0.0012" },
    { name: "TikTok", status: "active", requests: "310K", price: "$0.001" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">All APIs</h1>
          <p className="text-muted-foreground">Manage all platform APIs.</p>
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-muted-foreground">
                <th className="py-4">API</th>
                <th className="py-4">Status</th>
                <th className="py-4">Monthly Requests</th>
                <th className="py-4">Price/Request</th>
                <th className="py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <tr key={api.name} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30">
                  <td className="py-4 font-medium">{api.name}</td>
                  <td className="py-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span></td>
                  <td className="py-4 font-mono">{api.requests}</td>
                  <td className="py-4">{api.price}</td>
                  <td className="py-4">
                    <button className="text-sm text-primary hover:underline">Configure</button>
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
