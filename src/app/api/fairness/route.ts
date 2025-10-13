import { NextResponse } from "next/server";
import {
  SubjectInput,
  Comparable,
  Coeffs,
  FairnessOutput,
  Property,
} from "@/type";
import { getCache } from "@/lib/dataset";

// Helper: Weighted median
function weightedMedian(values: number[], weights: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = values
    .map((v, i) => ({ v, w: weights[i] }))
    .sort((a, b) => a.v - b.v);
  const totalWeight = sorted.reduce((sum, item) => sum + item.w, 0);
  let cumWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumWeight += sorted[i].w;
    if (cumWeight / totalWeight >= 0.5) {
      return sorted[i].v;
    }
  }
  return sorted[sorted.length - 1].v;
}

function weightedMAD(values: number[], weights: number[]): number {
  if (values.length === 0) return NaN;
  const med = weightedMedian(values, weights);
  const dev = values.map((v) => Math.abs(v - med));
  return weightedMedian(dev, weights);
}

// Helper to normalize dataset record
function normalizeRecord(r: any): Comparable {
  return {
    month: r.month || r.date || "",
    town: (r.town || "").toLowerCase().trim(),
    flat_type: (r.flatType || "").toLowerCase().trim(),
    floor_area_sqm: parseFloat(r.floor_area_sqm || 0),
    remaining_lease_years: parseFloat(r.remaining_lease_years || 0),
    resale_price: parseFloat(r.price || 0),
    storey_range: r.storey_range || "",
  };
}

function computeFairness(
  subject: SubjectInput,
  dataset: any[],
  coeffs: Coeffs
): FairnessOutput {
  const ask =
    typeof subject.asking_price === "string"
      ? parseFloat(subject.asking_price)
      : subject.asking_price;

  const town = (subject.town || "").toLowerCase().trim();
  const ftype = (subject.flat_type || "").toLowerCase().trim();
  const A = parseFloat(subject.floor_area_sqm as any);
  const L = parseFloat(subject.remaining_lease_years as any);

  const normalizedDataset: Comparable[] = [];
  dataset.forEach((prop: Property) => {
    prop.trend.forEach((t) => {
      normalizedDataset.push({
        month: t.date,
        town: prop.town.toLowerCase().trim(),
        flat_type: prop.flatType.toLowerCase().trim(),
        floor_area_sqm: t.floor_area_sqm || prop.floor_area_sqm || 0,
        remaining_lease_years: parseFloat(t.remaining_lease_years || "0"),
        resale_price: t.avgPrice || prop.price || 0,
        storey_range: t.storey_range || prop.storey_range || "",
      });
    });
  });

  let pool = normalizedDataset.filter(
    (r) => r.town === town && r.flat_type === ftype && r.floor_area_sqm > 0
  );

  if (pool.length < 3) {
    return {
      fair_price: NaN,
      band_low: NaN,
      band_high: NaN,
      dev_pct: null,
      label: "INSUFFICIENT_DATA",
      comps: [],
    };
  }

  // Hedonic adjustment & weights
  const comps = pool.map((r) => {
    const ppsm = r.resale_price / r.floor_area_sqm;
    const dlease = L - r.remaining_lease_years;
    const dlogA = Math.log(A) - Math.log(r.floor_area_sqm);
    const ppsm_adj =
      ppsm *
      Math.exp(coeffs.beta_lease * dlease + coeffs.gamma_logarea * dlogA);
    const d = Math.sqrt(
      Math.pow(dlease / 5, 2) + Math.pow((A - r.floor_area_sqm) / (0.15 * A), 2)
    );
    const w = 1 / (1 + d);
    return { ...r, ppsm, ppsm_adj, w };
  });

  const topComps = comps
    .sort((a, b) => (b.w || 0) - (a.w || 0))
    .slice(0, Math.min(50, comps.length));

  const ppsmAdjArr = topComps.map((r) => r.ppsm_adj!);
  const weights = topComps.map((r) => r.w!);
  const fair_ppsm = weightedMedian(ppsmAdjArr, weights);
  const mad_ppsm = weightedMAD(ppsmAdjArr, weights);
  const fair_price = fair_ppsm * A;
  const sigma = mad_ppsm * A * 1.4826;

  const dev_pct = fair_price > 0 ? (ask - fair_price) / fair_price : null;
  const cv = sigma / fair_price;
  const tau = Math.max(0.08, Math.min(0.2, cv));

  let label: FairnessOutput["label"] = "Fair";
  if (dev_pct === null || isNaN(fair_price)) label = "INSUFFICIENT_DATA";
  else if (dev_pct < -tau) label = "Advantageous";
  else if (dev_pct > tau) label = "Disadvantageous";

  return {
    fair_price: Math.round(fair_price),
    band_low: Math.round(fair_price - sigma),
    band_high: Math.round(fair_price + sigma),
    dev_pct,
    label,
    comps: topComps.slice(0, 5),
  };
}

export async function POST(req: Request) {
  try {
    const { subjects, coeffs } = await req.json(); // note: subjects is an array

    if (!subjects || !coeffs) {
      return NextResponse.json(
        { error: "Missing required fields: subjects or coeffs" },
        { status: 400 }
      );
    }

    const cache = await getCache();

    console.log(cache);

    const results = subjects.map((subject: any) => {
      if (!subject.town || !subject.flat_type) {
        return { error: "Missing required fields (town, flat_type)" };
      }

      const datasetKey = `${subject.town.toLowerCase()}|${subject.flat_type.toLowerCase()}`;
      const dataset = cache[datasetKey] || [];

      if (dataset.length === 0) {
        return {
          error: `No dataset found for ${subject.town} ${subject.flat_type}`,
        };
      }

      return computeFairness(subject, dataset, coeffs);
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("Fairness API error:", err);
    return NextResponse.json(
      {
        error: "Internal error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
