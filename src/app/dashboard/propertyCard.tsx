"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Download,
  Loader2,
} from "lucide-react";
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
import { Property } from "@/type";
import * as XLSX from "xlsx";
import { useAtomValue } from "jotai";
import { fairnessLoadingAtom, fairnessMapAtom } from "@/lib/propertyAtom";
import { useSession } from "next-auth/react";

export function PropertyCard({ property }: { property: Property }) {
  const { data: session } = useSession();
  const isPremium = session?.user?.role == "PREMIUM" || false;

  const fairnessLoading = useAtomValue(fairnessLoadingAtom);
  const fairnessMap = useAtomValue(fairnessMapAtom);
  const fairness = fairnessMap[property.id];

  const getBadge = (label: string) => {
    switch (label) {
      case "Advantageous":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            <TrendingDown /> Advantageous
          </Badge>
        );
      case "Fair":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
          >
            <Minus /> Fair Price
          </Badge>
        );
      case "Disadvantageous":
        return (
          <Badge
            variant="default"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            <TrendingUp /> Disadvantageous
          </Badge>
        );
      case "INSUFFICIENT_DATA":
        return (
          <Badge variant="secondary">
            <Info /> Limited Data
          </Badge>
        );
      default:
        return null;
    }
  };

  const exportToExcel = () => {
    const exportData = property.trend.map((t) => ({
      Town: toTitleCase(property.town),
      "Flat Type": toTitleCase(property.flatType),
      Month: t.date,
      "Average Price": t.avgPrice,
      "Floor Area (sqm)": t.floor_area_sqm,
      "Remaining Lease": t.remaining_lease_years,
      "Storey Range": t.storey_range,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Property Data");

    const filename = `${property.flatType}_${property.town}_${property.date}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <Card className="group p-4 shadow-sm border border-gray-200 bg-white hover:shadow-md hover:border-blue-500 transition-all gap-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
            {toTitleCase(property.flatType)} in {toTitleCase(property.town)}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {property.floor_area_sqm.toFixed(2)} m² •{" "}
            {property.remaining_lease_years}
          </p>
          {fairnessLoading ? (
            <Badge className="text-white">
              <Loader2 className="animate-spin" /> Loading
            </Badge>
          ) : (
            fairness && getBadge(fairness.label)
          )}
        </div>
        {isPremium && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
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
                  { month: "short", year: "2-digit" }
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
              stroke="var(--secondary)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--secondary)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
