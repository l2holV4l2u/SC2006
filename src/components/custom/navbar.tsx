import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Heart,
  TrendingUp,
  CreditCard,
  Trash2,
  MapPin,
  Home,
  Calendar,
  Maximize2,
  Layers,
  Grid3x3,
  Map,
  Lock,
  Edit2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useAtom, useSetAtom } from "jotai";
import {
  askingPriceAtom,
  filtersAtom,
  savedFiltersAtom,
} from "@/lib/propertyAtom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Filters } from "@/type";
import { cn } from "@/lib/utils";
import { PremiumFeatureDialog } from "./premiumFeatureDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { towns } from "@/lib/const";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name ?? "User";
  const userImage = user?.image ?? "https://i.pravatar.cc/32";

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <nav className="w-full flex items-center justify-between py-3 px-6">
        <Link
          href="/"
          className="font-semibold text-lg text-white drop-shadow-lg flex items-center"
        >
          <TrendingUp className="mr-2" size={20} strokeWidth={3} />
          Resale Viewer
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="text-white">
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white">
                Dashboard
              </Button>
            </Link>
          </div>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex gap-4 items-center">
                <Avatar>
                  <AvatarImage src={userImage} alt={userName} />
                  <AvatarFallback>
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm text-white font-medium">
                  {userName.split(" ")[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/subscription"
                    className="flex items-center w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-800 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="highlight">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function DashboardNavbar({
  viewMode,
  onViewModeChange,
}: {
  viewMode: "grid" | "map";
  onViewModeChange: (mode: "grid" | "map") => void;
}) {
  const { data: session } = useSession();
  const setFilters = useSetAtom(filtersAtom);
  const setAskingPrice = useSetAtom(askingPriceAtom);
  const [savedFilters, setSavedFilters] = useAtom(savedFiltersAtom);
  const [openSavedFilters, setOpenSavedFilters] = useState(false);
  const [openPremiumDialog, setOpenPremiumDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterToDelete, setFilterToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Edit mode state
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [editingFilter, setEditingFilter] = useState<{
    id: string;
    name: string;
    filters: Filters & { askingPrice?: string };
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editFilters, setEditFilters] = useState<
    (Filters & { askingPrice?: string }) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  const user = session?.user;
  const userName = user?.name ?? "User";
  const userImage = user?.image ?? "https://i.pravatar.cc/32";
  const isPremium = user?.role == "PREMIUM" || false;

  useEffect(() => {
    if (session) {
      fetch("/api/saved-filters")
        .then((res) => res.json())
        .then((data) => setSavedFilters(data))
        .catch(console.error);
    }
  }, [session, setSavedFilters]);

  const handleSelectFilter = (selectedFilters: Filters, filterName: string) => {
    setFilters(selectedFilters);
    setOpenSavedFilters(false);
    setDialogMode("view");
    setAskingPrice(selectedFilters.askingPrice || "0");
    toast.success("Filter applied!");
  };

  const handleEditClick = (id: string, name: string, filters: any) => {
    setEditingFilter({ id, name, filters });
    setEditName(name);
    setEditFilters(filters);
    setDialogMode("edit");
  };

  const handleBackToView = () => {
    setDialogMode("view");
    setEditingFilter(null);
    setEditName("");
    setEditFilters(null);
  };

  const isValidEditDateRange = useMemo(() => {
    if (!editFilters) return true;

    const { yearFrom, monthFrom, yearTo, monthTo } = editFilters;

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
  }, [editFilters]);

  const handleEditFilterChange = (field: string, value: string) => {
    setEditFilters((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveEdit = async () => {
    if (!editingFilter || !editName.trim() || !editFilters) {
      toast.error("Filter name cannot be empty");
      return;
    }

    if (!isValidEditDateRange) {
      toast.error("Invalid date range");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/saved-filters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFilter.id,
          name: editName.trim(),
          filters: editFilters,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSavedFilters((prev) =>
          prev.map((f) => (f.id === updated.id ? updated : f))
        );
        toast.success("Filter updated successfully");
        handleBackToView();
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast.error("Failed to update filter");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFilter = async () => {
    if (!filterToDelete) return;

    setDeletingId(filterToDelete.id);
    try {
      const res = await fetch(`/api/saved-filters?id=${filterToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedFilters((prev) =>
          prev.filter((f) => f.id !== filterToDelete.id)
        );
        toast.success("Filter deleted");
      } else throw new Error("Failed to delete");
    } catch (error) {
      toast.error("Failed to delete filter");
    } finally {
      setDeletingId(null);
      setFilterToDelete(null);
    }
  };

  const handleViewModeChange = (mode: "grid" | "map") => {
    if (mode === "map" && !isPremium) {
      setOpenPremiumDialog(true);
    } else {
      onViewModeChange(mode);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setOpenSavedFilters(open);
    if (!open) {
      setDialogMode("view");
      setEditingFilter(null);
      setEditName("");
      setEditFilters(null);
    }
  };

  const getFilterSummary = (filters: any) => {
    const items = [];

    if (filters.askingPrice) {
      items.push({
        icon: <CreditCard className="h-3 w-3" />,
        label: `≤ $${Number(filters.askingPrice).toLocaleString()}`,
      });
    }
    if (filters.town) {
      items.push({ icon: <MapPin className="h-3 w-3" />, label: filters.town });
    }
    if (filters.flatType) {
      items.push({
        icon: <Home className="h-3 w-3" />,
        label: filters.flatType,
      });
    }
    if (
      filters.monthFrom ||
      filters.monthTo ||
      filters.yearFrom ||
      filters.yearTo
    ) {
      const from = [filters.monthFrom, filters.yearFrom]
        .filter(Boolean)
        .join(" ");
      const to = [filters.monthTo, filters.yearTo].filter(Boolean).join(" ");
      const dateRange = [from, to].filter(Boolean).join(" - ");
      items.push({ icon: <Calendar className="h-3 w-3" />, label: dateRange });
    }
    if (filters.minArea || filters.maxArea) {
      items.push({
        icon: <Maximize2 className="h-3 w-3" />,
        label: `${filters.minArea || 0}-${filters.maxArea || "∞"} sqm`,
      });
    }
    if (filters.minStorey || filters.maxStorey) {
      items.push({
        icon: <Layers className="h-3 w-3" />,
        label: `Lvl ${filters.minStorey || 1}-${filters.maxStorey || "∞"}`,
      });
    }

    return items;
  };

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
        <nav className="w-full flex justify-center py-3 bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="grid grid-cols-3 items-center w-full max-w-7xl">
            <Link
              href="/"
              className="font-semibold text-lg text-primary flex items-center"
            >
              <TrendingUp
                className="mr-2 text-primary"
                size={20}
                strokeWidth={3}
              />
              Resale Viewer
            </Link>

            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className={viewMode === "grid" ? "" : "hover:bg-gray-200"}
                >
                  <Grid3x3 size={16} /> Grid
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("map")}
                  className={cn(
                    viewMode === "map" ? "" : "hover:bg-gray-200",
                    !isPremium &&
                      "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {isPremium ? <Map size={16} /> : <Lock size={16} />}
                  Map
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 px-0"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userImage} alt={userName} />
                        <AvatarFallback>
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm">
                        {userName.split(" ")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link
                        href="/subscription"
                        className="flex items-center w-full"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>

                    <Dialog
                      open={openSavedFilters}
                      onOpenChange={handleDialogClose}
                    >
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Heart className="mr-2 h-4 w-4" />
                          Saved Filters
                          {savedFilters.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-white"
                            >
                              {savedFilters.length}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      </DialogTrigger>

                      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                        {/* View Mode */}
                        {dialogMode === "view" && (
                          <>
                            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-secondary-100 to-white">
                              <DialogTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 rounded-lg">
                                  <Heart className="text-red-600" size={24} />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Saved Filters
                                  </div>
                                  <DialogDescription className="text-sm mt-0.5">
                                    {savedFilters.length === 0
                                      ? "No saved filters yet"
                                      : `${savedFilters.length} saved ${
                                          savedFilters.length === 1
                                            ? "filter"
                                            : "filters"
                                        }`}
                                  </DialogDescription>
                                </div>
                              </DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-4">
                              {savedFilters.length === 0 ? (
                                <div className="text-center py-16">
                                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <Heart className="h-8 w-8 text-red-600" />
                                  </div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No saved filters yet
                                  </h3>
                                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    Save your search filters for quick access
                                    later. Apply your preferred settings and
                                    click "Save Filter" to get started.
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {savedFilters.map((f) => {
                                    const summary = getFilterSummary(f.filters);
                                    return (
                                      <div
                                        key={f.id}
                                        className="group relative rounded-xl border-2 border-gray-200 hover:border-secondary-400 bg-white transition-all duration-200 overflow-hidden"
                                      >
                                        <div
                                          onClick={() =>
                                            handleSelectFilter(
                                              f.filters,
                                              f.name
                                            )
                                          }
                                          className="p-5 cursor-pointer"
                                        >
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                              <h3 className="font-semibold text-base text-gray-900 transition-colors truncate">
                                                {f.name}
                                              </h3>
                                              <p className="text-xs text-gray-500 mt-1">
                                                Saved on{" "}
                                                {new Date(
                                                  f.createdAt
                                                ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                })}
                                              </p>
                                            </div>
                                          </div>

                                          {summary.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {summary.map((item, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant="secondary"
                                                  className="text-xs font-normal bg-secondary-50 text-secondary-700 border-secondary-200 hover:bg-secondary-100 px-2 py-0.5"
                                                >
                                                  <span className="mr-1">
                                                    {item.icon}
                                                  </span>
                                                  {item.label}
                                                </Badge>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-gray-400 italic">
                                              No filters applied
                                            </p>
                                          )}
                                        </div>

                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditClick(
                                                f.id,
                                                f.name,
                                                f.filters
                                              );
                                            }}
                                            disabled={deletingId === f.id}
                                            className="h-8 w-8 p-0 bg-white hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-gray-200"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setFilterToDelete({
                                                id: f.id,
                                                name: f.name,
                                              });
                                            }}
                                            disabled={deletingId === f.id}
                                            className="h-8 w-8 p-0 bg-white hover:bg-red-50 hover:text-red-600 shadow-sm border border-gray-200"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/5 to-secondary-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {savedFilters.length > 0 && (
                              <div className="px-6 py-4 border-t bg-gray-50">
                                <p className="text-xs text-gray-500 text-center">
                                  Click a filter to apply it • Hover to edit or
                                  delete
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Edit Mode */}
                        {dialogMode === "edit" && editFilters && (
                          <>
                            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-blue-50 to-white">
                              <DialogTitle className="flex items-center gap-3 text-xl">
                                <ArrowLeft
                                  size={24}
                                  onClick={handleBackToView}
                                  className="p-0 -ml-2 cursor-pointer"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    Edit Filter
                                  </div>
                                  <DialogDescription className="text-sm mt-0.5">
                                    Update the name and criteria for this saved
                                    filter
                                  </DialogDescription>
                                </div>
                              </DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="edit-filter-name"
                                  className="text-sm font-medium"
                                >
                                  Filter Name
                                </Label>
                                <Input
                                  id="edit-filter-name"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Enter filter name"
                                />
                              </div>

                              <Separator />

                              <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-700">
                                  Filter Criteria
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">
                                      Asking Price
                                    </Label>
                                    <div className="relative">
                                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                        $
                                      </div>
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="e.g. 500000"
                                        value={editFilters.askingPrice || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (
                                            value === "" ||
                                            /^\d*\.?\d*$/.test(value)
                                          ) {
                                            handleEditFilterChange(
                                              "askingPrice",
                                              value
                                            );
                                          }
                                        }}
                                        className="pl-7"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm">Town</Label>
                                    <Select
                                      value={editFilters.town || "all"}
                                      onValueChange={(v) =>
                                        handleEditFilterChange(
                                          "town",
                                          v === "all" ? "" : v
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="All Towns" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {towns.map((town) => (
                                          <SelectItem key={town} value={town}>
                                            {town === "all"
                                              ? "All Towns"
                                              : town}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm">Flat Type</Label>
                                    <Select
                                      value={editFilters.flatType || "all"}
                                      onValueChange={(v) =>
                                        handleEditFilterChange(
                                          "flatType",
                                          v === "all" ? "" : v
                                        )
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

                                  <div className="space-y-2">
                                    <Label className="text-sm">Sort By</Label>
                                    <Select
                                      value={editFilters.sortBy || "price-asc"}
                                      onValueChange={(v) =>
                                        handleEditFilterChange("sortBy", v)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="price-asc">
                                          Price: Low to High
                                        </SelectItem>
                                        <SelectItem value="price-desc">
                                          Price: High to Low
                                        </SelectItem>
                                        <SelectItem value="area-asc">
                                          Area: Small to Large
                                        </SelectItem>
                                        <SelectItem value="area-desc">
                                          Area: Large to Small
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <Separator />

                                <h3 className="text-sm font-semibold text-gray-700">
                                  Advanced Criteria
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm">
                                      Transaction Period From
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Select
                                        value={editFilters.yearFrom || "any"}
                                        onValueChange={(v) =>
                                          handleEditFilterChange(
                                            "yearFrom",
                                            v === "any" ? "" : v
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="any">
                                            Any Year
                                          </SelectItem>
                                          {years.map((year) => (
                                            <SelectItem
                                              key={year}
                                              value={year.toString()}
                                            >
                                              {year}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={editFilters.monthFrom || "any"}
                                        onValueChange={(v) =>
                                          handleEditFilterChange(
                                            "monthFrom",
                                            v === "any" ? "" : v
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="any">
                                            Any Month
                                          </SelectItem>
                                          {months.map((m) => (
                                            <SelectItem
                                              key={m.value}
                                              value={m.value}
                                            >
                                              {m.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm">
                                      Transaction Period To
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Select
                                        value={editFilters.yearTo || "any"}
                                        onValueChange={(v) =>
                                          handleEditFilterChange(
                                            "yearTo",
                                            v === "any" ? "" : v
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="any">
                                            Any Year
                                          </SelectItem>
                                          {years.map((year) => (
                                            <SelectItem
                                              key={year}
                                              value={year.toString()}
                                            >
                                              {year}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={editFilters.monthTo || "any"}
                                        onValueChange={(v) =>
                                          handleEditFilterChange(
                                            "monthTo",
                                            v === "any" ? "" : v
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="any">
                                            Any Month
                                          </SelectItem>
                                          {months.map((m) => (
                                            <SelectItem
                                              key={m.value}
                                              value={m.value}
                                            >
                                              {m.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>

                                {!isValidEditDateRange && (
                                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle
                                      size={16}
                                      className="flex-shrink-0"
                                    />
                                    <span>
                                      Invalid date range: The 'From' date must
                                      be before the 'To' date
                                    </span>
                                  </div>
                                )}

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm">
                                        Floor Area
                                      </Label>
                                      <span className="text-xs text-gray-600">
                                        {editFilters.minArea || 30} -{" "}
                                        {editFilters.maxArea || 250} sqm
                                      </span>
                                    </div>
                                    <Slider
                                      min={30}
                                      max={250}
                                      step={5}
                                      value={[
                                        Number(editFilters.minArea || 30),
                                        Number(editFilters.maxArea || 250),
                                      ]}
                                      onValueChange={([min, max]) => {
                                        handleEditFilterChange(
                                          "minArea",
                                          min.toString()
                                        );
                                        handleEditFilterChange(
                                          "maxArea",
                                          max.toString()
                                        );
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm">
                                        Storey Range
                                      </Label>
                                      <span className="text-xs text-gray-600">
                                        Level {editFilters.minStorey || 1} -{" "}
                                        {editFilters.maxStorey || 50}
                                      </span>
                                    </div>
                                    <Slider
                                      min={1}
                                      max={50}
                                      step={1}
                                      value={[
                                        Number(editFilters.minStorey || 1),
                                        Number(editFilters.maxStorey || 50),
                                      ]}
                                      onValueChange={([min, max]) => {
                                        handleEditFilterChange(
                                          "minStorey",
                                          min.toString()
                                        );
                                        handleEditFilterChange(
                                          "maxStorey",
                                          max.toString()
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={handleBackToView}
                                disabled={isSaving}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveEdit}
                                disabled={
                                  isSaving ||
                                  !editName.trim() ||
                                  !isValidEditDateRange
                                }
                              >
                                {isSaving ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="highlight">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AlertDialog
        open={!!filterToDelete}
        onOpenChange={(open) => !open && setFilterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved filter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{filterToDelete?.name}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFilter}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PremiumFeatureDialog
        openPremiumDialog={openPremiumDialog}
        setOpenPremiumDialog={setOpenPremiumDialog}
      />
    </>
  );
}
