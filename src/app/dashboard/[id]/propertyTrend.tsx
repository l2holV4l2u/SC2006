import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PriceHistoryData } from "./mockData";
import { Card } from "@/components/ui/card";
import { ChartSpline } from "lucide-react";

export function PropertyTrend({
  priceHistory,
}: {
  priceHistory: PriceHistoryData[];
}) {
  return (
    <Card>
      <h2 className="text-lg font-semibold flex items-center">
        <ChartSpline className="h-5 w-5 mr-2 text-primary" /> Trend
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={priceHistory}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
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
    </Card>
  );
}
