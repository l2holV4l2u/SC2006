import { parse, isAfter, isBefore } from "date-fns";
import { NextResponse } from "next/server";
import { Property } from "@/type";
import { getCache, parseRemainingLease } from "@/lib/dataset";
import { auth } from "@/lib/auth";

// Helper to check if storey range overlaps with filter range
function storeyInRange(
  storeyRange: string | undefined,
  minStorey: number | null,
  maxStorey: number | null
): boolean {
  if (minStorey === null && maxStorey === null) return true;
  if (!storeyRange) return false;

  const match = storeyRange.match(/(\d+)\s+TO\s+(\d+)/i);
  if (!match) return false;

  const rangeMin = parseInt(match[1]);
  const rangeMax = parseInt(match[2]);

  if (minStorey !== null && rangeMin < minStorey) return false;
  if (maxStorey !== null && rangeMax > maxStorey) return false;

  return true;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPremium = session.user.role === "PREMIUM";

    const { searchParams } = new URL(req.url);

    // Basic filters
    const townFilter = searchParams.get("town")?.toLowerCase();
    const flatTypeFilter = searchParams.get("flatType")?.toLowerCase();
    const sortBy = searchParams.get("sortBy") || "price-asc";
    const page = parseInt(searchParams.get("page") || "1");
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "9");

    // Advanced filters
    const monthFrom = searchParams.get("monthFrom");
    const monthTo = searchParams.get("monthTo");
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

    const returnAll = searchParams.get("all") === "true";
    const cache = await getCache();

    // Filter
    const filtered: Property[] = [];

    for (const [key, props] of Object.entries(cache)) {
      const [town, flatType] = key.split("|");

      for (const prop of props) {
        if (townFilter && town !== townFilter) continue;
        if (flatTypeFilter && flatType !== flatTypeFilter) continue;

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

              const floorAreas = Array.isArray(t.floor_area_sqm)
                ? t.floor_area_sqm
                : [];

              floorAreas.forEach((area, idx) => {
                const storeyRange = t.storey_range?.[idx];
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

              return {
                ...t,
                prices: filteredIndices.map((i) => t.prices[i]),
                floor_area_sqm: filteredIndices.map((i) => t.floor_area_sqm[i]),
                storey_range: filteredIndices.map((i) => t.storey_range[i]),
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

        const floorAreaArray = Array.isArray(latestTrend.floor_area_sqm)
          ? latestTrend.floor_area_sqm
          : [latestTrend.floor_area_sqm];

        const storeyRangeArray = Array.isArray(latestTrend.storey_range)
          ? latestTrend.storey_range
          : [latestTrend.storey_range];

        const leaseArray = Array.isArray(latestTrend.remaining_lease_years)
          ? latestTrend.remaining_lease_years
          : [latestTrend.remaining_lease_years];

        filtered.push({
          ...prop,
          price: latestTrend.avgPrice,
          date: latestTrend.date,
          floor_area_sqm: Number(
            (
              floorAreaArray.reduce((sum, a) => sum + a, 0) /
              floorAreaArray.length
            ).toFixed(2)
          ),
          storey_range:
            storeyRangeArray.length > 0
              ? storeyRangeArray[storeyRangeArray.length - 1]
              : "",
          remaining_lease_years: leaseArray[0] || "",
          trend: trendsInRange,
        });
      }
    }

    // Limit to 3 years of trend data for free users
    console.log(isPremium);
    if (!isPremium) {
      const { parse, subYears } = await import("date-fns");
      const cutoffDate = subYears(new Date(), 3);

      filtered.forEach((prop) => {
        prop.trend = prop.trend.filter((t) => {
          const d = parse(t.date, "yyyy-MM", new Date());
          return d >= cutoffDate;
        });
      });

      for (let i = filtered.length - 1; i >= 0; i--) {
        if (filtered[i].trend.length === 0) filtered.splice(i, 1);
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

    if (returnAll) {
      const response = NextResponse.json({
        data: filtered,
        total: filtered.length,
      });
      response.headers.set(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=3600"
      );
      response.headers.set("Vary", "Cookie");
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
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (err) {
    console.error("Dataset fetch error:", err);

    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

    errorResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return errorResponse;
  }
}
