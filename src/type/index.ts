import { DefaultSession } from "next-auth";

export type PropertyTrend = {
  date: string; // YYYY-MM
  // Individual data points
  prices: number[];
  floor_areas: number[];
  storey_ranges: string[];
  // Aggregated values for display
  avgPrice: number;
  floor_area_sqm: number;
  remaining_lease_years: string;
  storey_range: string;
};

export type Property = {
  id: number;
  title: string;
  town: string;
  flatType: string;
  date: string;
  price: number;
  floor_area_sqm: number;
  storey_range: string;
  remaining_lease_years: string;
  trend: PropertyTrend[];
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

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STANDARD" | "PREMIUM";
      renewSubscription: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "STANDARD" | "PREMIUM";
    renewSubscription: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role: "STANDARD" | "PREMIUM";
    renewSubscription: string;
  }
}

export type Filters = {
  town: string;
  flatType: string;
  sortBy: string;
  yearFrom: string;
  yearTo: string;
  monthFrom: string;
  monthTo: string;
  minArea: string;
  maxArea: string;
  minStorey: string;
  maxStorey: string;
  askingPrice?: string;
};

export type SavedFilter = {
  id: string;
  name: string;
  filters: Filters;
  createdAt: string;
};
