export default function AllPlansPage() {
  const plans = [
    { name: "Free", price: "$0", requests: "100/month", status: "active" },
    { name: "Starter", price: "$9", requests: "5,000/month", status: "active" },
    { name: "Pro", price: "$29", requests: "25,000/month", status: "active" },
    { name: "Enterprise", price: "Custom", requests: "Unlimited", status: "active" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans.</p>
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-muted-foreground">
                <th className="py-4">Plan</th>
                <th className="py-4">Price</th>
                <th className="py-4">Monthly Requests</th>
                <th className="py-4">Status</th>
                <th className="py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.name} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30">
                  <td className="py-4 font-medium">{p.name}</td>
                  <td className="py-4 font-bold">{p.price}</td>
                  <td className="py-4">{p.requests}</td>
                  <td className="py-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span></td>
                  <td className="py-4"><button className="text-sm text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
