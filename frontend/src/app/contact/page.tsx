export default function ContactPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        <p className="text-muted-foreground mb-8">Have questions? Reach out to our team.</p>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Billing</option>
                <option>Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea rows={4} className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <button className="btn-primary w-full py-3">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
