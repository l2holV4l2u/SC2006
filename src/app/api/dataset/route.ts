import { parse, isAfter, isBefore } from "date-fns";
import { NextResponse } from "next/server";
import { Property } from "@/type";

const DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
const BASE_URL = "https://data.gov.sg/api/action/datastore_search";

// ---- In-memory cache ----
let cacheMap: Record<string, Property[]> = {}; // key = "town|flatType"
let lastFetched = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

// ---- Fetch all pages ----
async function fetchAllRecords() {
  const pageSize = 5000;
  const allRecords: any[] = [];
  const requests: Promise<void>[] = [];
  const totalPagesEstimate = 50;

  for (let i = 0; i < totalPagesEstimate; i++) {
    const currentOffset = i * pageSize;
    const url = `${BASE_URL}?resource_id=${DATASET_ID}&limit=${pageSize}&offset=${currentOffset}`;

    const req = fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const records = data.result.records;
        if (records && records.length > 0) {
          allRecords.push(...records);
        }
      })
      .catch((err) => {
        console.error(`Failed to fetch offset ${currentOffset}:`, err);
      });

    requests.push(req);
  }

  await Promise.all(requests);
  console.log(`Fetched total ${allRecords.length} records.`);
  return allRecords;
}

// ---- Build cache map with individual data points ----
async function buildCache() {
  const allRecords = await fetchAllRecords();
  const grouped: Record<
    string,
    Record<
      string,
      {
        prices: number[];
        floorAreas: number[];
        storeyRanges: string[];
      }
    >
  > = {};

  for (const r of allRecords) {
    const town = r.town?.trim();
    const flatType = r.flat_type?.trim();
    const month = r.month;
    const price = parseFloat(r.resale_price);
    const floor_area_sqm = parseFloat(r.floor_area_sqm);
    const storey_range = r.storey_range?.trim();

    if (!town || !flatType || !month || isNaN(price)) continue;

    const key = `${town.toLowerCase()}|${flatType.toLowerCase()}`;
    if (!grouped[key]) grouped[key] = {};
    if (!grouped[key][month])
      grouped[key][month] = {
        prices: [],
        floorAreas: [],
        storeyRanges: [],
      };

    grouped[key][month].prices.push(price);
    grouped[key][month].floorAreas.push(floor_area_sqm || 0);
    if (storey_range) {
      grouped[key][month].storeyRanges.push(storey_range);
    }
  }

  // Build Property arrays
  cacheMap = {};
  let idCounter = 0;

  for (const [key, monthData] of Object.entries(grouped)) {
    const [town, flatType] = key.split("|");

    const trend = Object.entries(monthData)
      .sort(([aMonth], [bMonth]) => aMonth.localeCompare(bMonth))
      .map(([month, data]) => ({
        date: month,
        prices: data.prices,
        floor_areas: data.floorAreas,
        storey_ranges: data.storeyRanges,
        // Keep averages for backward compatibility
        avgPrice: Number(
          (data.prices.reduce((a, b) => a + b, 0) / data.prices.length).toFixed(
            2
          )
        ),
        floor_area_sqm: Number(
          (
            data.floorAreas.reduce((a, b) => a + b, 0) / data.floorAreas.length
          ).toFixed(2)
        ),
        storey_range: getMostCommonStoreyRange(data.storeyRanges),
      }));

    const latestMonth = trend[trend.length - 1];

    cacheMap[key] = [
      {
        id: idCounter++,
        title: `${flatType} in ${town}`,
        town,
        flatType,
        date: latestMonth.date,
        price: latestMonth.avgPrice,
        trend,
        floor_area_sqm: latestMonth.floor_area_sqm,
        storey_range: latestMonth.storey_range,
      },
    ];
  }

  lastFetched = Date.now();
  console.log("Cache built with", Object.keys(cacheMap).length, "keys");
}

// Helper to get most common storey range from an array
function getMostCommonStoreyRange(storeyRanges: string[]): string {
  if (storeyRanges.length === 0) return "";

  const counts: Record<string, number> = {};
  for (const range of storeyRanges) {
    counts[range] = (counts[range] || 0) + 1;
  }

  let maxCount = 0;
  let mostCommon = storeyRanges[0];
  for (const [range, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = range;
    }
  }

  return mostCommon;
}

// ---- Get cached data ----
async function getCache() {
  if (!Object.keys(cacheMap).length || Date.now() - lastFetched > CACHE_TTL) {
    console.log("Rebuilding cache...");
    await buildCache();
  }
  return cacheMap;
}

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
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "6");

    // Advanced filters
    const monthFrom = searchParams.get("monthFrom"); // YYYY-MM
    const monthTo = searchParams.get("monthTo"); // YYYY-MM
    const minArea = parseFloat(searchParams.get("minArea") || "0");
    const maxArea = parseFloat(searchParams.get("maxArea") || "0");
    const minStorey = parseInt(searchParams.get("minStorey") || "0");
    const maxStorey = parseInt(searchParams.get("maxStorey") || "0");
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
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
