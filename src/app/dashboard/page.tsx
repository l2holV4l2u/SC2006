"use client";
import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/custom/navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Property, FairnessOutput, Filters } from "@/type";
import { FilterSection } from "./filter";
import { PropertyCard } from "./propertyCard";
import { PaginationControl } from "./paginationControl";

export default function PropertyListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fairnessMap, setFairnessMap] = useState<
    Record<string, FairnessOutput>
  >({});
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const itemsPerPage = 6;

  // filters state moved up
  const [filters, setFilters] = useState({
    askingPrice: "",
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    const fetchDataset = async () => {
      const res = await fetch("/api/dataset?all=true");
      const data = await res.json();
      setDataset(data.data || []);
    };
    fetchDataset();
  }, []);

  useEffect(() => {
    if (dataset.length > 0) fetchProperties(filters);
  }, [pagination.page, dataset]);

  const fetchProperties = async (filters: Filters) => {
    setLoading(true);
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      page: pagination.page.toString(),
      itemsPerPage: itemsPerPage.toString(),
    });
    const res = await fetch(`/api/dataset?${params.toString()}`);
    const data = await res.json();
    setProperties(data.data);
    setPagination((prev) => ({
      ...prev,
      total: data.total,
      totalPages: data.totalPages,
    }));
    setLoading(false);
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
        />

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

        {pagination.totalPages > 1 && (
          <PaginationControl
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page: any) => setPagination((p) => ({ ...p, page }))}
          />
        )}
      </div>
    </div>
  );
}
