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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  askingPriceAtom,
  defaultFilters,
  fairnessMapAtom,
  filtersAtom,
  propertyAtom,
  savedFiltersAtom,
} from "@/lib/propertyAtom";
import { toast } from "sonner";
import type { FairnessOutput, Filters } from "@/type";

export function FilterSection({
  total,
  loading,
  onFilter,
}: {
  total: number;
  loading: boolean;
  onFilter: (filters: Filters) => void;
}) {
  const setSavedFilters = useSetAtom(savedFiltersAtom);
  const setFairnessMap = useSetAtom(fairnessMapAtom);
  const [askingPrice, setAskingPrice] = useAtom(askingPriceAtom);
  const property = useAtomValue(propertyAtom);
  const [filters, setFilters] = useAtom(filtersAtom);

  // Local state for draft filters (not applied until user clicks Apply)
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [analyzingFairness, setAnalyzingFairness] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Sync draftFilters when filters atom changes (e.g., from saved filter selection)
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  // --- Helpers ---
  const handleChange = (field: keyof Filters, value: string) =>
    setDraftFilters((prev) => ({ ...prev, [field]: value }));

  const parseRemainingLease = (leaseStr: string): number => {
    if (!leaseStr) return 0;
    const yearsMatch = leaseStr.match(/(\d+)\s*years?/i);
    const monthsMatch = leaseStr.match(/(\d+)\s*months?/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
    return years + months / 12;
  };

  const handleSaveFilter = async () => {
    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: filterName,
          filters: { ...draftFilters, askingPrice },
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

  const handleAnalyzeFairness = async () => {
    setAnalyzingFairness(true);
    try {
      const subjects = property.map((p) => ({
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
    } finally {
      setAnalyzingFairness(false);
    }
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
      Object.entries(draftFilters).some(
        ([k, v]) => v && v !== defaultFilters[k as keyof Filters]
      ),
    [draftFilters]
  );

  // --- Render ---
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
          <strong>{total}</strong> properties found
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
                  type="number"
                  placeholder="e.g. 500000"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  className="pl-7"
                />
              </div>

              <Button
                size="icon"
                onClick={handleAnalyzeFairness}
                disabled={analyzingFairness}
                className="aspect-square"
              >
                {analyzingFairness ? (
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
              value={draftFilters.town || "all"}
              onValueChange={(v) => handleChange("town", v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Towns" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "all",
                  "Ang Mo Kio",
                  "Bedok",
                  "Bishan",
                  "Bukit Batok",
                  "Bukit Merah",
                  "Bukit Panjang",
                  "Bukit Timah",
                  "Central Area",
                  "Choa Chu Kang",
                  "Clementi",
                  "Geylang",
                  "Hougang",
                  "Jurong East",
                  "Jurong West",
                  "Kallang/Whampoa",
                  "Marine Parade",
                  "Pasir Ris",
                  "Punggol",
                  "Queenstown",
                  "Sembawang",
                  "Sengkang",
                  "Serangoon",
                  "Tampines",
                  "Tengah",
                  "Toa Payoh",
                  "Woodlands",
                  "Yishun",
                ].map((town) => (
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
              value={draftFilters.flatType || "all"}
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
              value={draftFilters.sortBy}
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
          onClick={() => setShowAdvanced((p) => !p)}
          className="text-primary hover:text-primary-700 hover:bg-primary-50 -ml-2"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          Advanced Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
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
                      value={draftFilters.yearFrom || "any"}
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
                      value={draftFilters.monthFrom || "any"}
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
                      value={draftFilters.yearTo || "any"}
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
                      value={draftFilters.monthTo || "any"}
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

            {/* Area / Storey */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">
                    Floor Area
                  </div>
                  <div className="text-xs text-gray-600">
                    {draftFilters.minArea} - {draftFilters.maxArea} sqm
                  </div>
                </div>
                <Slider
                  min={30}
                  max={250}
                  step={5}
                  value={[
                    Number(draftFilters.minArea),
                    Number(draftFilters.maxArea),
                  ]}
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
                    Level {draftFilters.minStorey} - {draftFilters.maxStorey}
                  </div>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[
                    Number(draftFilters.minStorey),
                    Number(draftFilters.maxStorey),
                  ]}
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
                        ? `$${Number(askingPrice).toLocaleString()}`
                        : "Any"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Town:</div>
                    <div className="font-medium text-gray-900">
                      {draftFilters.town || "All Towns"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Flat Type:</div>
                    <div className="font-medium text-gray-900">
                      {draftFilters.flatType || "All Types"}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Transaction Period:</div>
                    <div className="font-medium text-gray-900">
                      {draftFilters.yearFrom || draftFilters.monthFrom
                        ? `${
                            months.find(
                              (m) => m.value === draftFilters.monthFrom
                            )?.label || ""
                          } ${draftFilters.yearFrom || ""}`
                        : "Any"}
                      {draftFilters.yearTo || draftFilters.monthTo
                        ? ` - ${
                            months.find((m) => m.value === draftFilters.monthTo)
                              ?.label || ""
                          } ${draftFilters.yearTo || ""}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Floor Area:</div>
                    <div className="font-medium text-gray-900">
                      {draftFilters.minArea} - {draftFilters.maxArea} sqm
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Storey Range:</div>
                    <div className="font-medium text-gray-900">
                      Level {draftFilters.minStorey} - {draftFilters.maxStorey}
                    </div>
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
              <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
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
              onClick={() => setDraftFilters(defaultFilters)}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={16} />
              Clear All
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setFilters(draftFilters);
              onFilter(draftFilters);
            }}
            disabled={loading}
          >
            <Filter size={16} />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
