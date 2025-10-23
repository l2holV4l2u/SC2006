"use client";

import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { DashboardNavbar } from "@/components/custom/navbar";
import { FilterSection } from "./filter";
import { PropertyCard } from "./propertyCard";
import { PaginationControl } from "./paginationControl";
import { PropertyMap } from "./propertyMap";
import { loadingAtom, paginationAtom, propertyAtom } from "@/lib/propertyAtom";

export default function PropertyListingPage() {
  const property = useAtomValue(propertyAtom);
  const loading = useAtomValue(loadingAtom);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [pagination, setPagination] = useAtom(paginationAtom);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="container mx-auto px-4 py-6 space-y-6 mt-12 max-w-6xl">
        <FilterSection />
        {viewMode === "map" ? (
          <PropertyMap />
        ) : property.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-500">
            No properties found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[24rem]">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded bg-gray-100 animate-pulse h-48"
                  />
                ))
              : property.map((p) => <PropertyCard key={p.id} property={p} />)}
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
