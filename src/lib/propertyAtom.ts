import { FairnessOutput, Filters, Property, SavedFilter } from "@/type";
import { atom } from "jotai";

export const defaultFilters: Filters = {
  askingPrice: "0",
  town: "",
  flatType: "",
  sortBy: "price-asc",
  yearFrom: "",
  yearTo: "",
  monthFrom: "",
  monthTo: "",
  minArea: "1",
  maxArea: "250",
  minStorey: "1",
  maxStorey: "50",
};

export const favAtom = atom<Set<number>>(new Set<number>());
export const propertyAtom = atom<Property[]>([]);
export const filtersAtom = atom<Filters>(defaultFilters);
export const savedFiltersAtom = atom<SavedFilter[]>([]);
export const fairnessMapAtom = atom<Record<string, FairnessOutput>>({});
export const askingPriceAtom = atom("0");
export const loadingAtom = atom(false);
export const fairnessLoadingAtom = atom(false);
export const paginationAtom = atom({
  page: 1,
  total: 0,
  totalPages: 1,
});

export type SortOption = "HOT" | "MOST_VOLATILE" | "GROWTH" | null;

export const sortOptionAtom = atom<SortOption>("HOT");

export const sortProperties = (
  properties: Property[],
  sortBy: SortOption
): Property[] => {
  if (!sortBy) return properties;

  const sorted = [...properties];

  switch (sortBy) {
    case "HOT":
      // Sort by highest number of transactions
      return sorted.sort((a, b) => {
        const aTransactions = a.trend.length;
        const bTransactions = b.trend.length;
        return bTransactions - aTransactions;
      });

    case "MOST_VOLATILE":
      // Sort by biggest difference between highest and lowest price
      return sorted.sort((a, b) => {
        const aPrices = a.trend.map((t) => t.avgPrice);
        const bPrices = b.trend.map((t) => t.avgPrice);

        const aVolatility = Math.max(...aPrices) - Math.min(...aPrices);
        const bVolatility = Math.max(...bPrices) - Math.min(...bPrices);

        return bVolatility - aVolatility;
      });

    case "GROWTH":
      // Sort by largest present price increase compared to lowest price
      return sorted.sort((a, b) => {
        const aPrices = a.trend.map((t) => t.avgPrice);
        const bPrices = b.trend.map((t) => t.avgPrice);

        const aLowest = Math.min(...aPrices);
        const bLowest = Math.min(...bPrices);

        const aCurrent = aPrices[aPrices.length - 1] || 0;
        const bCurrent = bPrices[bPrices.length - 1] || 0;

        const aGrowth = ((aCurrent - aLowest) / aLowest) * 100;
        const bGrowth = ((bCurrent - bLowest) / bLowest) * 100;

        return bGrowth - aGrowth;
      });

    default:
      return sorted;
  }
};

export const sortedPropertyAtom = atom((get) => {
  const properties = get(propertyAtom);
  const sortOption = get(sortOptionAtom);
  return sortProperties(properties, sortOption);
});
