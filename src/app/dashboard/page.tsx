"use client";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { DashboardNavbar } from "@/components/custom/navbar";
import { FilterSection } from "./filter";
import { PropertyCard } from "./propertyCard";
import { PaginationControl } from "./paginationControl";
import { fairnessMapAtom, filtersAtom, propertyAtom } from "@/lib/propertyAtom";

export default function PropertyListingPage() {
  const filters = useAtomValue(filtersAtom);
  const fairnessMap = useAtomValue(fairnessMapAtom);
  const [property, setProperty] = useAtom(propertyAtom);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const itemsPerPage = 9;

  // Fetch properties whenever filters or pagination change
  useEffect(() => {
    fetchProperties(filters);
  }, [pagination.page]);

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

      setProperty(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperty([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        <FilterSection
          total={pagination.total}
          loading={loading}
          onFilter={fetchProperties}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[24rem]">
          {loading
            ? Array.from({ length: itemsPerPage }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded bg-gray-100 animate-pulse h-48"
                />
              ))
            : property.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  fairness={fairnessMap[p.id]}
                />
              ))}
        </div>

        {property.length === 0 && !loading && (
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
