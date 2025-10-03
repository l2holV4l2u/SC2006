"use client";

import React, { useState, useEffect } from "react";
import { generateMockData, MockData } from "./mockData";
import { PropertyHeader } from "./propertyHeader";
import { PropertyDetail } from "./propertyDetail";
import { PropertyTrend } from "./propertyTrend";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PropertyPriceComparison({
  propertyId = "123",
}: {
  propertyId?: string;
}) {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(generateMockData(propertyId));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">Error loading property data</p>
      </div>
    );
  }

  const { currentProperty, priceHistory } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-primary font-medium hover:underline text-lg cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Dashboard
        </button>
        <PropertyHeader curProp={currentProperty} />
        <PropertyDetail curProp={currentProperty} />
        <PropertyTrend priceHistory={priceHistory} />
      </div>
    </div>
  );
}
