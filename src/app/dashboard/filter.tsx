"use client";

import { useState, useEffect } from "react";
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
import { ChevronDown, ChevronUp, Search, X, Filter, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAtom, useSetAtom } from "jotai";
import { filtersAtom, savedFiltersAtom } from "@/lib/propertyAtom";
import { toast } from "sonner";

export function FilterSection({
  total,
  loading,
  onFilter,
}: {
  total: number;
  loading: boolean;
  onFilter: (filters: any) => void;
}) {
  const [filters, setFilters] = useAtom(filtersAtom);
  const setSavedFilters = useSetAtom(savedFiltersAtom);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Local states for advanced filters
  const [yearFrom, setYearFrom] = useState("");
  const [monthFrom, setMonthFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [minArea, setMinArea] = useState(50);
  const [maxArea, setMaxArea] = useState(150);
  const [minStorey, setMinStorey] = useState(1);
  const [maxStorey, setMaxStorey] = useState(30);

  // Initialize local states from filters on mount
  useEffect(() => {
    if (filters.monthFrom) {
      const [year, month] = filters.monthFrom.split("-");
      setYearFrom(year || "");
      setMonthFrom(month || "");
    }
    if (filters.monthTo) {
      const [year, month] = filters.monthTo.split("-");
      setYearTo(year || "");
      setMonthTo(month || "");
    }
    if (filters.minArea) setMinArea(Number(filters.minArea));
    if (filters.maxArea) setMaxArea(Number(filters.maxArea));
    if (filters.minStorey) setMinStorey(Number(filters.minStorey));
    if (filters.maxStorey) setMaxStorey(Number(filters.maxStorey));
  }, [filters]);

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
      askingPrice: "",
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

  const handleChange = (field: string, value: string) => {
    // Only update local state, don't trigger onFilter
    setFilters((prev: any) => ({ ...prev, [field]: value }));
  };

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
    onFilter(updatedFilters);
  };

  const handleSaveFilter = async () => {
    try {
      // Include all current filter values including asking price and advanced filters
      const filterToSave = {
        ...filters,
        monthFrom: yearFrom && monthFrom ? `${yearFrom}-${monthFrom}` : "",
        monthTo: yearTo && monthTo ? `${yearTo}-${monthTo}` : "",
        minArea: minArea.toString(),
        maxArea: maxArea.toString(),
        minStorey: minStorey.toString(),
        maxStorey: maxStorey.toString(),
      };

      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: filterName, filters: filterToSave }),
      });

      if (!res.ok) throw new Error("Failed to save filter");

      const newFilter = await res.json();
      setSavedFilters((prev) => [...prev, newFilter]);

      setOpenSaveDialog(false);
      setFilterName("");

      toast.success("Filter saved successfully!", {
        description: `"${filterName}" has been added to your saved filters.`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save filter", {
        description: "Please try again later.",
      });
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

  const hasActiveFilters = !!(
    filters.askingPrice ||
    filters.town ||
    filters.flatType ||
    yearFrom ||
    monthFrom ||
    yearTo ||
    monthTo ||
    minArea !== 50 ||
    maxArea !== 150 ||
    minStorey !== 1 ||
    maxStorey !== 30
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Search size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              Filter Properties
            </h2>
          </div>
          <div className="text-right text-gray-600">
            <strong>{total}</strong> properties found
          </div>
        </div>
      </div>

      <Separator />

      {/* Basic Filters Grid */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asking Price */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Max Asking Price
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                $
              </span>
              <Input
                type="number"
                placeholder="e.g. 500000"
                value={filters.askingPrice}
                onChange={(e) => handleChange("askingPrice", e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Town */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Town</div>
            <Select
              value={filters.town || "all"}
              onValueChange={(v) => handleChange("town", v === "all" ? "" : v)}
            >
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-2"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          Advanced Filters
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <>
          <Separator />
          <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">
                    Transaction Period
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
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Clear dates
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* From Date */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">
                      From
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={monthFrom} onValueChange={setMonthFrom}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                    <div className="text-sm font-medium text-gray-600">To</div>
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
                        <SelectTrigger>
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
              </div>

              <Separator />

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Floor Area Slider */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-600">
                    Floor Area (sqm)
                  </div>
                  <div className="pt-2">
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
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-medium text-gray-600">
                        {minArea} sqm
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {maxArea} sqm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Storey Slider */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600">
                    Storey Range
                  </div>
                  <div className="pt-2">
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
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-medium text-gray-600">
                        Level {minStorey}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        Level {maxStorey}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="p-6 pt-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={openSaveDialog} onOpenChange={setOpenSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save size={16} />
                Save Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Save Filter Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Filter Name
                  </div>
                  <Input
                    placeholder="Enter filter name (e.g., 'My 4-Room Search')"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Filter Summary
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 max-h-64 overflow-y-auto">
                    {/* Asking Price */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Asking Price:</span>
                      <span className="font-medium text-gray-900">
                        {filters.askingPrice
                          ? `$${Number(filters.askingPrice).toLocaleString()}`
                          : "Any"}
                      </span>
                    </div>

                    {/* Town */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Town:</span>
                      <span className="font-medium text-gray-900">
                        {filters.town || "All Towns"}
                      </span>
                    </div>

                    {/* Flat Type */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Flat Type:</span>
                      <span className="font-medium text-gray-900">
                        {filters.flatType || "All Types"}
                      </span>
                    </div>

                    {/* Sort By */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sort By:</span>
                      <span className="font-medium text-gray-900">
                        {filters.sortBy === "price-asc"
                          ? "Price: Low to High"
                          : filters.sortBy === "price-desc"
                          ? "Price: High to Low"
                          : filters.sortBy === "area-asc"
                          ? "Area: Small to Large"
                          : filters.sortBy === "area-desc"
                          ? "Area: Large to Small"
                          : "Default"}
                      </span>
                    </div>

                    {/* Period */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaction Period:</span>
                      <span className="font-medium text-gray-900">
                        {yearFrom && monthFrom
                          ? `${
                              months.find((m) => m.value === monthFrom)?.label
                            } ${yearFrom}`
                          : "Any"}
                        {yearTo && monthTo
                          ? ` - ${
                              months.find((m) => m.value === monthTo)?.label
                            } ${yearTo}`
                          : ""}
                      </span>
                    </div>

                    {/* Floor Area */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Floor Area:</span>
                      <span className="font-medium text-gray-900">
                        {minArea} - {maxArea} sqm
                      </span>
                    </div>

                    {/* Storey Range */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Storey Range:</span>
                      <span className="font-medium text-gray-900">
                        Level {minStorey} - {maxStorey}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                >
                  Save Filter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
              Clear All
            </Button>
          )}
          <Button size="sm" onClick={applyFilters} disabled={loading}>
            <Filter size={16} />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
