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
import { useEffect, useState } from "react";
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

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name ?? "User";
  const userImage = user?.image ?? "https://i.pravatar.cc/32";

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <nav className="w-full flex items-center justify-between py-3 px-6">
        {/* Logo Section */}
        <Link
          href="/"
          className="font-semibold text-lg text-white drop-shadow-lg flex items-center"
        >
          <TrendingUp className="mr-2" size={20} strokeWidth={3} />
          Resale Viewer
        </Link>

        {/* Navigation Links & User Menu */}
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

          {/* User Menu or Login Button */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex gap-2 items-center cursor-pointer">
                <Avatar className="h-8 w-8">
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

export function DashboardNavbar() {
  const { data: session } = useSession();
  const setFilters = useSetAtom(filtersAtom);
  const setAskingPrice = useSetAtom(askingPriceAtom);
  const [savedFilters, setSavedFilters] = useAtom(savedFiltersAtom);
  const [openSavedFilters, setOpenSavedFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterToDelete, setFilterToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const user = session?.user;
  const userName = user?.name ?? "User";
  const userImage = user?.image ?? "https://i.pravatar.cc/32";

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
    setAskingPrice(selectedFilters.askingPrice || "0");
    toast.success("Filter applied!");
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
        <nav className="w-full flex justify-center py-3 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between w-full max-w-7xl px-6">
            {/* Logo */}
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

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
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
            </div>
          </div>

          {/* User Menu */}
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

                {/* Saved Filters Dialog */}
                <Dialog
                  open={openSavedFilters}
                  onOpenChange={setOpenSavedFilters}
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

                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
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
                            Save your search filters for quick access later.
                            Apply your preferred settings and click "Save
                            Filter" to get started.
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
                                    handleSelectFilter(f.filters, f.name)
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

                                {/* Delete Button */}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          Click a filter to apply it • Hover to delete
                        </p>
                      </div>
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
        </nav>
      </header>

      {/* Delete Confirmation */}
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
    </>
  );
}
