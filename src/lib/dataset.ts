import { Property } from "@/type";

const DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
const BASE_URL = "https://data.gov.sg/api/action/datastore_search";

// ---- Cache configuration ----
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// ---- Global cache (persists across requests in same process) ----
type CacheData = {
  data: Record<string, Property[]>;
  timestamp: number;
};

// Using globalThis to persist cache across hot reloads in development
const globalForCache = globalThis as unknown as {
  propertyCache: CacheData | undefined;
};

// ----------------- Fetch helpers -----------------
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
        if (records?.length > 0) allRecords.push(...records);
      })
      .catch((err) =>
        console.error(`Failed to fetch offset ${currentOffset}:`, err)
      );

    requests.push(req);
  }

  await Promise.all(requests);
  console.log(`Fetched total ${allRecords.length} records from API.`);
  return allRecords;
}

export function parseRemainingLease(leaseStr: string): number {
  if (!leaseStr) return 0;
  const yearsMatch = leaseStr.match(/(\d+)\s*years?/i);
  const monthsMatch = leaseStr.match(/(\d+)\s*months?/i);
  const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
  const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
  return years + months / 12;
}

function getMostCommonStoreyRange(storeyRanges: string[]): string {
  if (storeyRanges.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const range of storeyRanges) counts[range] = (counts[range] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function formatRemainingLease(years: number): string {
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  return months === 0
    ? `${wholeYears} years`
    : `${wholeYears} years ${months} months`;
}

// ----------------- Cache builder -----------------
async function buildCache(): Promise<Record<string, Property[]>> {
  console.log("Building cache from API...");
  const startTime = Date.now();

  const allRecords = await fetchAllRecords();
  const grouped: Record<string, Record<string, any>> = {};

  for (const r of allRecords) {
    const town = r.town?.trim();
    const flatType = r.flat_type?.trim();
    const month = r.month;
    const price = parseFloat(r.resale_price);
    const floor_area_sqm = parseFloat(r.floor_area_sqm);
    const storey_range = r.storey_range?.trim();
    const remaining_lease = parseRemainingLease(r.remaining_lease || "");

    if (!town || !flatType || !month || isNaN(price)) continue;
    const key = `${town.toLowerCase()}|${flatType.toLowerCase()}`;

    grouped[key] ??= {};
    grouped[key][month] ??= {
      prices: [],
      floorAreas: [],
      storeyRanges: [],
      remainingLeaseYears: [],
    };

    grouped[key][month].prices.push(price);
    grouped[key][month].floorAreas.push(floor_area_sqm);
    grouped[key][month].storeyRanges.push(storey_range);
    grouped[key][month].remainingLeaseYears.push(remaining_lease);
  }

  const cacheMap: Record<string, Property[]> = {};
  let idCounter = 0;

  for (const [key, monthData] of Object.entries(grouped)) {
    const [town, flatType] = key.split("|");

    const trend = Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => {
        const avgPrice =
          data.prices.reduce((a: number, b: number) => a + b, 0) /
          data.prices.length;

        return {
          date: month,
          // Individual data points (arrays)
          prices: data.prices,
          floor_area: data.floorAreas, // Kept for compatibility
          floor_area_sqm: data.floorAreas, // Array of floor areas
          storey_range: data.storeyRanges, // Array of storey ranges
          remaining_lease_years: data.remainingLeaseYears.map((lease: number) =>
            formatRemainingLease(lease)
          ), // Array of lease strings, one per record
          // Aggregated values
          avgPrice: avgPrice,
        };
      });

    const latestMonth = trend.at(-1)!;

    // Calculate aggregated values for the property
    const avgFloorArea =
      latestMonth.floor_area_sqm.reduce((a: number, b: number) => a + b, 0) /
      latestMonth.floor_area_sqm.length;

    cacheMap[key] = [
      {
        id: idCounter++,
        title: `${flatType} in ${town}`,
        town,
        flatType,
        date: latestMonth.date,
        price: latestMonth.avgPrice,
        trend,
        floor_area_sqm: avgFloorArea,
        storey_range: getMostCommonStoreyRange(latestMonth.storey_range),
        remaining_lease_years: latestMonth.remaining_lease_years[0] || "",
      },
    ];
  }

  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `Cache built with ${Object.keys(cacheMap).length} keys in ${buildTime}s`
  );

  return cacheMap;
}

export async function getCache(): Promise<Record<string, Property[]>> {
  const now = Date.now();

  // Check if cache exists and is still valid
  if (globalForCache.propertyCache) {
    const cacheAge = now - globalForCache.propertyCache.timestamp;
    const ageMinutes = Math.round(cacheAge / 1000 / 60);
    const ageHours = (cacheAge / 1000 / 60 / 60).toFixed(1);

    if (cacheAge < CACHE_TTL) {
      console.log(
        `Using cached data (age: ${ageMinutes} min / ${ageHours} hrs, expires in ${(
          (CACHE_TTL - cacheAge) /
          1000 /
          60 /
          60
        ).toFixed(1)} hrs)`
      );
      return globalForCache.propertyCache.data;
    } else {
      console.log(`Cache expired (age: ${ageHours} hrs)`);
    }
  } else {
    console.log(`🆕 No cache found`);
  }

  // Build new cache
  const data = await buildCache();

  // Store in global cache
  globalForCache.propertyCache = {
    data,
    timestamp: now,
  };

  return data;
}

export async function refreshCache(): Promise<Record<string, Property[]>> {
  console.log("Force refreshing cache...");
  const data = await buildCache();

  globalForCache.propertyCache = {
    data,
    timestamp: Date.now(),
  };

  return data;
}

// Optional: Function to check cache status
export function getCacheStatus(): {
  exists: boolean;
  age: number | null;
  expiresIn: number | null;
} {
  if (!globalForCache.propertyCache) {
    return { exists: false, age: null, expiresIn: null };
  }

  const now = Date.now();
  const age = now - globalForCache.propertyCache.timestamp;
  const expiresIn = CACHE_TTL - age;

  return {
    exists: true,
    age: Math.round(age / 1000 / 60), // in minutes
    expiresIn: Math.round(expiresIn / 1000 / 60), // in minutes
  };
}
