"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useSetAtom } from "jotai";
import { filtersAtom } from "@/lib/propertyAtom";
import type { Property } from "@/type";

// Singapore town center coordinates for better map positioning
const townCenters: Record<string, [number, number]> = {
  "Ang Mo Kio": [1.3691, 103.8454],
  Bedok: [1.3236, 103.9273],
  Bishan: [1.3521, 103.8398],
  "Bukit Batok": [1.359, 103.7537],
  "Bukit Merah": [1.2816, 103.8118],
  "Bukit Panjang": [1.3774, 103.7632],
  "Bukit Timah": [1.3294, 103.791],
  "Central Area": [1.2897, 103.8501],
  "Choa Chu Kang": [1.384, 103.747],
  Clementi: [1.3162, 103.7649],
  Geylang: [1.3201, 103.8918],
  Hougang: [1.3612, 103.8863],
  "Jurong East": [1.3329, 103.7436],
  "Jurong West": [1.3404, 103.709],
  "Kallang/Whampoa": [1.3104, 103.8654],
  "Marine Parade": [1.3018, 103.9057],
  "Pasir Ris": [1.3721, 103.9474],
  Punggol: [1.3984, 103.9072],
  Queenstown: [1.2942, 103.786],
  Sembawang: [1.4491, 103.8185],
  Sengkang: [1.3868, 103.8914],
  Serangoon: [1.3554, 103.8679],
  Tampines: [1.3496, 103.9568],
  Tengah: [1.3744, 103.7144],
  "Toa Payoh": [1.3343, 103.8474],
  Woodlands: [1.4382, 103.789],
  Yishun: [1.4304, 103.8354],
};

interface TownStats {
  avgPrice: number;
  count: number;
  avgArea: number;
  trend: Array<{ date: string; avgPrice: number }>;
}

declare global {
  interface Window {
    L: any;
  }
}

export function PropertyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [townData, setTownData] = useState<Record<string, TownStats>>({});
  const [hoveredTown, setHoveredTown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const setFilters = useSetAtom(filtersAtom);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.async = true;
    script.onload = () => {
      fetchTownData();
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const fetchTownData = async () => {
    try {
      const res = await fetch("/api/dataset?all=true");
      const data = await res.json();
      const properties: Property[] = data.data || [];

      const stats: Record<string, TownStats> = {};

      properties.forEach((prop) => {
        const town = prop.town.toLowerCase(); // Store in lowercase for matching
        if (!stats[town]) {
          stats[town] = {
            avgPrice: 0,
            count: 0,
            avgArea: 0,
            trend: [],
          };
        }

        stats[town].count++;
        stats[town].avgPrice += prop.price;
        stats[town].avgArea += prop.floor_area_sqm;

        // Collect trend data
        prop.trend.forEach((t) => {
          const existing = stats[town].trend.find((tr) => tr.date === t.date);
          if (existing) {
            existing.avgPrice = (existing.avgPrice + t.avgPrice) / 2;
          } else {
            stats[town].trend.push({ date: t.date, avgPrice: t.avgPrice });
          }
        });
      });

      // Calculate averages
      Object.keys(stats).forEach((town) => {
        stats[town].avgPrice = stats[town].avgPrice / stats[town].count;
        stats[town].avgArea = stats[town].avgArea / stats[town].count;
        stats[town].trend.sort((a, b) => a.date.localeCompare(b.date));
      });

      console.log("Town data loaded:", Object.keys(stats));
      console.log("Sample stats:", stats[Object.keys(stats)[0]]);

      setTownData(stats);
      initializeMap(stats);
    } catch (error) {
      console.error("Error fetching town data:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (stats: Record<string, TownStats>) => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([1.3521, 103.8198], 11);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    // Add markers for each town
    Object.entries(townCenters).forEach(([town, coords]) => {
      const townKey = town.toLowerCase(); // Convert to lowercase for lookup
      const townStats = stats[townKey];

      if (!townStats) {
        console.log(
          `No stats found for town: ${town} (looking for: ${townKey})`
        );
        return;
      }

      console.log(`Adding marker for ${town}:`, {
        count: townStats.count,
        avgPrice: townStats.avgPrice,
      });

      const marker = L.circleMarker(coords, {
        radius: Math.min(Math.max(townStats.count / 20, 8), 25),
        fillColor: "#3b82f6",
        color: "#1e40af",
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3,
      }).addTo(map);

      marker.on("mouseover", function (this: any) {
        this.setStyle({
          fillOpacity: 0.7,
          weight: 3,
          color: "#1e3a8a",
        });
        setHoveredTown(town);
      });

      marker.on("mouseout", function (this: any) {
        this.setStyle({
          fillOpacity: 0.3,
          weight: 2,
          color: "#1e40af",
        });
        setHoveredTown(null);
      });

      marker.on("click", () => {
        setFilters((prev) => ({ ...prev, town }));
      });

      markersRef.current.push(marker);
    });
  };

  const toTitleCase = (str: string) => {
    return str;
  };

  const getTrendIcon = (trend: Array<{ date: string; avgPrice: number }>) => {
    if (trend.length < 2) return <Minus className="w-4 h-4 text-gray-600" />;
    const first = trend[0].avgPrice;
    const last = trend[trend.length - 1].avgPrice;
    const change = ((last - first) / first) * 100;

    if (change > 2) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-blue-600" />;
  };

  const getPriceTrend = (trend: Array<{ date: string; avgPrice: number }>) => {
    if (trend.length < 2) return "0.0%";
    const first = trend[0].avgPrice;
    const last = trend[trend.length - 1].avgPrice;
    const change = ((last - first) / first) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const stats = hoveredTown && townData[hoveredTown.toLowerCase()];

  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="relative h-[600px]">
        <div ref={mapRef} className="w-full h-full rounded-xl" />

        {hoveredTown && stats && (
          <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-5 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {hoveredTown}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {stats.count} properties
                  </p>
                </div>
                {getTrendIcon(stats.trend)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Avg Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(stats.avgPrice / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {getPriceTrend(stats.trend)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Avg Area</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.avgArea.toFixed(0)} m²
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">
                  Price Trend
                </p>
                <div className="flex items-end gap-1 h-16">
                  {stats.trend.slice(-8).map((point, i) => {
                    const max = Math.max(...stats.trend.map((t) => t.avgPrice));
                    const height = (point.avgPrice / max) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%` }}
                        title={`${
                          point.date
                        }: $${point.avgPrice.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-400 italic text-center pt-2 border-t border-gray-100">
                Click to filter by this town
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">
                Loading map data...
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
