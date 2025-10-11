"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, Search, X, Filter, Scale } from "lucide-react";
import { useAtom } from "jotai";
import { askingPriceAtom } from "@/lib/propertyAtom";

export function FilterSection({
  filters,
  setFilters,
  total,
  loading,
  onFilter,
  onAnalyzeFairness,
}: any) {
  const [askingPrice, setAskingPrice] = useAtom(askingPriceAtom);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // local states for advanced filters
  const [yearFrom, setYearFrom] = useState("");
  const [monthFrom, setMonthFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [minArea, setMinArea] = useState(50);
  const [maxArea, setMaxArea] = useState(150);
  const [minStorey, setMinStorey] = useState(1);
  const [maxStorey, setMaxStorey] = useState(30);
  const clearFilters = () => {
    setFilters({
      town: "",
      flatType: "",
      sortBy: "price-asc",
      monthFrom: "",
      monthTo: "",
      minArea: "",
      maxArea: "",
      minStorey: "",
      maxStorey: "",
    });
    setYearFrom("");
    setMonthFrom("");
    setYearTo("");
    setMonthTo("");
    setMinArea(50);
    setMaxArea(150);
    setMinStorey(1);
    setMaxStorey(30);
  };

  const handleChange = (field: string, value: string) =>
    setFilters((prev: any) => ({ ...prev, [field]: value }));

  const applyFilters = () => {
    // Combine year/month into YYYY-MM format
    const monthFromValue =
      yearFrom && monthFrom ? `${yearFrom}-${monthFrom}` : "";
    const monthToValue = yearTo && monthTo ? `${yearTo}-${monthTo}` : "";
    const updatedFilters = {
      ...filters,
      monthFrom: monthFromValue,
      monthTo: monthToValue,
      minArea: minArea.toString(),
      maxArea: maxArea.toString(),
      minStorey: minStorey.toString(),
      maxStorey: maxStorey.toString(),
    };

    setFilters(updatedFilters);

    // Call the parent's filter function if provided
    if (onFilter) {
      onFilter(updatedFilters);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Properties
          </h2>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{total}</span>{" "}
          properties found
        </div>
      </div>

      <Separator />

      {/* Basic Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asking Price */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Asking Price</div>
          <Input
            type="number"
            placeholder="Enter max price"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Town */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Town</div>
          <Select
            value={filters.town || "all"}
            onValueChange={(v) => handleChange("town", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Towns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Towns</SelectItem>
              <SelectItem value="ANG MO KIO">Ang Mo Kio</SelectItem>
              <SelectItem value="BEDOK">Bedok</SelectItem>
              <SelectItem value="BISHAN">Bishan</SelectItem>
              <SelectItem value="BUKIT BATOK">Bukit Batok</SelectItem>
              <SelectItem value="BUKIT MERAH">Bukit Merah</SelectItem>
              <SelectItem value="CLEMENTI">Clementi</SelectItem>
              <SelectItem value="JURONG WEST">Jurong West</SelectItem>
              <SelectItem value="TAMPINES">Tampines</SelectItem>
              <SelectItem value="TOA PAYOH">Toa Payoh</SelectItem>
              <SelectItem value="WOODLANDS">Woodlands</SelectItem>
              <SelectItem value="YISHUN">Yishun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flat Type */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Flat Type</div>
          <Select
            value={filters.flatType || "all"}
            onValueChange={(v) =>
              handleChange("flatType", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="2 ROOM">2 Room</SelectItem>
              <SelectItem value="3 ROOM">3 Room</SelectItem>
              <SelectItem value="4 ROOM">4 Room</SelectItem>
              <SelectItem value="5 ROOM">5 Room</SelectItem>
              <SelectItem value="EXECUTIVE">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Sort By</div>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => handleChange("sortBy", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="area-asc">Area: Small to Large</SelectItem>
              <SelectItem value="area-desc">Area: Large to Small</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-primary-600 hover:text-primary-700 hover:bg-gray-100"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Advanced Filters
        </Button>

        {/* Filter Button */}
        <div className="flex gap-2 ">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAnalyzeFairness?.(filters)}
            disabled={loading}
          >
            <Scale size={16} />
            Analyze Fairness
          </Button>
          <Button
            variant="highlight"
            size="sm"
            onClick={applyFilters}
            disabled={loading}
          >
            <Filter size={16} />
            Apply Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={loading}
          >
            <X size={16} />
            Clear All
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-5">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">
              Transaction Period
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Date */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">From</label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={monthFrom} onValueChange={setMonthFrom}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={yearFrom} onValueChange={setYearFrom}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">To</label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={monthTo} onValueChange={setMonthTo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {(yearFrom || monthFrom || yearTo || monthTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setYearFrom("");
                  setMonthFrom("");
                  setYearTo("");
                  setMonthTo("");
                }}
                className="h-7 text-xs text-gray-600 hover:text-gray-900"
              >
                Clear dates
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-8 w-full">
            {/* Floor Area Slider */}
            <div className="space-y-2 w-full">
              <div className="text-sm font-semibold text-gray-900 mb-4">
                Floor Area (sqm)
              </div>
              <Slider
                min={30}
                max={250}
                step={5}
                value={[minArea, maxArea]}
                onValueChange={([min, max]) => {
                  setMinArea(min);
                  setMaxArea(max);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{minArea} sqm</span>
                <span>{maxArea} sqm</span>
              </div>
            </div>

            {/* Storey Slider */}
            <div className="space-y-2 w-full">
              <div className="text-sm font-semibold text-gray-900 mb-4">
                Storey Range
              </div>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[minStorey, maxStorey]}
                onValueChange={([min, max]) => {
                  setMinStorey(min);
                  setMaxStorey(max);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Lvl {minStorey}</span>
                <span>Lvl {maxStorey}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
