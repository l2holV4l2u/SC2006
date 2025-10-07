export type Property = {
  id: number;
  title: string;
  town: string;
  flatType: string;
  price: number;
  date: string;
  trend: { date: string; avgPrice: number }[];
  floor_area_sqm: number;
  remaining_lease_years: number;
  storey_range?: string;
};

export type SubjectInput = {
  asking_price: number | string;
  town: string;
  flat_type: string;
  floor_area_sqm: number | string;
  remaining_lease_years: number | string;
  storey_range?: string;
};

export type Comparable = {
  month: string;
  town: string;
  flat_type: string;
  floor_area_sqm: number;
  remaining_lease_years: number;
  resale_price: number;
  storey_range?: string;
  ppsm?: number;
  ppsm_adj?: number;
  w?: number;
};

export type Coeffs = {
  beta_lease: number;
  gamma_logarea: number;
};

export type FairnessOutput = {
  fair_price: number;
  band_low: number;
  band_high: number;
  dev_pct: number | null;
  label: "Fair" | "Advantageous" | "Disadvantageous" | "INSUFFICIENT_DATA";
  comps: Comparable[];
};
