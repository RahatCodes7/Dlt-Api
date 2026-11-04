export default function MySubscriptionPage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Subscription</h1>
        <p className="text-muted-foreground">Manage your billing and subscription.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Current Plan</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">S</div>
              <div>
                <h3 className="font-bold">Starter</h3>
                <p className="text-sm text-muted-foreground">$9/month</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Billing</span>
                <span className="font-medium">Oct 15, 2026</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Requests Used</span>
                <span className="font-medium">4,230 / 5,000</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
            <h3 className="font-bold text-lg mb-6">Upgrade Plan</h3>
            <button className="w-full btn-primary mb-4">Upgrade to Pro</button>
            <button className="w-full btn-outline">Cancel Subscription</button>
          </div>
        </div>
      </div>
    </div>
  );
}
