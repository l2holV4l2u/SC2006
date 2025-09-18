"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search, Filter, SortDesc } from "lucide-react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { PropertyCard } from "./propertyCard";
import { Property } from "@/type/property";
import { dummyProperties } from "@/lib/mock";

export default function PropertyListingPage() {
  // Filter states
  const [town, setTown] = useState<string>("");
  const [flatType, setFlatType] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    200000, 1_500_000,
  ]);
  const [sizeRange, setSizeRange] = useState<[number, number]>([30, 200]);
  const [filtered, setFiltered] = useState<Property[]>(dummyProperties);
  const [sortBy, setSortBy] = useState<string>("price-asc");

  useEffect(() => {
    let results = dummyProperties.filter((p) => {
      return (
        (town === "" || p.town.toLowerCase().includes(town.toLowerCase())) &&
        (flatType === "" || p.flatType === flatType) &&
        p.price >= priceRange[0] &&
        p.price <= priceRange[1] &&
        p.size >= sizeRange[0] &&
        p.size <= sizeRange[1]
      );
    });

    // Apply sorting
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
  }, [town, flatType, priceRange, sizeRange, sortBy]);

  const clearFilters = () => {
    setTown("");
    setFlatType("");
    setPriceRange([200000, 1_500_000]);
    setSizeRange([30, 200]);
    setSortBy("price-asc");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-6 space-y-6 mt-12">
        {/* Filter & Search Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Search & Filter</h2>
              </div>
              <div className="flex items-center space-x-2">
                <SortDesc className="h-4 w-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="size-desc">
                      Size: Largest First
                    </SelectItem>
                    <SelectItem value="views-desc">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter town or area"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Property Type
                </label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Price Range: ${(priceRange[0] / 1000).toFixed(0)}K - $
                  {(priceRange[1] / 1000).toFixed(0)}K
                </label>
                <Slider
                  min={100000}
                  max={1_500_000}
                  step={50000}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Size: {sizeRange[0]} - {sizeRange[1]} sqm
                </label>
                <Slider
                  min={30}
                  max={200}
                  step={5}
                  value={sizeRange}
                  onValueChange={(v) => setSizeRange(v as [number, number])}
                  className="py-4"
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Found <strong>{filtered.length}</strong> of{" "}
                <strong>{dummyProperties.length}</strong> properties
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((prop) => (
            <PropertyCard prop={prop} />
          ))}
        </div>

        {/* Pagination */}
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <div className="flex justify-center items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                « Previous
              </Button>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  className="bg-blue-600 text-white w-8 h-8 p-0"
                >
                  1
                </Button>
                <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                  2
                </Button>
                <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                  3
                </Button>
                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                  8
                </Button>
              </div>
              <Button variant="outline" size="sm">
                Next »
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
