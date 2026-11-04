import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: 0,
    interval: "/mo",
    description: "For testing and personal projects.",
    features: ["100 requests/month", "All 4 platforms", "Info + download endpoints", "Community support"],
    featured: false,
    cta: "Get Started",
    href: "/register",
  },
  {
    name: "Starter",
    price: 9,
    interval: "/mo",
    description: "For indie developers and small projects.",
    features: ["5,000 requests/month", "All 4 platforms", "Priority rate limits", "Email support"],
    featured: true,
    cta: "Subscribe",
    href: "/register",
  },
  {
    name: "Pro",
    price: 29,
    interval: "/mo",
    description: "For growing teams and production apps.",
    features: ["25,000 requests/month", "All 4 platforms", "Proxy rotation", "Priority support"],
    featured: false,
    cta: "Subscribe",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: null,
    interval: "",
    description: "For high-volume platforms.",
    features: ["Unlimited requests", "All platforms + custom", "Dedicated proxies", "SLA + 24/7 support"],
    featured: false,
    cta: "Contact Sales",
    href: "/contact",
  },
];

export default function PricingPage() {
  return (
    <div className="px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">Choose individual platform APIs or bundle them all. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-8 rounded-2xl border ${plan.featured ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 dark:border-gray-700 bg-card"}`}>
              {plan.featured && (
                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span className="px-2 py-1 bg-primary/10 rounded">Most Popular</span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                {plan.price === null ? (
                  <span className="text-3xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.interval}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
              <ul className="space-y-3 text-sm mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={`w-full py-3 rounded-xl font-medium transition-colors ${plan.featured ? "bg-primary text-primary-foreground" : "bg-background border border-gray-200 dark:border-gray-700 text-foreground"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
