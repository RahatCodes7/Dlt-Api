export default function FAQPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-6">
              <button className="w-full text-left flex items-center justify-between text-lg font-semibold">
                How do I get started with DELETE API?
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <p className="mt-4 text-sm text-muted-foreground">Sign up for a free account, generate your API key from the dashboard, and start making requests.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
