import { FairnessOutput, Filters, Property, SavedFilter } from "@/type";
import { atom } from "jotai";

export const defaultFilters: Filters = {
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
