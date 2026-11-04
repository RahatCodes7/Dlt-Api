export default function AllUsersPage() {
  const users = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "user", status: "active", joined: "Oct 1, 2026" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user", status: "active", joined: "Sep 28, 2026" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "user", status: "suspended", joined: "Sep 25, 2026" },
    { id: "4", name: "Alice Chen", email: "alice@example.com", role: "admin", status: "active", joined: "Sep 20, 2026" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Users</h1>
          <p className="text-muted-foreground">Manage platform users.</p>
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-muted-foreground">
                <th className="py-4">User</th>
                <th className="py-4">Email</th>
                <th className="py-4">Role</th>
                <th className="py-4">Status</th>
                <th className="py-4">Joined</th>
                <th className="py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30">
                  <td className="py-4 font-medium">{u.name}</td>
                  <td className="py-4">{u.email}</td>
                  <td className="py-4">{u.role}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4">{u.joined}</td>
                  <td className="py-4">
                    <button className="text-sm text-primary hover:underline">View Details</button>
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
