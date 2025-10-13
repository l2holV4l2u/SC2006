"use client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toTitleCase } from "@/lib/utils";
import { Property, FairnessOutput } from "@/type";

interface PropertyCardProps {
  property: Property;
  fairness?: FairnessOutput;
}

export function PropertyCard({ property, fairness }: PropertyCardProps) {
  const getBadge = (label: string) => {
    switch (label) {
      case "Advantageous":
        return (
          <div className="px-2.5 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold inline-flex items-center gap-1 shadow-sm">
            <TrendingDown className="h-3.5 w-3.5" /> Advantageous
          </div>
        );
      case "Fair":
        return (
          <div className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold inline-flex items-center gap-1 shadow-sm">
            <Minus className="h-3.5 w-3.5" /> Fair Price
          </div>
        );
      case "Disadvantageous":
        return (
          <div className="px-2.5 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold inline-flex items-center gap-1 shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" /> Disadvantageous
          </div>
        );
      case "INSUFFICIENT_DATA":
        return (
          <div className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-semibold inline-flex items-center gap-1 shadow-sm">
            <Info className="h-3.5 w-3.5" /> Limited Data
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow gap-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {toTitleCase(property.flatType)} in {toTitleCase(property.town)}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {property.floor_area_sqm.toFixed(2)} m² •{" "}
            {property.remaining_lease_years}
          </p>
        </div>
        {fairness && <div className="ml-2">{getBadge(fairness.label)}</div>}
      </div>

      {/* Price Trend Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={property.trend.map((t: any) => ({
              month: t.date,
              price: t.avgPrice,
            }))}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => {
                const [year, month] = val.split("-");
                return new Date(`${year}-${month}-01`).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    year: "2-digit",
                  }
                );
              }}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis
              tickFormatter={(val) =>
                `${val > 0 ? "$" + (val / 1000).toFixed(0) + "k" : ""}`
              }
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(v: any) => [`$${v.toLocaleString()}`, "Price"]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Info */}
      {fairness && fairness.comps && fairness.comps.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Based on {fairness.comps.length} comparable transactions
          </p>
        </div>
      )}
    </Card>
  );
}
