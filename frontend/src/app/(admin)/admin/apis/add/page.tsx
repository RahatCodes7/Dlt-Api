export default function AddAPIPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Add New API</h1>
      <div className="max-w-2xl p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <h3 className="font-bold text-lg mb-6">Register New API Platform</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform Name</label>
            <input type="text" className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input type="text" className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price Per Request</label>
            <input type="text" className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <button className="btn-primary w-full py-3">Add API</button>
        </form>
      </div>
    </div>
  );
}
