"use client";

import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Property, FairnessOutput, Filters, Coeffs } from "@/type";
import { FilterSection } from "./filter";
import { PropertyCard } from "./propertyCard";
import { PaginationControl } from "./paginationControl";
import { getDefaultStore } from "jotai";
import { askingPriceAtom } from "@/lib/propertyAtom";

// Default hedonic coefficients - adjust based on your model
const DEFAULT_COEFFS: Coeffs = {
  beta_lease: 0.015, // Impact of remaining lease
  gamma_logarea: -0.15, // Impact of floor area (log scale)
};

export default function PropertyListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const store = getDefaultStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingFairness, setAnalyzingFairness] = useState(false);
  const [fairnessMap, setFairnessMap] = useState<
    Record<string, FairnessOutput>
  >({});
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const itemsPerPage = 9;

  // filters state
  const [filters, setFilters] = useState<Filters>({
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

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch properties when filters or pagination change
  useEffect(() => {
    fetchProperties(filters);
  }, [pagination.page]);

  const fetchProperties = async (filters: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        page: pagination.page.toString(),
        itemsPerPage: itemsPerPage.toString(),
      });

      const res = await fetch(`/api/dataset?${params.toString()}`);
      const data = await res.json();

      setProperties(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse remaining lease string to years
  const parseRemainingLease = (leaseStr: string): number => {
    if (!leaseStr) return 0;
    const yearsMatch = leaseStr.match(/(\d+)\s*years?/i);
    const monthsMatch = leaseStr.match(/(\d+)\s*months?/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
    return years + months / 12;
  };

  const handleAnalyzeFairness = async () => {
    setAnalyzingFairness(true);
    const newFairnessMap: Record<string, FairnessOutput> = {};
    const askingPrice = store.get(askingPriceAtom);
    try {
      await Promise.all(
        properties.map(async (property) => {
          const subject = {
            town: property.town,
            flat_type: property.flatType,
            floor_area_sqm: property.floor_area_sqm,
            remaining_lease_years: parseRemainingLease(
              property.remaining_lease_years
            ),
            asking_price: askingPrice,
          };

          try {
            const response = await fetch("/api/fairness", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subject,
                coeffs: DEFAULT_COEFFS,
              }),
            });

            if (response.ok) {
              const result: FairnessOutput = await response.json();
              newFairnessMap[property.id] = result;
              console.log(result);
            } else {
              console.error(
                `Fairness analysis failed for property ${property.id}`
              );
            }
          } catch (error) {
            console.error(`Error analyzing property ${property.id}:`, error);
          }
        })
      );

      setFairnessMap(newFairnessMap);
    } catch (error) {
      console.error("Error during fairness analysis:", error);
    } finally {
      setAnalyzingFairness(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        <FilterSection
          filters={filters}
          setFilters={setFilters}
          total={pagination.total}
          loading={loading}
          onFilter={fetchProperties}
          onAnalyzeFairness={handleAnalyzeFairness}
        />

        {analyzingFairness && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700 font-medium">
              Analyzing price fairness...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[24rem]">
          {loading
            ? Array.from({ length: itemsPerPage }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded bg-gray-100 animate-pulse h-48"
                />
              ))
            : properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  fairness={fairnessMap[prop.id]}
                />
              ))}
        </div>

        {properties.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No properties found matching your criteria.
          </div>
        )}

        {pagination.totalPages > 1 && (
          <PaginationControl
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page: number) => setPagination((p) => ({ ...p, page }))}
          />
        )}
      </div>
    </div>
  );
}
