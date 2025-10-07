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
  const pageSize = 5000; // increase page size to reduce number of requests
  const allRecords: any[] = [];

  const requests: Promise<void>[] = [];

  // Estimate number of pages (~200k rows / 5k = 40 pages)
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

// ---- Build cache map with grouped averages ----
async function buildCache() {
  const allRecords = await fetchAllRecords();
  const grouped: Record<
    string,
    Record<
      string,
      {
        totalPrice: number;
        count: number;
        floor_area_sqm: number;
        remaining_lease_years: number;
        storey_range: string;
      }
    >
  > = {};

  for (const r of allRecords) {
    const town = r.town?.trim();
    const flatType = r.flat_type?.trim();
    const month = r.month;
    const price = parseFloat(r.resale_price);
    const floor_area_sqm = parseFloat(r.floor_area_sqm);
    const remaining_lease_years = parseFloat(r.remaining_lease);

    if (!town || !flatType || !month || isNaN(price)) continue;

    const key = `${town.toLowerCase()}|${flatType.toLowerCase()}`;
    if (!grouped[key]) grouped[key] = {};
    if (!grouped[key][month])
      grouped[key][month] = {
        totalPrice: 0,
        count: 0,
        floor_area_sqm,
        remaining_lease_years,
        storey_range: r.storey_range,
      };

    grouped[key][month].totalPrice += price;
    grouped[key][month].count += 1;
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
        avgPrice: Number((data.totalPrice / data.count).toFixed(2)),
      }));

    const latestMonth = trend[trend.length - 1];
    const latestData = monthData[latestMonth.date];

    cacheMap[key] = [
      {
        id: idCounter++,
        title: `${flatType} in ${town}`,
        town,
        flatType,
        date: latestMonth.date,
        price: Number(latestMonth.avgPrice.toFixed(2)),
        trend,
        floor_area_sqm: Number(latestData.floor_area_sqm.toFixed(2)),
        remaining_lease_years: Number(
          latestData.remaining_lease_years.toFixed(2)
        ),
        storey_range: latestData.storey_range,
      },
    ];
  }

  lastFetched = Date.now();
  console.log("Cache built with", Object.keys(cacheMap).length, "keys");
}

// ---- Get cached data ----
async function getCache() {
  if (!Object.keys(cacheMap).length || Date.now() - lastFetched > CACHE_TTL) {
    console.log("Rebuilding cache...");
    await buildCache();
  }
  return cacheMap;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const townFilter = searchParams.get("town")?.toLowerCase();
    const flatTypeFilter = searchParams.get("flatType")?.toLowerCase();
    const sortBy = searchParams.get("sortBy") || "price-asc";
    const page = parseInt(searchParams.get("page") || "1");
    const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "6");

    const cache = await getCache();

    // Filter
    const filtered: Property[] = [];
    for (const [key, props] of Object.entries(cache)) {
      const [town, flatType] = key.split("|");
      if (
        (townFilter && town !== townFilter) ||
        (flatTypeFilter && flatType !== flatTypeFilter)
      )
        continue;
      filtered.push(...props);
    }

    // Sort
    if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc")
      filtered.sort((a, b) => b.price - a.price);

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    const response = NextResponse.json({
      data: paginated,
      total,
      totalPages,
      allProperties: filtered, // for frontend fairness calculation
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
