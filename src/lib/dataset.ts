import { Property } from "@/type";

const DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
const BASE_URL = "https://data.gov.sg/api/action/datastore_search";

// ---- In-memory cache ----
let cacheMap: Record<string, Property[]> = {}; // key = "town|flatType"
let lastFetched = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

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
  console.log(`Fetched total ${allRecords.length} records.`);
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
export async function buildCache() {
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

  cacheMap = {};
  let idCounter = 0;
  for (const [key, monthData] of Object.entries(grouped)) {
    const [town, flatType] = key.split("|");

    const trend = Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => {
        const avgLease =
          data.remainingLeaseYears.reduce((a: number, b: number) => a + b, 0) /
          data.remainingLeaseYears.length;

        return {
          date: month,
          prices: data.prices,
          floor_areas: data.floorAreas,
          storey_ranges: data.storeyRanges,
          avgPrice:
            data.prices.reduce((a: number, b: number) => a + b, 0) /
            data.prices.length,
          floor_area_sqm:
            data.floorAreas.reduce((a: number, b: number) => a + b, 0) /
            data.floorAreas.length,
          storey_range: getMostCommonStoreyRange(data.storeyRanges),
          remaining_lease_years: formatRemainingLease(avgLease),
        };
      });

    const latestMonth = trend.at(-1)!;
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
        remaining_lease_years: latestMonth.remaining_lease_years,
      },
    ];
  }

  lastFetched = Date.now();
  console.log("Cache built with", Object.keys(cacheMap).length, "keys");
}

export async function getCache() {
  if (!Object.keys(cacheMap).length || Date.now() - lastFetched > CACHE_TTL) {
    console.log("Rebuilding cache...");
    await buildCache();
  }
  return cacheMap;
}
