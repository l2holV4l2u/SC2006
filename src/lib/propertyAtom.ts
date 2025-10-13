import { Filters, SavedFilter } from "@/type";
import { atom } from "jotai";

const defaultFilters: Filters = {
  town: "",
  flatType: "",
  sortBy: "price-asc",
  monthFrom: "",
  monthTo: "",
  minArea: "",
  maxArea: "",
  minStorey: "",
  maxStorey: "",
  askingPrice: "",
};

export const favAtom = atom<Set<number>>(new Set<number>());
export const askingPriceAtom = atom<string>("0");
export const filtersAtom = atom<Filters>(defaultFilters);
export const savedFiltersAtom = atom<SavedFilter[]>([]);
