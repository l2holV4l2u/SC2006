"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Filter,
  Save,
  Loader2,
  ArrowUpRight,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAtom, useSetAtom } from "jotai";
import {
  askingPriceAtom,
  defaultFilters,
  fairnessLoadingAtom,
  fairnessMapAtom,
  filtersAtom,
  loadingAtom,
  paginationAtom,
  propertyAtom,
  savedFiltersAtom,
} from "@/lib/propertyAtom";
import { toast } from "sonner";
import type { FairnessOutput, Filters } from "@/type";
import { useSession } from "next-auth/react";
import { PremiumFeatureDialog } from "@/components/custom/premiumFeatureDialog";
import { parseRemainingLease } from "@/lib/dataset";
import { towns } from "@/lib/const";

export function FilterSection() {
  const { data: session } = useSession();
  const isPremium = session?.user?.role == "PREMIUM" || false;

  const setSavedFilters = useSetAtom(savedFiltersAtom);
  const [askingPrice, setAskingPrice] = useAtom(askingPriceAtom);
  const [filters, setFilters] = useAtom(filtersAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [pagination, setPagination] = useAtom(paginationAtom);
  const [property, setProperty] = useAtom(propertyAtom);
  const [fairnessLoading, setFairnessLoading] = useAtom(fairnessLoadingAtom);
  const setFairnessMap = useSetAtom(fairnessMapAtom);

  // Local state for editing filters before applying
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [openPremiumDialog, setOpenPremiumDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  useEffect(() => setFilters(filters), [filters]);

  // Fetch properties only when pagination changes (not on filter changes)
  useEffect(() => {
    fetchProperties();
  }, [pagination.page]);

  // Date Validation Helper
  const isValidDateRange = useMemo(() => {
    const { yearFrom, monthFrom, yearTo, monthTo } = filters;

    if (!yearFrom && !monthFrom) return true;
    if (!yearTo && !monthTo) return true;
    if (!yearFrom || !yearTo) return true;

    const fromYear = parseInt(yearFrom);
    const toYear = parseInt(yearTo);
    const fromMonth = monthFrom ? parseInt(monthFrom) : 1;
    const toMonth = monthTo ? parseInt(monthTo) : 12;

    if (fromYear > toYear) return false;
    if (fromYear === toYear && fromMonth > toMonth) return false;

    return true;
  }, [filters]);

  // Helpers
  const handleChange = (field: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const handleSaveFilter = async () => {
    if (!isValidDateRange) {
      toast.error("Invalid date range: 'From' date must be before 'To' date");
      return;
    }

    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: filterName,
          filters: { ...filters, askingPrice },
        }),
      });

      if (!res.ok) throw new Error("Failed to save filter");
      const newFilter = await res.json();

      setSavedFilters((prev) => [...prev, newFilter]);
      setOpenSaveDialog(false);
      setFilterName("");

      toast.success("Filter saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save filter");
    }
  };

  const handleAdvancedToggle = () => {
    if (!isPremium) setOpenPremiumDialog(true);
    else setShowAdvanced((p) => !p);
  };

  const handleApplyFilters = async () => {
    if (!isValidDateRange) {
      toast.error("Invalid date range: 'From' date must be before 'To' date");
      return;
    }

    // Apply the local filters to the atom
    setFilters(filters);

    // Reset to page 1 when applying new filters
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Fetch properties with new filters
    await fetchProperties();
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        page: pagination.page.toString(),
        itemsPerPage: "9",
      });
      const res = await fetch(`/api/dataset?${params.toString()}`);
      const data = await res.json();

      const fetchedProperties = data.data || [];
      setProperty(fetchedProperties);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      }));

      // Run fairness analysis after properties are fetched
      if (
        askingPrice &&
        Number(askingPrice) > 0 &&
        fetchedProperties.length > 0
      ) {
        await analyzeFairness(fetchedProperties);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperty([]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFairness = async (properties: typeof property) => {
    if (!askingPrice || Number(askingPrice) <= 0 || properties.length === 0) {
      return;
    }

    try {
      const subjects = properties.map((p) => ({
        town: p.town,
        flat_type: p.flatType,
        floor_area_sqm: p.floor_area_sqm,
        remaining_lease_years: parseRemainingLease(p.remaining_lease_years),
        asking_price: askingPrice,
        id: p.id,
      }));

      const response = await fetch("/api/fairness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          coeffs: {
            beta_lease: 0.015,
            gamma_logarea: -0.15,
          },
        }),
      });

      if (response.ok) {
        const results: FairnessOutput[] = await response.json();
        const newFairnessMap: Record<string, FairnessOutput> = {};
        results.forEach((res, index) => {
          const id = subjects[index].id;
          newFairnessMap[id] = res;
        });
        setFairnessMap(newFairnessMap);
      } else {
        console.error("Fairness analysis failed");
      }
    } catch (error) {
      console.error("Error during fairness analysis:", error);
    }
  };

  const handleAnalyzeFairness = async () => {
    setFairnessLoading(true);
    if (property.length > 0) {
      await analyzeFairness(property);
    } else {
      toast.error("No properties to analyze. Apply filters first.");
    }
    setFairnessLoading(false);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  // --- UI Data ---
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const months = useMemo(
    () => [
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
    ],
    []
  );

  const hasActiveFilters = useMemo(
    () =>
      Object.entries(filters).some(
        ([k, v]) => v && v !== defaultFilters[k as keyof Filters]
      ),
    [filters]
  );

  // Render
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Search size={20} />
          <h2 className="text-lg font-semibold text-gray-800">
            Filter Properties
          </h2>
        </div>
        <div className="text-right text-gray-600">
          <strong>{pagination.total}</strong> properties found
        </div>
      </div>

      <Separator />

      {/* Basic Filters */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center justify-between">
              Asking Price
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 500000"
                  value={askingPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setAskingPrice(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="pl-7"
                />
              </div>

              <Button
                size="icon"
                onClick={handleAnalyzeFairness}
                disabled={loading || !askingPrice || Number(askingPrice) <= 0}
                className="aspect-square"
                title="Analyze fairness of current properties"
              >
                {loading || fairnessLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </Button>
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
                {towns.map((town) => (
                  <SelectItem key={town} value={town}>
                    {town === "all" ? "All Towns" : town}
                  </SelectItem>
                ))}
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
                {[
                  "all",
                  "1 Room",
                  "2 Room",
                  "3 Room",
                  "4 Room",
                  "5 Room",
                  "Executive",
                ].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "all" ? "All Types" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdvancedToggle}
          className={`-ml-2 ${
            isPremium
              ? "text-primary hover:text-primary-700 hover:bg-primary-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {isPremium ? (
            showAdvanced ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )
          ) : (
            <Lock size={16} />
          )}
          Advanced Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && isPremium && (
        <>
          <Separator />
          <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-white space-y-6">
            <div className="flex gap-4 w-full">
              {/* Transaction Period - From */}
              <div className="space-y-2 w-full">
                <div className="text-sm font-semibold text-gray-700">
                  Transaction Period From
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Year</div>
                    <Select
                      value={filters.yearFrom || "any"}
                      onValueChange={(v) =>
                        handleChange("yearFrom", v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Year</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Month</div>
                    <Select
                      value={filters.monthFrom || "any"}
                      onValueChange={(v) =>
                        handleChange("monthFrom", v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Month</SelectItem>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Transaction Period - To */}
              <div className="space-y-2 w-full">
                <div className="text-sm font-semibold text-gray-700">
                  Transaction Period To
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Year</div>
                    <Select
                      value={filters.yearTo || "any"}
                      onValueChange={(v) =>
                        handleChange("yearTo", v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Year</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">Month</div>
                    <Select
                      value={filters.monthTo || "any"}
                      onValueChange={(v) =>
                        handleChange("monthTo", v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Month</SelectItem>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Validation Warning */}
            {!isValidDateRange && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>
                  Invalid date range: The 'From' date must be before the 'To'
                  date
                </span>
              </div>
            )}

            {/* Area / Storey */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">
                    Floor Area
                  </div>
                  <div className="text-xs text-gray-600">
                    {filters.minArea} - {filters.maxArea} sqm
                  </div>
                </div>
                <Slider
                  min={30}
                  max={250}
                  step={5}
                  value={[Number(filters.minArea), Number(filters.maxArea)]}
                  onValueChange={([min, max]) => {
                    handleChange("minArea", min.toString());
                    handleChange("maxArea", max.toString());
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">
                    Storey Range
                  </div>
                  <div className="text-xs text-gray-600">
                    Level {filters.minStorey} - {filters.maxStorey}
                  </div>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[Number(filters.minStorey), Number(filters.maxStorey)]}
                  onValueChange={([min, max]) => {
                    handleChange("minStorey", min.toString());
                    handleChange("maxStorey", max.toString());
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Actions */}
      <div className="p-6 pt-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
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
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Asking Price:</div>
                    <div className="font-medium text-gray-900">
                      {askingPrice
                        ? `${Number(askingPrice).toLocaleString()}`
                        : "Any"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Town:</div>
                    <div className="font-medium text-gray-900">
                      {filters.town || "All Towns"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Flat Type:</div>
                    <div className="font-medium text-gray-900">
                      {filters.flatType || "All Types"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Transaction Period:</div>
                    <div className="font-medium text-gray-900">
                      {filters.yearFrom || filters.monthFrom
                        ? `${
                            months.find((m) => m.value === filters.monthFrom)
                              ?.label || ""
                          } ${filters.yearFrom || ""}`
                        : "Any"}
                      {filters.yearTo || filters.monthTo
                        ? ` - ${
                            months.find((m) => m.value === filters.monthTo)
                              ?.label || ""
                          } ${filters.yearTo || ""}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Floor Area:</div>
                    <div className="font-medium text-gray-900">
                      {filters.minArea} - {filters.maxArea} sqm
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Storey Range:</div>
                    <div className="font-medium text-gray-900">
                      Level {filters.minStorey} - {filters.maxStorey}
                    </div>
                  </div>
                </div>
              </div>

              {!isValidDateRange && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>Please fix the invalid date range before saving</span>
                </div>
              )}
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
                disabled={!filterName.trim() || !isValidDateRange}
              >
                Save Filter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
              Clear All
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleApplyFilters}
            disabled={loading || !isValidDateRange}
          >
            <Filter size={16} />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Premium Upgrade Dialog */}
      <PremiumFeatureDialog
        openPremiumDialog={openPremiumDialog}
        setOpenPremiumDialog={setOpenPremiumDialog}
      />
    </div>
  );
}
