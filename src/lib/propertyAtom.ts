import { atom } from "jotai";

export const favAtom = atom<Set<number>>(new Set<number>());
