"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
} from "recharts";
import { generateMockData, MockData } from "./mockData";
import { PropertyHeader } from "./propertyHeader";
import { MapView } from "./mapView";
import { StatsSidebar } from "./statsSidebar";

export type TabId = "comparison" | "history" | "scatter" | "map";

interface PropertyPriceComparisonProps {
  propertyId?: string;
}

export default function PropertyPriceComparison({
  propertyId = "123",
}: PropertyPriceComparisonProps) {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabId>("comparison");

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

  const { currentProperty, similarProperties, priceHistory } = data;
  const avgPrice =
    similarProperties.reduce((sum, prop) => sum + prop.price, 0) /
    similarProperties.length;
  const priceVsMarket = (
    ((currentProperty.price - avgPrice) / avgPrice) *
    100
  ).toFixed(1);

  const tabs = [
    { id: "comparison" as TabId, label: "Price Comparison" },
    { id: "history" as TabId, label: "Price History" },
    { id: "scatter" as TabId, label: "Market Analysis" },
    { id: "map" as TabId, label: "Map View" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <PropertyHeader
          currentProperty={currentProperty}
          priceVsMarket={priceVsMarket}
        />

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            {activeTab === "comparison" && (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={similarProperties.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="address"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Price",
                    ]}
                  />
                  <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === "history" && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value: number) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentProperty"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="This Property"
                  />
                  <Line
                    type="monotone"
                    dataKey="marketAverage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Market Average"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeTab === "scatter" && (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={similarProperties}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sqft" name="Square Footage" />
                  <YAxis dataKey="price" name="Price" />
                  <Tooltip />
                  <Scatter dataKey="price" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {activeTab === "map" && (
              <MapView
                currentProperty={currentProperty}
                similarProperties={similarProperties}
              />
            )}
          </div>

          {/* Sidebar */}
          <StatsSidebar
            currentProperty={currentProperty}
            avgPrice={avgPrice}
            similarProperties={similarProperties}
          />
        </div>
      </div>
    </div>
  );
}
