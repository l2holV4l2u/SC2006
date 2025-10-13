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
import { filtersAtom, savedFiltersAtom } from "@/lib/propertyAtom";
import { toast } from "sonner";

export function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <nav className="container flex items-center justify-between py-4 px-6">
        <Link
          href="/"
          className="font-semibold text-lg text-white drop-shadow-lg"
        >
          Resale Viewer
        </Link>
        <div className="flex gap-4">
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
          <Link href="/login">
            <Button variant="highlight">Login</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function DashboardNavbar() {
  const { data: session } = useSession();
  const setFilters = useSetAtom(filtersAtom);
  const [savedFilters, setSavedFilters] = useAtom(savedFiltersAtom);
  const [openSavedFilters, setOpenSavedFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const user = session?.user;
  const userName = user?.name ?? "User";
  const userImage = user?.image ?? "https://i.pravatar.cc/32";

  // Fetch saved filters on mount
  useEffect(() => {
    if (session) {
      fetch("/api/saved-filters")
        .then((res) => res.json())
        .then((data) => setSavedFilters(data))
        .catch(console.error);
    }
  }, [session, setSavedFilters]);

  const handleSelectFilter = (selectedFilters: any, filterName: string) => {
    setFilters(selectedFilters);
    setOpenSavedFilters(false);
    toast.success("Filter applied!", {
      description: `"${filterName}" has been applied to your search.`,
    });
  };

  const handleDeleteFilter = async (
    id: string,
    name: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    setDeletingId(id);
    try {
      const res = await fetch(`/api/saved-filters/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedFilters((prev) => prev.filter((f) => f.id !== id));
        toast.success("Filter deleted", {
          description: `"${name}" has been removed from your saved filters.`,
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete filter", {
        description: "Please try again later.",
      });
    } finally {
      setDeletingId(null);
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
      items.push({
        icon: <MapPin className="h-3 w-3" />,
        label: filters.town,
      });
    }
    if (filters.flatType) {
      items.push({
        icon: <Home className="h-3 w-3" />,
        label: filters.flatType,
      });
    }
    if (filters.monthFrom || filters.monthTo) {
      const dateRange = [filters.monthFrom, filters.monthTo]
        .filter(Boolean)
        .join(" - ");
      items.push({
        icon: <Calendar className="h-3 w-3" />,
        label: dateRange,
      });
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
      <nav className="container flex items-center justify-between py-3 px-6 mx-auto max-w-6xl justify-self-center">
        {/* Logo Section */}
        <div className="flex items-center space-x-6">
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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-600 font-medium"
              >
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
                <span className="hidden md:inline text-sm text-gray-700">
                  {userName.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/subscription" className="flex items-center w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
              </DropdownMenuItem>

              <Dialog
                open={openSavedFilters}
                onOpenChange={setOpenSavedFilters}
              >
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Heart className="mr-2 h-4 w-4" />
                    Saved Filters
                    {savedFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {savedFilters.length}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Your Saved Filters
                    </DialogTitle>
                    <DialogDescription>
                      Click on a filter to apply it to your search
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {savedFilters.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No saved filters yet.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Save your search filters for quick access later
                        </p>
                      </div>
                    ) : (
                      savedFilters.map((f) => {
                        const summary = getFilterSummary(f.filters);
                        return (
                          <div
                            key={f.id}
                            onClick={() =>
                              handleSelectFilter(f.filters, f.name)
                            }
                            className="group relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {f.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(f.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleDeleteFilter(f.id, f.name, e)
                                }
                                disabled={deletingId === f.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Filter Summary */}
                            {summary.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {summary.map((item, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs font-normal bg-gray-100 text-gray-700 hover:bg-gray-100"
                                  >
                                    <span className="mr-1">{item.icon}</span>
                                    {item.label}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                Default filters
                              </p>
                            )}

                            {/* Hover indicator */}
                            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity" />
                          </div>
                        );
                      })
                    )}
                  </div>
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

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </nav>
    </header>
  );
}
