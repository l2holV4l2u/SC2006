// /app/api/fairness/route.ts
import { NextResponse } from "next/server";
import { SubjectInput, Comparable, Coeffs, FairnessOutput } from "@/type";

// Helper: Weighted median
function weightedMedian(values: number[], weights: number[]): number {
  const sorted = values
    .map((v, i) => ({ v, w: weights[i] }))
    .sort((a, b) => a.v - b.v);
  const cumWeights = sorted.map((_, i) =>
    sorted.slice(0, i + 1).reduce((a, b) => a + b.w, 0)
  );
  const totalWeight = cumWeights[cumWeights.length - 1];
  const idx = cumWeights.findIndex((cw) => cw / totalWeight >= 0.5);
  return sorted[idx].v;
}

function weightedMAD(values: number[], weights: number[]): number {
  const med = weightedMedian(values, weights);
  const dev = values.map((v) => Math.abs(v - med));
  return weightedMedian(dev, weights);
}

function computeFairness(
  subject: SubjectInput,
  dataset: Comparable[],
  coeffs: Coeffs
): FairnessOutput {
  const ask =
    typeof subject.asking_price === "string"
      ? parseFloat(subject.asking_price)
      : subject.asking_price;
  const town = subject.town;
  const ftype = subject.flat_type;
  const A =
    typeof subject.floor_area_sqm === "string"
      ? parseFloat(subject.floor_area_sqm)
      : subject.floor_area_sqm;
  const L =
    typeof subject.remaining_lease_years === "string"
      ? parseFloat(subject.remaining_lease_years)
      : subject.remaining_lease_years;
  const storey_s = subject.storey_range;

  // Filter pool
  let pool = dataset.filter((r) => r.town === town && r.flat_type === ftype);

  // Hedonic adjustment & weights
  const comps = pool.map((r) => {
    const ppsm = r.resale_price / r.floor_area_sqm;
    const dlease = L - r.remaining_lease_years;
    const dlogA = Math.log(A) - Math.log(r.floor_area_sqm);
    const ppsm_adj =
      ppsm *
      Math.exp(coeffs.beta_lease * dlease + coeffs.gamma_logarea * dlogA);
    const d = Math.sqrt(
      (dlease / 5) ** 2 + ((A - r.floor_area_sqm) / (0.15 * A)) ** 2
    );
    const w = 1 / (1 + d);
    return { ...r, ppsm_adj, w };
  });

  if (!comps.length)
    return {
      fair_price: NaN,
      band_low: NaN,
      band_high: NaN,
      dev_pct: null,
      label: "INSUFFICIENT_DATA",
      comps: [],
    };

  const ppsmAdjArr = comps.map((r) => r.ppsm_adj!);
  const weights = comps.map((r) => r.w!);
  const fair_ppsm = weightedMedian(ppsmAdjArr, weights);
  const mad_ppsm = weightedMAD(ppsmAdjArr, weights);

  const fair_price = fair_ppsm * A;
  const sigma = mad_ppsm * A;
  const tau = fair_price > 0 ? Math.max(0.05, 1.2 * (sigma / fair_price)) : 0.1;
  const dev_pct = fair_price > 0 ? ask / fair_price - 1 : null;

  let label: FairnessOutput["label"] = "Fair";
  if (dev_pct === null) label = "INSUFFICIENT_DATA";
  else if (dev_pct <= -tau) label = "Advantageous";
  else if (dev_pct >= tau) label = "Disadvantageous";

  return {
    fair_price,
    band_low: fair_price - sigma,
    band_high: fair_price + sigma,
    dev_pct,
    label,
    comps: comps.slice(0, 5),
  };
}

// API Handler
export async function POST(req: Request) {
  try {
    const { subject, dataset, coeffs } = await req.json();
    if (!subject || !dataset || !coeffs)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const result = computeFairness(subject, dataset, coeffs);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
