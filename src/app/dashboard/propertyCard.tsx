"use client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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

export function PropertyCard({ property, fairness }: any) {
  const getBadge = (label: string) => {
    switch (label) {
      case "Advantageous":
        return (
          <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold inline-flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Advantageous
          </div>
        );
      case "Fair":
        return (
          <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold inline-flex items-center gap-1">
            <Minus className="h-3 w-3" /> Fair
          </div>
        );
      case "Disadvantageous":
        return (
          <div className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Disadvantageous
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 shadow-sm border border-gray-200 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">
            {toTitleCase(property.flatType)} in {toTitleCase(property.town)}
          </h3>
          <p className="text-sm text-gray-600">
            Avg Price: ${property.price.toLocaleString()}
          </p>
        </div>
        {fairness && getBadge(fairness.label)}
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={property.trend.map((t: any) => ({
              month: t.date,
              price: t.avgPrice,
            }))}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => {
                const [year, month] = val.split("-");
                return new Date(`${year}-${month}-01`).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    year: "numeric",
                  }
                );
              }}
              tick={{ fontSize: 14 }}
            />
            <YAxis
              tickFormatter={(val) =>
                `${(val / 1000).toFixed(0)}` + `${val != 0 ? "$" : ""}`
              }
              tick={{ fontSize: 14 }}
            />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
