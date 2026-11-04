export default function TransactionsPage() {
  const transactions = [
    { id: "TXN-001", user: "John Doe", amount: "$9.00", method: "bKash", status: "completed", date: "Oct 3, 2026" },
    { id: "TXN-002", user: "Jane Smith", amount: "$29.00", method: "SSLCommerz", status: "pending", date: "Oct 2, 2026" },
    { id: "TXN-003", user: "Bob Wilson", amount: "$9.00", method: "Nagad", status: "failed", date: "Oct 1, 2026" },
  ];

  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Transactions</h1>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-muted-foreground">
                <th className="py-4">Transaction ID</th>
                <th className="py-4">User</th>
                <th className="py-4">Amount</th>
                <th className="py-4">Method</th>
                <th className="py-4">Status</th>
                <th className="py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30">
                  <td className="py-4 font-mono">{t.id}</td>
                  <td className="py-4">{t.user}</td>
                  <td className="py-4">{t.amount}</td>
                  <td className="py-4">{t.method}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === "completed" ? "bg-emerald-100 text-emerald-700" : t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
