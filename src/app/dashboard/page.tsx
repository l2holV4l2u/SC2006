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
import { Filter, SortDesc, LoaderCircle, Search } from "lucide-react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { Property } from "@/type/property";
import { dummyProperties } from "@/lib/mock";
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

export default function PropertyListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Filter states
  const [askingPrice, setAskingPrice] = useState<string>("");
  const [town, setTown] = useState<string>("");
  const [flatType, setFlatType] = useState<string>("");
  const [filtered, setFiltered] = useState<Property[]>(dummyProperties);
  const [sortBy, setSortBy] = useState<string>("price-asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    let results = dummyProperties.filter((p) => {
      return (
        (askingPrice === "" || p.price <= parseInt(askingPrice)) &&
        (town === "" || p.town === town) &&
        (flatType === "" || p.flatType === flatType)
      );
    });

    // Sorting ...
    switch (sortBy) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "size-desc":
        results.sort((a, b) => b.size - a.size);
        break;
      case "views-desc":
        results.sort((a, b) => b.views - a.views);
        break;
    }

    setFiltered(results);
    setCurrentPage(1); // reset pagination
  }, [askingPrice, town, flatType, sortBy]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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
                  <SelectItem value="Ang Mo Kio">Ang Mo Kio</SelectItem>
                  <SelectItem value="Bedok">Bedok</SelectItem>
                  <SelectItem value="Bishan">Bishan</SelectItem>
                  <SelectItem value="Clementi">Clementi</SelectItem>
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
                  <SelectItem value="3-Room">3-Room HDB</SelectItem>
                  <SelectItem value="4-Room">4-Room HDB</SelectItem>
                  <SelectItem value="5-Room">5-Room HDB</SelectItem>
                  <SelectItem value="Executive">Executive Flat</SelectItem>
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
                  <SelectItem value="size-desc">Size: Largest First</SelectItem>
                  <SelectItem value="views-desc">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found <strong>{filtered.length}</strong> of{" "}
              <strong>{dummyProperties.length}</strong> properties
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={town == "" && flatType == ""}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Results Grid - Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageData.map((prop, i) => (
            <Card key={i} className="p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                {prop.flatType} in {prop.town}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
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

        {/* Pagination */}
        <Card className="shadow-sm p-4">
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              « Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={page === currentPage ? "default" : "outline"}
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next »
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
