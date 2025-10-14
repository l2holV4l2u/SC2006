"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Info, Download } from "lucide-react";
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
import * as XLSX from "xlsx";

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

  const exportToExcel = () => {
    // Prepare the data for Excel export
    const exportData = property.trend.map((t) => ({
      Town: toTitleCase(property.town),
      "Flat Type": toTitleCase(property.flatType),
      Month: t.date,
      "Average Price": t.avgPrice,
      "Floor Area (sqm)": t.floor_area_sqm,
      "Remaining Lease": t.remaining_lease_years,
      "Storey Range": t.storey_range,
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    ws["!cols"] = [
      { wch: 30 }, // Title
      { wch: 15 }, // Town
      { wch: 12 }, // Flat Type
      { wch: 10 }, // Month
      { wch: 15 }, // Average Price
      { wch: 15 }, // Floor Area
      { wch: 20 }, // Remaining Lease
      { wch: 15 }, // Storey Range
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Property Data");

    // Generate filename
    const filename = `${property.flatType}_${property.town}_${property.date}.xlsx`;

    // Save the file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Card className="group p-4 shadow-sm border border-gray-200 bg-white hover:shadow-md hover:border-blue-500 transition-all gap-4">
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
        <div className="flex flex-col items-end gap-2">
          {fairness && getBadge(fairness.label)}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
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
    </Card>
  );
}
