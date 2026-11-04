export default function QuickStartPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Quick Start</h1>
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <h3 className="font-bold text-lg mb-4">Get started in 3 steps</h3>
        <ol className="list-decimal list-inside space-y-4 text-sm text-muted-foreground max-w-md">
          <li>Generate an API key from <a href="/dashboard/api-keys" className="text-primary hover:underline">API Keys</a></li>
          <li>Choose your platform and endpoint</li>
          <li>Make your first request</li>
        </ol>
        <pre className="mt-6 bg-muted p-4 rounded-lg text-sm overflow-x-auto"><code className="font-mono">{`POST /v1/dlt/youtube/info
Authorization: Bearer dl_live_your_key

{
  "url": "https://youtube.com/watch?v=..."
}`}</code></pre>
      </div>
    </div>
  );
}
