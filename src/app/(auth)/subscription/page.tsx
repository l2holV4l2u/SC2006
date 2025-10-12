"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleSubscribe = async (plan: "STANDARD" | "PREMIUM") => {
    setLoading(true);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        router.push("/dashboard"); // redirect after success
      } else {
        console.error("Subscription failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-3xl w-full p-6">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Choose Your Subscription Plan
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard Plan */}
          <Card className="shadow-lg border">
            <CardHeader>
              <CardTitle>Standard</CardTitle>
              <CardDescription>Access basic features.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0 / month</p>
              <Badge className="mt-2">Free</Badge>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe("STANDARD")}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  "Continue"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="shadow-lg border border-yellow-400">
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>Unlock all premium features.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$9.99 / month</p>
              <Badge
                variant="outline"
                className="mt-2 text-yellow-600 border-yellow-500"
              >
                Most Popular
              </Badge>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                onClick={() => handleSubscribe("PREMIUM")}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  "Upgrade Now"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
