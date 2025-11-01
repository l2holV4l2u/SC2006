"use client";
import { Button } from "@/components/ui/button";
import { Flame, Activity, LineChart } from "lucide-react";
import { useAtom } from "jotai";
import { sortOptionAtom, SortOption } from "@/lib/propertyAtom";

export function SortButtons() {
  const [sortOption, setSortOption] = useAtom(sortOptionAtom);

  const badges: {
    value: SortOption;
    label: string;
    icon: any;
    color: string;
  }[] = [
    {
      value: "HOT",
      label: "Hot",
      icon: Flame,
      color: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    {
      value: "MOST_VOLATILE",
      label: "Most Volatile",
      icon: Activity,
      color: "bg-purple-500 hover:bg-purple-600 text-white",
    },
    {
      value: "GROWTH",
      label: "Growth",
      icon: LineChart,
      color: "bg-emerald-500 hover:bg-emerald-600 text-white",
    },
  ];

  return (
    <div className="flex gap-2 items-center">
      {badges.map((badge) => {
        const Icon = badge.icon;
        const isActive = sortOption === badge.value;

        return (
          <Button
            key={badge.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={isActive ? badge.color : ""}
            onClick={() => setSortOption(isActive ? null : badge.value)}
          >
            <Icon /> {badge.label}
          </Button>
        );
      })}
    </div>
  );
}
