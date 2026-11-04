export default function PlaygroundPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Playground</h1>
        <p className="text-muted-foreground mb-8">Test DELETE API endpoints directly from your browser.</p>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-8">
          <h2 className="text-xl font-bold mb-6">Coming Soon</h2>
          <p className="text-muted-foreground">The interactive API Playground will allow you to test endpoints directly from the browser. Log in to your account to access the full playground.</p>
          <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">Need API access?</h3>
            <p className="text-sm text-blue-800">Sign up for a free account to get your API key and start testing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
