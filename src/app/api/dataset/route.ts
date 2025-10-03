import { Property } from "@/type/property";
import { NextResponse } from "next/server";

const DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
const BASE_URL = "https://data.gov.sg/api/action/datastore_search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const params: Record<string, any> = {
    resource_id: DATASET_ID,
    limit,
    offset,
  };

  const queryString = new URLSearchParams(params).toString();

  const res = await fetch(`${BASE_URL}?${queryString}`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch dataset" },
      { status: res.status }
    );
  }

  const raw = await res.json();
  const records = raw.result.records;

  const properties: Property[] = records.map((r: any, index: number) => {
    const price = parseFloat(r.resale_price);

    return {
      id: index,
      title: `${r.flat_type} in ${r.town}`,
      town: r.town,
      flatType: r.flat_type,
      price,
    };
  });

  const response = NextResponse.json(properties);

  // Cache for 1 day
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=3600"
  );

  return response;
}
