"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";

type PlanId = "STANDARD" | "PREMIUM";

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: string;
  period: string;
  icon: typeof Zap | typeof Sparkles;
  features: string[];
  buttonText: string;
  popular: boolean;
  highlight?: boolean;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const handleSubscribe = async (plan: PlanId) => {
    setLoading(true);
    setSelectedPlan(plan);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update subscription");
      }

      alert(`Successfully subscribed to ${plan} plan!`);
      // Optionally reload the page or update UI state
      window.location.reload();
    } catch (error) {
      console.error("Subscription error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update subscription"
      );
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const plans: Plan[] = [
    {
      id: "STANDARD",
      name: "Standard",
      description: "Perfect for getting started",
      price: "$0",
      period: "forever",
      icon: Zap,
      features: [
        "Access to basic features",
        "Community support",
        "Up to 5 projects",
        "Basic analytics",
      ],
      buttonText: "Get Started Free",
      popular: false,
    },
    {
      id: "PREMIUM",
      name: "Premium",
      description: "For professionals who need more",
      price: "$9.99",
      period: "month",
      icon: Sparkles,
      features: [
        "Everything in Standard",
        "Unlimited projects",
        "Priority support",
        "Advanced analytics",
        "Custom integrations",
        "Team collaboration",
      ],
      buttonText: "Upgrade to Premium",
      popular: true,
      highlight: true,
    },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium mb-3">
            Pricing
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-sm text-slate-600">
            Start free and upgrade as you grow. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loading && selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl p-6 transition-all ${
                  plan.highlight
                    ? "border-2 border-indigo-500 shadow-xl"
                    : "border border-slate-200 shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-medium shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      plan.highlight ? "bg-indigo-100" : "bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        plan.highlight ? "text-indigo-600" : "text-slate-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-slate-600">{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-600 text-sm">
                    / {plan.period}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 flex-shrink-0 ${
                          plan.highlight ? "bg-indigo-100" : "bg-slate-100"
                        }`}
                      >
                        <Check
                          className={`h-3.5 w-3.5 ${
                            plan.highlight
                              ? "text-indigo-600"
                              : "text-slate-600"
                          }`}
                        />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full h-11 text-sm font-semibold rounded-lg transition-all ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                      : "bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </span>
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust Signals */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              30-day money-back
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
