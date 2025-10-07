"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SortDesc } from "lucide-react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { Property } from "@/type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Input } from "@/components/ui/input";
import { toTitleCase } from "@/lib/utils";

type FairnessResponse = {
  fair_price: number;
  band_low: number;
  band_high: number;
  dev_pct: number | null;
  label: "Fair" | "Advantageous" | "Disadvantageous" | "INSUFFICIENT_DATA";
};

export default function PropertyListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);

  const [askingPrice, setAskingPrice] = useState<string>("");
  const [town, setTown] = useState<string>("");
  const [flatType, setFlatType] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("price-asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fairness map
  const [fairnessMap, setFairnessMap] = useState<
    Record<string, FairnessResponse>
  >({});

  const fetchProperties = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (town) params.append("town", town);
    if (flatType) params.append("flatType", flatType);
    if (sortBy) params.append("sortBy", sortBy);
    params.append("page", currentPage.toString());
    params.append("itemsPerPage", itemsPerPage.toString());

    try {
      const res = await fetch(`/api/dataset?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setProperties(data.data);
      setTotalPages(data.totalPages);
      setTotalProperties(data.total);

      // Fetch fairness if asking price is provided
      if (askingPrice) {
        const results: Record<string, FairnessResponse> = {};
        await Promise.all(
          data.data.map(async (prop: Property) => {
            try {
              const resFair = await fetch("/api/fairness", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subject: {
                    asking_price: parseFloat(askingPrice),
                    town: prop.town,
                    flat_type: prop.flatType,
                    floor_area_sqm: prop.floor_area_sqm,
                    remaining_lease_years: prop.remaining_lease_years,
                    storey_range: prop.storey_range,
                  },
                  tier: "FREE",
                }),
              });
              const fairnessData = await resFair.json();
              results[prop.id] = fairnessData;
            } catch (err) {
              console.error(err);
            }
          })
        );
        setFairnessMap(results);
      } else {
        setFairnessMap({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [town, flatType, sortBy, currentPage, askingPrice]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (!session) return null;

  const clearFilters = () => {
    setAskingPrice("");
    setTown("");
    setFlatType("");
    setSortBy("price-asc");
    setCurrentPage(1);
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (currentPage < totalPages - 2) items.push("ellipsis-end");
      items.push(totalPages);
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            {/* Asking Price */}
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700">Asking Price</label>
              <Input
                type="number"
                placeholder="Enter price"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="w-36"
              />
            </div>

            {/* Town */}
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700">Town</label>
              <Select value={town} onValueChange={setTown}>
                <SelectTrigger>
                  <SelectValue placeholder="All Towns" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(properties.map((p) => p.town))).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {toTitleCase(t)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Flat Type */}
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700">Property Type</label>
              <Select value={flatType} onValueChange={setFlatType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(properties.map((p) => p.flatType))).map(
                    (ft) => (
                      <SelectItem key={ft} value={ft}>
                        {toTitleCase(ft)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortDesc className="h-4 w-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found <strong>{totalProperties}</strong> properties
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!askingPrice && !town && !flatType}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[24rem]">
          {loading
            ? Array.from({ length: itemsPerPage }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 shadow-sm gap-2 border border-gray-200 animate-pulse bg-gray-100 rounded"
                >
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))
            : properties.map((prop) => {
                const fairness = fairnessMap[prop.id];
                return (
                  <Card key={prop.id} className="p-4 shadow-sm gap-2">
                    <h3 className="text-lg font-semibold">
                      {toTitleCase(prop.flatType)} in {toTitleCase(prop.town)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Avg Price: ${prop.price.toLocaleString()}
                    </p>
                    {fairness && (
                      <p className="text-sm mt-1">
                        Your asking price is{" "}
                        <span className="font-semibold">{fairness.label}</span>,
                        Fair Price: ${fairness.fair_price.toLocaleString()}
                      </p>
                    )}
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prop.trend.map((t) => ({
                            month: t.date,
                            price: t.avgPrice,
                          }))}
                          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />

                          {/* Format X axis date (YYYY-MM -> "Oct 2025") */}
                          <XAxis
                            dataKey="month"
                            tickFormatter={(val) => {
                              const [year, month] = val.split("-");
                              const date = new Date(`${year}-${month}-01`);
                              return date.toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              });
                            }}
                            tick={{ fontSize: 12 }}
                          />

                          {/* Format Y axis price (280000 -> 280K) */}
                          <YAxis
                            tickFormatter={(val) =>
                              val >= 1_000_000
                                ? `${(val / 1_000_000).toFixed(1)}M`
                                : val == 0
                                ? "0"
                                : `${(val / 1_000).toFixed(0)}K`
                            }
                            tick={{ fontSize: 12 }}
                          />

                          <Tooltip
                            formatter={(value: number) =>
                              `$${value.toLocaleString()}`
                            }
                            labelFormatter={(val: string) => {
                              const [year, month] = val.split("-");
                              const date = new Date(`${year}-${month}-01`);
                              return date.toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              });
                            }}
                          />

                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false} // hide dots
                            activeDot={{
                              r: 5,
                              strokeWidth: 2,
                              stroke: "#2563eb",
                              fill: "#fff",
                            }} // show on hover
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                );
              })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPaginationItems().map((item, idx) => (
                <PaginationItem key={idx}>
                  {typeof item === "number" ? (
                    <PaginationLink
                      onClick={() => setCurrentPage(item)}
                      isActive={currentPage === item}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
