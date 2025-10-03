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
import { SortDesc, LoaderCircle } from "lucide-react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { Property } from "@/type/property";
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

export default function PropertyListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [askingPrice, setAskingPrice] = useState<string>("");
  const [town, setTown] = useState<string>("");
  const [flatType, setFlatType] = useState<string>("");
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [sortBy, setSortBy] = useState<string>("price-asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const res = await fetch("/api/dataset?limit=1000");
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data: Property[] = await res.json();
        setProperties(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  // Apply filters & sorting when filters change
  useEffect(() => {
    let results = properties.filter((p) => {
      return (
        (town === "" || p.town === town) &&
        (flatType === "" || p.flatType === flatType)
      );
    });

    switch (sortBy) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
    }

    setFiltered(results);
    setCurrentPage(1);
  }, [town, flatType, sortBy, properties]);

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderCircle className="animate-spin h-32 w-32 mx-auto" />
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Paginated data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setAskingPrice("");
    setTown("");
    setFlatType("");
    setSortBy("price-asc");
  };

  // Helper function to generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      if (currentPage > 3) {
        items.push("ellipsis-start");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - 2) {
        items.push("ellipsis-end");
      }

      // Always show last page
      items.push(totalPages);
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        {/* Filter & Sort */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">Asking Price</label>
              <Input
                type="number"
                placeholder="Enter your price"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="w-36"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">Location</label>
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

            <div className="flex gap-4 items-center">
              <label className="font-medium text-gray-700">Property Type</label>
              <Select value={flatType} onValueChange={setFlatType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Property Types" />
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

            <div className="flex items-center space-x-2">
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
              Found <strong>{filtered.length}</strong> of{" "}
              <strong>{properties.length}</strong> properties
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={town == "" && flatType == "" && askingPrice === ""}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageData.map((prop) => (
            <Card key={prop.id} className="p-4 shadow-sm gap-2">
              <h3 className="text-lg font-semibold">
                {toTitleCase(prop.flatType)} in {toTitleCase(prop.town)}
              </h3>
              <p className="text-sm text-gray-600">
                Avg Price: ${prop.price.toLocaleString()}
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: "Jan", price: prop.price * 0.95 },
                      { month: "Feb", price: prop.price * 0.97 },
                      { month: "Mar", price: prop.price },
                      { month: "Apr", price: prop.price * 1.02 },
                      { month: "May", price: prop.price * 1.05 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination with shadcn */}
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

              {getPaginationItems().map((item, index) => (
                <PaginationItem key={index}>
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
