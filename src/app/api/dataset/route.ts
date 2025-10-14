import { parse, isAfter, isBefore } from "date-fns";
import { NextResponse } from "next/server";
import { Property } from "@/type";
import { getCache, parseRemainingLease } from "@/lib/dataset";

// Helper to parse storey range and get midpoint
function getStoreyMidpoint(storeyRange: string): number {
  if (!storeyRange) return 0;
  const match = storeyRange.match(/(\d+)\s+TO\s+(\d+)/i);
  if (match) {
    return (parseInt(match[1]) + parseInt(match[2])) / 2;
  }
  return 0;
}

// Helper to check if storey range overlaps with filter range
function storeyInRange(
  storeyRange: string,
  minStorey: number | null,
  maxStorey: number | null
): boolean {
  if (minStorey === null && maxStorey === null) return true;

  const storeyMid = getStoreyMidpoint(storeyRange);
  if (storeyMid === 0) return false; // Invalid storey range

  if (minStorey !== null && storeyMid < minStorey) return false;
  if (maxStorey !== null && storeyMid > maxStorey) return false;

  return true;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Basic filters
    const townFilter = searchParams.get("town")?.toLowerCase();
    const flatTypeFilter = searchParams.get("flatType")?.toLowerCase();
    const sortBy = searchParams.get("sortBy") || "price-asc";
    const page = parseInt(searchParams.get("page") || "1");
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "9");

    // Advanced filters
    const monthFrom = searchParams.get("monthFrom"); // YYYY-MM
    const monthTo = searchParams.get("monthTo"); // YYYY-MM
    const minArea = searchParams.get("minArea")
      ? parseFloat(searchParams.get("minArea")!)
      : null;
    const maxArea = searchParams.get("maxArea")
      ? parseFloat(searchParams.get("maxArea")!)
      : null;
    const minStorey = searchParams.get("minStorey")
      ? parseInt(searchParams.get("minStorey")!)
      : null;
    const maxStorey = searchParams.get("maxStorey")
      ? parseInt(searchParams.get("maxStorey")!)
      : null;

    // Special flag to return all data for fairness calculations
    const returnAll = searchParams.get("all") === "true";
    const cache = await getCache();

    // Filter
    const filtered: Property[] = [];

    for (const [key, props] of Object.entries(cache)) {
      const [town, flatType] = key.split("|");

      for (const prop of props) {
        if (townFilter && town !== townFilter) continue;
        if (flatTypeFilter && flatType !== flatTypeFilter) continue;

        // Month range filter - filters trend data based on all criteria
        let trendsInRange = prop.trend;
        const from = monthFrom ? parse(monthFrom, "yyyy-MM", new Date()) : null;
        const to = monthTo ? parse(monthTo, "yyyy-MM", new Date()) : null;

        trendsInRange = prop.trend
          .map((t) => {
            const d = parse(t.date, "yyyy-MM", new Date());
            if (from && isBefore(d, from)) return null;
            if (to && isAfter(d, to)) return null;
            if (
              minArea !== null ||
              maxArea !== null ||
              minStorey !== null ||
              maxStorey !== null
            ) {
              const filteredIndices: number[] = [];
              t.floor_areas?.forEach((area, idx) => {
                const storeyRange = t.storey_ranges?.[idx];
                const areaMatch =
                  (minArea === null || area >= minArea) &&
                  (maxArea === null || area <= maxArea);
                const storeyMatch = storeyInRange(
                  storeyRange,
                  minStorey,
                  maxStorey
                );
                if (areaMatch && storeyMatch) filteredIndices.push(idx);
              });

              if (filteredIndices.length === 0) return null;

              // Calculate average remaining lease years from filtered indices
              // Note: We don't have individual lease years in the trend, so we keep the aggregate

              // Return filtered trend data
              return {
                ...t,
                prices: filteredIndices.map((i) => t.prices[i]),
                floor_areas: filteredIndices.map((i) => t.floor_areas[i]),
                storey_ranges: filteredIndices.map((i) => t.storey_ranges[i]),
                avgPrice: Number(
                  (
                    filteredIndices.reduce((sum, i) => sum + t.prices[i], 0) /
                    filteredIndices.length
                  ).toFixed(2)
                ),
              };
            }
            return t;
          })
          .filter((t) => t !== null);

        if (trendsInRange.length === 0) continue;
        const latestTrend = trendsInRange[trendsInRange.length - 1];
        filtered.push({
          ...prop,
          price: latestTrend.avgPrice,
          date: latestTrend.date,
          floor_area_sqm: latestTrend.floor_area_sqm,
          storey_range: latestTrend.storey_range,
          remaining_lease_years: latestTrend.remaining_lease_years,
          trend: trendsInRange,
        });
      }
    }

    // Sort
    if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc")
      filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "area-asc")
      filtered.sort((a, b) => a.floor_area_sqm - b.floor_area_sqm);
    else if (sortBy === "area-desc")
      filtered.sort((a, b) => b.floor_area_sqm - a.floor_area_sqm);
    else if (sortBy === "date-asc")
      filtered.sort((a, b) => a.date.localeCompare(b.date));
    else if (sortBy === "date-desc")
      filtered.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortBy === "lease-asc")
      filtered.sort((a, b) => {
        const aYears = parseRemainingLease(a.remaining_lease_years);
        const bYears = parseRemainingLease(b.remaining_lease_years);
        return aYears - bYears;
      });
    else if (sortBy === "lease-desc")
      filtered.sort((a, b) => {
        const aYears = parseRemainingLease(a.remaining_lease_years);
        const bYears = parseRemainingLease(b.remaining_lease_years);
        return bYears - aYears;
      });

    // If requesting all data (for fairness calculations)
    if (returnAll) {
      const response = NextResponse.json({
        data: filtered,
        total: filtered.length,
      });
      response.headers.set(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=3600"
      );
      return response;
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    const response = NextResponse.json({
      data: paginated,
      total,
      totalPages,
    });
    response.headers.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=3600"
    );
    return response;
  } catch (err) {
    console.error("Dataset fetch error:", err);

    // Do NOT set cache headers here
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

    // Ensure browsers/CDNs don’t cache this
    errorResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return errorResponse;
  }
}
