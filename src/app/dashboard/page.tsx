"use client";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { DashboardNavbar } from "@/components/custom/navbar";
import { Property, FairnessOutput, Coeffs } from "@/type";
import { FilterSection } from "./filter";
import { PropertyCard } from "./propertyCard";
import { PaginationControl } from "./paginationControl";
import { filtersAtom, askingPriceAtom } from "@/lib/propertyAtom";

const DEFAULT_COEFFS: Coeffs = {
  beta_lease: 0.015,
  gamma_logarea: -0.15,
};

export default function PropertyListingPage() {
  const filters = useAtomValue(filtersAtom);
  const [askingPrice] = useAtom(askingPriceAtom);

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

  // Fetch properties whenever filters or pagination change
  useEffect(() => {
    fetchProperties(filters);
  }, [filters, pagination.page]);

  const fetchProperties = async (currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(currentFilters).filter(([_, v]) => v)
        ),
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

  useEffect(() => {
    if (!askingPrice) return;

    const timeout = setTimeout(() => {
      handleAnalyzeFairness();
    }, 2000); // wait 2 seconds after last change

    return () => clearTimeout(timeout); // cleanup if askingPrice changes again
  }, [askingPrice]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        <FilterSection
          total={pagination.total}
          loading={loading}
          onFilter={fetchProperties}
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
