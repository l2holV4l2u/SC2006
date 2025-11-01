"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successPlanName, setSuccessPlanName] = useState<string>("");
  const { data: session } = useSession();

  const handleSubscribe = async (plan: PlanId, planName: string) => {
    setLoading(true);
    setSelectedPlan(plan);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update subscription");

      // Show success page
      setSuccessPlanName(planName);
      setShowSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      // Show error toast
      toast.error("Subscription Failed");
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
        "Basic filters",
        "Price Fairness Analysis",
      ],
      buttonText: "Get Started Free",
      popular: false,
    },
    {
      id: "PREMIUM",
      name: "Premium",
      description: "Unlock powerful tools for comprehensive HDB price analysis",
      price: "$9.99",
      period: "month",
      icon: Sparkles,
      features: [
        "Everything in Standard",
        "Unlimited Data Export",
        "Price Heatmap",
        "Advanced filters",
      ],
      buttonText: "Upgrade to Premium",
      popular: true,
      highlight: true,
    },
  ];

  // Success Screen
  if (showSuccess) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-6 animate-bounce">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">Success!</h1>

          <p className="text-slate-600 mb-6">
            You've successfully subscribed to the{" "}
            <span className="font-semibold text-slate-900">
              {successPlanName}
            </span>{" "}
            plan.
          </p>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-6">
            <p className="text-sm text-slate-600">
              Redirecting to your dashboard...
            </p>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-green-600 h-1.5 rounded-full animate-progress"
                style={{
                  animation: "progress 2s ease-in-out forwards",
                }}
              ></div>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Go to Dashboard Now
          </Button>
        </div>

        <style>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Main Subscription Page
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
            const isCurrentPlan = session?.user.role === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col h-full ${
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

                <CardHeader className="flex items-center gap-3 mb-4">
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
                    <CardTitle className="text-xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      {plan.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-slate-600 text-sm">
                      / {plan.period}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
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
                        <span className="text-slate-700 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                        : "bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={loading || isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      <span className="flex items-center justify-center">
                        <Check className="h-4 w-4 mr-2" /> Current Plan
                      </span>
                    ) : isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />{" "}
                        Processing...
                      </span>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Trust Signals */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" /> No credit card
              required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" /> Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" /> 30-day money-back
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
