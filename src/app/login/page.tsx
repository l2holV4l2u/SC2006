"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  TrendingUp,
  MapPin,
  BarChart3,
  ArrowRight,
  Shield,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const { status } = useSession(); // client-side session
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading")
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <TrendingUp size={40} strokeWidth={2} className="text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">HDB Analytics</h3>
            <p className="text-sm text-gray-600">
              Preparing your experience...
            </p>
          </div>
        </div>
      </div>
    );

  const features = [
    {
      icon: TrendingUp,
      title: "Real-Time Insights",
      description: "Latest HDB resale data",
    },
    {
      icon: MapPin,
      title: "Location Analysis",
      description: "Compare neighborhoods",
    },
    {
      icon: BarChart3,
      title: "Price Fairness Analysis",
      description:
        "Analyze HDB resale prices for fairness across neighborhoods",
    },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden md:block space-y-4">
          <div className="space-y-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <TrendingUp /> HDB Analytics
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              Smart HDB Resale
              <span className="block text-blue-600">Price Analysis</span>
            </h1>
            <p className="text-sm text-gray-600">
              Make confident decisions with comprehensive HDB market data.
            </p>
          </div>

          <div className="space-y-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2.5 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-blue-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">$485K</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Q4 2024</p>
                <p className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +3.2%
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map((i) => {
                const seed = Math.random().toString(36).substring(2, 10);
                const avatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}&size=48`;
                return (
                  <img
                    key={i}
                    src={avatarUrl}
                    alt="Homeowner Avatar"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                );
              })}
            </div>
            <span>
              <span className="font-semibold text-gray-900">5,000+</span>{" "}
              homeowners
            </span>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border-gray-200 shadow-2xl bg-white">
            <CardHeader className="space-y-2 pt-5 pb-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp size={32} strokeWidth={2} className="text-white" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-6 py-3">
              <Button
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full h-10 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm hover:shadow-md transition-all font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? "Signing in..." : "Continue with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500 font-medium">
                    TRUSTED & SECURE
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-2.5 space-y-1.5 border border-blue-200">
                <div className="flex items-center gap-2 text-xs text-gray-900">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  <span>Your data is secure and private</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-900">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span>Updated daily with data.gov.sg data</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 px-6 pb-5">
              <p className="text-xs text-center text-gray-500">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
              <Button className="text-blue-600 hover:text-blue-700 text-sm font-medium p-0 h-auto bg-transparent border-none hover:bg-transparent group">
                Learn more
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Mobile Features */}
        <div className="md:hidden space-y-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-2.5 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200"
              >
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
